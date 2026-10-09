import { sequelize } from "../database/sequelize.js";
import { QueryTypes } from "sequelize";

/**
 * Recaudación = lo que entró a la caja: planes cobrados (membresías, por su fecha de inicio, que es
 * el día del cobro) + ventas de productos del mostrador (movimiento_stock tipo "venta").
 * Las conexiones están en hora argentina: los días y meses salen bien sin convertir.
 * Los filtros son rangos de fechas (no EXTRACT) para que Postgres use los índices.
 */

function validarAnioMesDia({ anio, mes = null, dia = null }) {
  if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) throw new Error("ANIO_INVALIDO");
  if (mes !== null && (!Number.isInteger(mes) || mes < 1 || mes > 12)) throw new Error("MES_INVALIDO");
  if (dia !== null && (!Number.isInteger(dia) || dia < 1 || dia > 31)) throw new Error("DIA_INVALIDO");
}

// El método se guarda como texto libre ("EFECTIVO", "efectivo "): se agrupa normalizado.
// `columna` es siempre un nombre fijo escrito acá, nunca un dato del usuario.
const METODO_SQL = (columna) => `COALESCE(NULLIF(UPPER(TRIM(${columna})), ''), 'SIN DATO')`;
const normalizarMetodo = (metodo) => String(metodo ?? "").trim().toUpperCase() || "SIN DATO";

/** [{ metodo, total }] de mayor a menor, a partir de filas con { metodo, total }. */
function sumarPorMetodo(filas) {
  const mapa = new Map();
  for (const { metodo, total } of filas) mapa.set(metodo, (mapa.get(metodo) ?? 0) + Number(total || 0));
  return [...mapa.entries()].map(([metodo, total]) => ({ metodo, total })).sort((a, b) => b.total - a.total);
}

const conTotal = (fila) => ({ ...fila, total: fila.planes + fila.productos });

/** Por mes del año: { mes, planes, productos, total }. Una sola consulta. */
export async function obtenerRecaudacionMesesPorAnio({ anio }) {
  validarAnioMesDia({ anio });

  const rows = await sequelize.query(
    `
    SELECT 'planes' AS origen, EXTRACT(MONTH FROM f.fecha_inicio)::int AS mes, SUM(f.monto_pagado::numeric) AS total
    FROM gym_v3.vista_recaudacion_completa f
    WHERE f.fecha_inicio >= make_date(:anio, 1, 1) AND f.fecha_inicio < make_date(:anio + 1, 1, 1)
      AND COALESCE(f.monto_pagado, 0) > 0
    GROUP BY 2
    UNION ALL
    SELECT 'productos', EXTRACT(MONTH FROM m.creado_en)::int, SUM(m.cantidad * m.precio_unitario)::numeric
    FROM gym_v3.movimiento_stock m
    WHERE m.tipo = 'venta' AND m.creado_en >= make_date(:anio, 1, 1) AND m.creado_en < make_date(:anio + 1, 1, 1)
    GROUP BY 2;
    `,
    { type: QueryTypes.SELECT, replacements: { anio } },
  );

  const items = Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, planes: 0, productos: 0 }));
  for (const row of rows) {
    const item = items[Number(row.mes) - 1];
    if (item) item[row.origen] += Number(row.total || 0);
  }
  return { items: items.map(conTotal) };
}

/** Por día del mes ({ dia, planes, productos, total }) y lo que entró por cada método en el mes. */
export async function obtenerRecaudacionDiasDeMes({ anio, mes }) {
  validarAnioMesDia({ anio, mes });

  // Agrupado por día, origen y método: con eso salen los dos resúmenes en una sola consulta.
  const rows = await sequelize.query(
    `
    SELECT 'planes' AS origen, f.fecha_inicio::date AS dia, ${METODO_SQL("f.metodo_pago")} AS metodo,
           SUM(f.monto_pagado::numeric) AS total
    FROM gym_v3.vista_recaudacion_completa f
    WHERE f.fecha_inicio >= make_date(:anio, :mes, 1) AND f.fecha_inicio < make_date(:anio, :mes, 1) + interval '1 month'
      AND COALESCE(f.monto_pagado, 0) > 0
    GROUP BY 2, 3
    UNION ALL
    SELECT 'productos', m.creado_en::date, ${METODO_SQL("m.metodo_pago")}, SUM(m.cantidad * m.precio_unitario)::numeric
    FROM gym_v3.movimiento_stock m
    WHERE m.tipo = 'venta'
      AND m.creado_en >= make_date(:anio, :mes, 1) AND m.creado_en < make_date(:anio, :mes, 1) + interval '1 month'
    GROUP BY 2, 3
    ORDER BY 2;
    `,
    { type: QueryTypes.SELECT, replacements: { anio, mes } },
  );

  const porDia = new Map();
  for (const row of rows) {
    const dia = String(row.dia).slice(0, 10);
    const item = porDia.get(dia) ?? { dia, planes: 0, productos: 0 };
    item[row.origen] += Number(row.total || 0);
    porDia.set(dia, item);
  }

  return { items: [...porDia.values()].map(conTotal), metodos: sumarPorMetodo(rows) };
}

/** Cobros de planes y ventas de productos de un día, con los totales y lo que entró por método. */
export async function obtenerDetalleRecaudacionDia({ anio, mes, dia }) {
  validarAnioMesDia({ anio, mes, dia });

  const fecha = `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

  const sqlPlanes = `
    SELECT
      f.id AS gym_fecha_id,
      f.fecha_inicio,
      f.monto_pagado AS gym_fecha_montopagado,
      f.metodo_pago AS gym_fecha_metodopago,
      p_alumno.nombre AS alumno_nombre,
      p_alumno.apellido AS alumno_apellido,
      p_alumno.documento::text AS alumno_documento,
      tp.descripcion AS plan_descripcion,
      p_usuario.nombre AS usuario_nombre,
      p_usuario.apellido AS usuario_apellido
    FROM (
      SELECT id, alumno_id, plan_tipo_id, cobrado_por_id,
             monto_pagado, fecha_inicio, actualizado_en, metodo_pago
      FROM public.membresia
      WHERE fecha_inicio = :fecha::date AND COALESCE(monto_pagado, 0) > 0
      UNION ALL
      SELECT id, alumno_id, plan_tipo_id, cobrado_por_id,
             monto_pagado, fecha_inicio, actualizado_en, metodo_pago
      FROM gym_v3.membresia
      WHERE fecha_inicio = :fecha::date AND COALESCE(monto_pagado, 0) > 0
        AND id NOT IN (SELECT id FROM public.membresia WHERE fecha_inicio = :fecha::date)
    ) f
    LEFT JOIN (
      SELECT a.id, a.persona_id FROM public.alumno a
      UNION ALL
      SELECT a.id, a.persona_id FROM gym_v3.alumno a WHERE a.id NOT IN (SELECT id FROM public.alumno)
    ) a ON a.id = f.alumno_id
    LEFT JOIN (
      SELECT p.id, p.nombre, p.apellido, p.documento::text AS documento FROM public.persona p
      UNION ALL
      SELECT p.id, p.nombre, p.apellido, p.documento FROM gym_v3.persona p WHERE p.id NOT IN (SELECT id FROM public.persona)
    ) p_alumno ON p_alumno.id = a.persona_id
    LEFT JOIN (
      SELECT pt.id, pt.descripcion FROM public.plan_tipo pt
      UNION ALL
      SELECT pt.id, pt.descripcion FROM gym_v3.plan_tipo pt WHERE pt.id NOT IN (SELECT id FROM public.plan_tipo)
    ) tp ON tp.id = f.plan_tipo_id
    LEFT JOIN (
      SELECT u.id, u.persona_id FROM public.usuario u
      UNION ALL
      SELECT u.id, u.persona_id FROM gym_v3.usuario u WHERE u.id NOT IN (SELECT id FROM public.usuario)
    ) u ON u.id = f.cobrado_por_id
    LEFT JOIN (
      SELECT p.id, p.nombre, p.apellido FROM public.persona p
      UNION ALL
      SELECT p.id, p.nombre, p.apellido FROM gym_v3.persona p WHERE p.id NOT IN (SELECT id FROM public.persona)
    ) p_usuario ON p_usuario.id = u.persona_id
    ORDER BY f.id ASC;
  `;

  // La base no guarda la hora del cobro (actualizado_en cambia con cada ingreso del alumno):
  // tanto los planes como las ventas se listan en el orden en que se registraron.
  const sqlVentas = `
    SELECT m.id, p.nombre AS producto, m.cantidad, (m.cantidad * m.precio_unitario)::numeric AS monto,
           m.metodo_pago, pu.nombre AS usuario_nombre, pu.apellido AS usuario_apellido
    FROM gym_v3.movimiento_stock m
    JOIN gym_v3.producto p ON p.id = m.producto_id
    LEFT JOIN gym_v3.usuario u ON u.id = m.registrado_por_id
    LEFT JOIN gym_v3.persona pu ON pu.id = u.persona_id
    WHERE m.tipo = 'venta' AND m.creado_en >= :fecha::date AND m.creado_en < :fecha::date + 1
    ORDER BY m.id ASC;
  `;

  const [rowsPlanes, rowsVentas] = await Promise.all([
    sequelize.query(sqlPlanes, { type: QueryTypes.SELECT, replacements: { fecha } }),
    sequelize.query(sqlVentas, { type: QueryTypes.SELECT, replacements: { fecha } }),
  ]);

  const items = rowsPlanes.map((row) => ({
    gym_fecha_id:     row.gym_fecha_id,
    fecha_inicio:     row.fecha_inicio,
    monto:            Number(row.gym_fecha_montopagado || 0),
    metodo_pago:      normalizarMetodo(row.gym_fecha_metodopago),
    alumno:           [row.alumno_nombre, row.alumno_apellido].filter(Boolean).join(" "),
    alumno_documento: row.alumno_documento || null,
    plan:             row.plan_descripcion || null,
    usuario_cobro:    [row.usuario_nombre, row.usuario_apellido].filter(Boolean).join(" "),
  }));

  const ventas = rowsVentas.map((row) => ({
    id:          row.id,
    producto:    row.producto,
    cantidad:    Number(row.cantidad),
    monto:       Number(row.monto || 0),
    metodo_pago: normalizarMetodo(row.metodo_pago),
    usuario:     [row.usuario_nombre, row.usuario_apellido].filter(Boolean).join(" "),
  }));

  const sumar = (lista) => lista.reduce((acc, item) => acc + item.monto, 0);
  const totalPlanes = sumar(items);
  const totalProductos = sumar(ventas);

  return {
    total_dia:       totalPlanes + totalProductos,
    total_planes:    totalPlanes,
    total_productos: totalProductos,
    cantidad_cobros: items.length,
    items,
    ventas,
    metodos: sumarPorMetodo([...items, ...ventas].map((x) => ({ metodo: x.metodo_pago, total: x.monto }))),
  };
}
