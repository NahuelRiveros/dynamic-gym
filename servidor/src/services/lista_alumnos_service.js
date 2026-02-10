// src/services/lista_alumnos_service.js
import { sequelize } from "../database/sequelize.js";

const hoyISO = () => new Date().toISOString().slice(0, 10);

export async function listarAlumnos({
  q,
  dni,
  estado_id,
  plan_vigente,
  page,
  limit,
  sort,
  order,
}) {
  const offset = (page - 1) * limit;
  const hoy = hoyISO();

  // ✅ filtros dinámicos
  const where = [];
  const repl = { hoy, limit, offset };

  if (dni) {
    where.push(`p.gym_persona_documento ILIKE :dni`);
    repl.dni = `%${dni}%`;
  }

  if (q) {
    where.push(`
      (
        p.gym_persona_documento ILIKE :q OR
        p.gym_persona_nombre ILIKE :q OR
        p.gym_persona_apellido ILIKE :q OR
        COALESCE(p.gym_persona_email,'') ILIKE :q
      )
    `);
    repl.q = `%${q}%`;
  }

  if (estado_id != null) {
    where.push(`a.gym_alumno_rela_estadoalumno = :estado_id`);
    repl.estado_id = estado_id;
  }

  // plan vigente: lo sacamos del lateral
  if (plan_vigente === true) {
    where.push(`fvig.gym_fecha_id IS NOT NULL`);
  }
  if (plan_vigente === false) {
    where.push(`fvig.gym_fecha_id IS NULL`);
  }

  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // ✅ sort whitelist (para evitar SQL injection)
  const sortMap = {
    apellido: `p.gym_persona_apellido`,
    nombre: `p.gym_persona_nombre`,
    dni: `p.gym_persona_documento`,
    estado: `a.gym_alumno_rela_estadoalumno`,
    vencimiento: `fvig.gym_fecha_fin`,
  };
  const sortSQL = sortMap[sort] ?? sortMap.apellido;
  const orderSQL = order === "asc" ? "ASC" : "DESC";

  // ✅ query principal (items)
  const sqlItems = `
    SELECT
      a.gym_alumno_id,
      a.gym_alumno_rela_estadoalumno,
      a.gym_alumno_rela_tipoplan,

      p.gym_persona_id,
      p.gym_persona_nombre,
      p.gym_persona_apellido,
      p.gym_persona_documento,
      p.gym_persona_email,
      p.gym_persona_celular,

      fvig.gym_fecha_id AS plan_id,
      fvig.gym_fecha_inicio AS plan_inicio,
      fvig.gym_fecha_fin AS plan_fin,
      fvig.gym_fecha_ingresosdisponibles AS ingresos_disponibles,
      fvig.gym_fecha_rela_tipoplan AS plan_tipo_id

    FROM public.gym_alumno a
    JOIN public.gym_persona p
      ON p.gym_persona_id = a.gym_alumno_rela_persona

    -- ✅ Trae plan vigente (si existe) para HOY
    LEFT JOIN LATERAL (
      SELECT
        f.gym_fecha_id,
        f.gym_fecha_inicio,
        f.gym_fecha_fin,
        f.gym_fecha_ingresosdisponibles,
        f.gym_fecha_rela_tipoplan
      FROM public.gym_fecha_disponible f
      WHERE f.gym_fecha_rela_alumno = a.gym_alumno_id
        AND f.gym_fecha_inicio <= :hoy
        AND f.gym_fecha_fin >= :hoy
      ORDER BY f.gym_fecha_fin DESC, f.gym_fecha_id DESC
      LIMIT 1
    ) fvig ON TRUE

    ${whereSQL}
    ORDER BY ${sortSQL} ${orderSQL}
    LIMIT :limit OFFSET :offset
  `;

  // ✅ query count (para paginación)
  const sqlCount = `
    SELECT COUNT(*)::int AS total
    FROM public.gym_alumno a
    JOIN public.gym_persona p
      ON p.gym_persona_id = a.gym_alumno_rela_persona
    LEFT JOIN LATERAL (
      SELECT f.gym_fecha_id
      FROM public.gym_fecha_disponible f
      WHERE f.gym_fecha_rela_alumno = a.gym_alumno_id
        AND f.gym_fecha_inicio <= :hoy
        AND f.gym_fecha_fin >= :hoy
      ORDER BY f.gym_fecha_fin DESC, f.gym_fecha_id DESC
      LIMIT 1
    ) fvig ON TRUE
    ${whereSQL}
  `;

  const [items] = await sequelize.query(sqlItems, { replacements: repl });
  const [countRows] = await sequelize.query(sqlCount, { replacements: repl });

  const total = countRows?.[0]?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  return {
    ok: true,
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}
