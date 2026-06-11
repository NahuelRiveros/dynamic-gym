/**
 * exportar_datos.mjs
 *
 * Exporta todos los datos de la base de datos actual a:
 *   - Un archivo Excel (.xlsx) con hojas legibles para contabilidad/archivo
 *   - Archivos JSON por entidad para usar en la migración al nuevo schema
 *
 * Uso:
 *   cd servidor
 *   node scripts/exportar_datos.mjs
 *
 * Salida en: servidor/backups/YYYYMMDD_HHMM/
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import pg from "pg";
import ExcelJS from "exceljs";

// ── Cargar .env desde servidor/.env ─────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

// ── Conexión a la base de datos ──────────────────────────────────────────────
const { Pool } = pg;

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      host:     process.env.DB_HOST     || "localhost",
      port:     Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME     || "dynamicgym",
      user:     process.env.DB_USER     || "postgres",
      password: process.env.DB_PASS     || "",
    });

// ── Directorio de salida ─────────────────────────────────────────────────────
const ahora    = new Date();
const fechaStr = ahora.toISOString().slice(0, 16).replace("T", "_").replace(":", "");
const dirSalida = path.join(__dirname, "../backups", fechaStr);
fs.mkdirSync(dirSalida, { recursive: true });

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function fmtMonto(n) {
  return n == null ? "" : Number(n).toLocaleString("es-AR", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
}

function estiloCabecera(sheet, color = "1F4E79") {
  const fila = sheet.getRow(1);
  fila.eachCell((cell) => {
    cell.font      = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${color}` } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border    = {
      bottom: { style: "thin", color: { argb: "FF000000" } },
    };
  });
  fila.height = 22;
  sheet.views = [{ state: "frozen", ySplit: 1 }];
}

function autoAncho(sheet, min = 10, max = 50) {
  sheet.columns.forEach((col) => {
    let largo = min;
    col.eachCell({ includeEmpty: false }, (cell) => {
      const val = cell.value ? String(cell.value).length : 0;
      if (val > largo) largo = val;
    });
    col.width = Math.min(largo + 2, max);
  });
}

// ── Consultas SQL ────────────────────────────────────────────────────────────

async function qRecaudacionMensual() {
  const { rows } = await pool.query(`
    SELECT
      TO_CHAR(DATE_TRUNC('month', m.fecha_inicio), 'YYYY-MM') AS periodo,
      TO_CHAR(DATE_TRUNC('month', m.fecha_inicio), 'MM/YYYY') AS mes_anio,
      COUNT(*)                                                 AS cantidad_pagos,
      SUM(m.monto_pagado)                                      AS total_recaudado,
      SUM(CASE WHEN m.metodo_pago = 'efectivo'     THEN m.monto_pagado ELSE 0 END) AS efectivo,
      SUM(CASE WHEN m.metodo_pago = 'transferencia' THEN m.monto_pagado ELSE 0 END) AS transferencia,
      SUM(CASE WHEN m.metodo_pago NOT IN ('efectivo','transferencia') THEN m.monto_pagado ELSE 0 END) AS otro
    FROM membresia m
    GROUP BY DATE_TRUNC('month', m.fecha_inicio)
    ORDER BY DATE_TRUNC('month', m.fecha_inicio) DESC
  `);
  return rows;
}

async function qDetallePagos() {
  const { rows } = await pool.query(`
    SELECT
      m.id,
      p.apellido || ', ' || p.nombre  AS alumno,
      p.documento                      AS dni,
      pt.descripcion                   AS plan,
      m.monto_pagado,
      m.metodo_pago,
      m.fecha_inicio,
      m.fecha_fin,
      m.dias_totales,
      m.ingresos_disponibles,
      COALESCE(up.apellido || ', ' || up.nombre, '') AS cobrado_por,
      m.actualizado_en
    FROM membresia m
    JOIN alumno  a  ON a.id  = m.alumno_id
    JOIN persona p  ON p.id  = a.persona_id
    LEFT JOIN plan_tipo  pt  ON pt.id = m.plan_tipo_id
    LEFT JOIN usuario    u   ON u.id  = m.cobrado_por_id
    LEFT JOIN persona    up  ON up.id = u.persona_id
    ORDER BY m.fecha_inicio DESC
  `);
  return rows;
}

async function qIngresosDiarios() {
  const { rows } = await pool.query(`
    SELECT
      i.id,
      p.apellido || ', ' || p.nombre AS alumno,
      p.documento                    AS dni,
      i.fecha_ingreso,
      i.hora_ingreso,
      i.creado_en
    FROM ingreso i
    JOIN membresia m ON m.id = i.membresia_id
    JOIN alumno    a ON a.id = m.alumno_id
    JOIN persona   p ON p.id = a.persona_id
    ORDER BY i.fecha_ingreso DESC, i.hora_ingreso DESC
    LIMIT 50000
  `);
  return rows;
}

async function qPersonas() {
  const { rows } = await pool.query(`
    SELECT
      p.id,
      p.apellido,
      p.nombre,
      td.descripcion AS tipo_documento,
      p.documento,
      s.descripcion  AS sexo,
      tp.descripcion AS tipo_persona,
      p.fecha_nacimiento,
      p.email,
      p.celular,
      p.celular_emergencia,
      p.actualizado_en
    FROM persona p
    LEFT JOIN tipo_documento td ON td.id = p.tipo_documento_id
    LEFT JOIN sexo            s  ON s.id  = p.sexo_id
    LEFT JOIN tipo_persona    tp ON tp.id = p.tipo_persona_id
    ORDER BY p.apellido, p.nombre
  `);
  return rows;
}

async function qAlumnos() {
  const { rows } = await pool.query(`
    SELECT
      a.id,
      p.apellido || ', ' || p.nombre AS nombre_completo,
      p.documento                    AS dni,
      p.email,
      p.celular,
      ae.descripcion                 AS estado,
      pt.descripcion                 AS plan_tipo,
      a.fecha_registro,
      a.certificado_apt_fisica,
      a.actualizado_en
    FROM alumno a
    JOIN persona      p  ON p.id  = a.persona_id
    LEFT JOIN alumno_estado ae ON ae.id = a.estado_id
    LEFT JOIN plan_tipo     pt ON pt.id = a.plan_tipo_id
    ORDER BY p.apellido, p.nombre
  `);
  return rows;
}

async function qMembresiasVigentes() {
  const { rows } = await pool.query(`
    SELECT
      m.id,
      a.id              AS alumno_id,
      p.apellido || ', ' || p.nombre AS alumno,
      p.documento       AS dni,
      pt.descripcion    AS plan,
      m.monto_pagado,
      m.metodo_pago,
      m.fecha_inicio,
      m.fecha_fin,
      m.dias_totales,
      m.ingresos_disponibles,
      m.plan_tipo_id,
      m.cobrado_por_id
    FROM membresia m
    JOIN alumno  a  ON a.id  = m.alumno_id
    JOIN persona p  ON p.id  = a.persona_id
    LEFT JOIN plan_tipo pt ON pt.id = m.plan_tipo_id
    WHERE m.fecha_fin >= CURRENT_DATE - INTERVAL '60 days'
    ORDER BY m.fecha_fin DESC
  `);
  return rows;
}

async function qUsuarios() {
  const { rows } = await pool.query(`
    SELECT
      u.id,
      p.apellido || ', ' || p.nombre AS nombre_completo,
      p.email,
      p.documento                    AS dni,
      STRING_AGG(r.codigo, ', ' ORDER BY r.codigo) AS roles,
      u.activo,
      u.ultimo_login,
      u.actualizado_en,
      u.persona_id,
      u.contrasena
    FROM usuario u
    JOIN persona p ON p.id = u.persona_id
    LEFT JOIN usuario_rol ur ON ur.usuario_id = u.id
    LEFT JOIN rol         r  ON r.id = ur.rol_id
    GROUP BY u.id, p.apellido, p.nombre, p.email, p.documento,
             u.activo, u.ultimo_login, u.actualizado_en, u.persona_id, u.contrasena
    ORDER BY p.apellido
  `);
  return rows;
}

async function qCatalogos() {
  const planes     = (await pool.query(`SELECT * FROM plan_tipo ORDER BY activo DESC, descripcion`)).rows;
  const roles      = (await pool.query(`SELECT * FROM rol ORDER BY codigo`)).rows;
  const estados    = (await pool.query(`SELECT * FROM alumno_estado ORDER BY descripcion`)).rows;
  const sexos      = (await pool.query(`SELECT * FROM sexo ORDER BY descripcion`)).rows;
  const tipoDocs   = (await pool.query(`SELECT * FROM tipo_documento ORDER BY descripcion`)).rows;
  const tipoPersona = (await pool.query(`SELECT * FROM tipo_persona ORDER BY descripcion`)).rows;
  return { planes, roles, estados, sexos, tipoDocs, tipoPersona };
}

// ── Generar Excel ────────────────────────────────────────────────────────────

async function generarExcel(datos) {
  const wb   = new ExcelJS.Workbook();
  wb.creator = "Dynamic Gym - Backup";
  wb.created = ahora;

  // ── Hoja 1: Resumen recaudación ──────────────────────────────────────────
  {
    const ws = wb.addWorksheet("Recaudación Mensual");
    ws.columns = [
      { header: "Período",         key: "mes_anio",        },
      { header: "Cant. Pagos",     key: "cantidad_pagos",  },
      { header: "Total Recaudado", key: "total_recaudado", },
      { header: "Efectivo",        key: "efectivo",        },
      { header: "Transferencia",   key: "transferencia",   },
      { header: "Otro",            key: "otro",            },
    ];
    datos.recaudacion.forEach((r) => ws.addRow({
      mes_anio:        r.mes_anio,
      cantidad_pagos:  Number(r.cantidad_pagos),
      total_recaudado: fmtMonto(r.total_recaudado),
      efectivo:        fmtMonto(r.efectivo),
      transferencia:   fmtMonto(r.transferencia),
      otro:            fmtMonto(r.otro),
    }));
    estiloCabecera(ws, "1F4E79");
    autoAncho(ws);
  }

  // ── Hoja 2: Detalle de pagos ─────────────────────────────────────────────
  {
    const ws = wb.addWorksheet("Detalle Pagos");
    ws.columns = [
      { header: "ID",          key: "id"                  },
      { header: "Alumno",      key: "alumno"              },
      { header: "DNI",         key: "dni"                 },
      { header: "Plan",        key: "plan"                },
      { header: "Monto",       key: "monto_pagado"        },
      { header: "Método Pago", key: "metodo_pago"         },
      { header: "Inicio",      key: "fecha_inicio"        },
      { header: "Vencimiento", key: "fecha_fin"           },
      { header: "Días",        key: "dias_totales"        },
      { header: "Ingresos",    key: "ingresos_disponibles"},
      { header: "Cobrado por", key: "cobrado_por"         },
    ];
    datos.pagos.forEach((r) => ws.addRow({
      ...r,
      monto_pagado: fmtMonto(r.monto_pagado),
      fecha_inicio: fmt(r.fecha_inicio),
      fecha_fin:    fmt(r.fecha_fin),
    }));
    estiloCabecera(ws, "375623");
    autoAncho(ws);
  }

  // ── Hoja 3: Ingresos diarios ─────────────────────────────────────────────
  {
    const ws = wb.addWorksheet("Ingresos Diarios");
    ws.columns = [
      { header: "ID",             key: "id"            },
      { header: "Alumno",         key: "alumno"        },
      { header: "DNI",            key: "dni"           },
      { header: "Fecha Ingreso",  key: "fecha_ingreso" },
      { header: "Hora",           key: "hora_ingreso"  },
    ];
    datos.ingresos.forEach((r) => ws.addRow({
      ...r,
      fecha_ingreso: fmt(r.fecha_ingreso),
    }));
    estiloCabecera(ws, "4472C4");
    autoAncho(ws);
  }

  // ── Hoja 4: Personas ─────────────────────────────────────────────────────
  {
    const ws = wb.addWorksheet("Personas");
    ws.columns = [
      { header: "ID",                key: "id"                },
      { header: "Apellido",          key: "apellido"          },
      { header: "Nombre",            key: "nombre"            },
      { header: "Tipo Doc.",         key: "tipo_documento"    },
      { header: "Documento",         key: "documento"         },
      { header: "Sexo",              key: "sexo"              },
      { header: "Tipo Persona",      key: "tipo_persona"      },
      { header: "Fecha Nacimiento",  key: "fecha_nacimiento"  },
      { header: "Email",             key: "email"             },
      { header: "Celular",           key: "celular"           },
      { header: "Cel. Emergencia",   key: "celular_emergencia"},
      { header: "Actualizado",       key: "actualizado_en"    },
    ];
    datos.personas.forEach((r) => ws.addRow({
      ...r,
      fecha_nacimiento: fmt(r.fecha_nacimiento),
      actualizado_en:   fmt(r.actualizado_en),
    }));
    estiloCabecera(ws, "7030A0");
    autoAncho(ws);
  }

  // ── Hoja 5: Alumnos ──────────────────────────────────────────────────────
  {
    const ws = wb.addWorksheet("Alumnos");
    ws.columns = [
      { header: "ID",                  key: "id"                    },
      { header: "Nombre Completo",     key: "nombre_completo"       },
      { header: "DNI",                 key: "dni"                   },
      { header: "Email",               key: "email"                 },
      { header: "Celular",             key: "celular"               },
      { header: "Estado",              key: "estado"                },
      { header: "Plan Tipo",           key: "plan_tipo"             },
      { header: "Fecha Registro",      key: "fecha_registro"        },
      { header: "Cert. Apt. Física",   key: "certificado_apt_fisica"},
    ];
    datos.alumnos.forEach((r) => ws.addRow({
      ...r,
      fecha_registro: fmt(r.fecha_registro),
    }));
    estiloCabecera(ws, "C55A11");
    autoAncho(ws);
  }

  // ── Hoja 6: Usuarios del sistema ─────────────────────────────────────────
  {
    const ws = wb.addWorksheet("Usuarios Sistema");
    ws.columns = [
      { header: "ID",             key: "id"             },
      { header: "Nombre",         key: "nombre_completo"},
      { header: "Email",          key: "email"          },
      { header: "DNI",            key: "dni"            },
      { header: "Roles",          key: "roles"          },
      { header: "Activo",         key: "activo"         },
      { header: "Último Login",   key: "ultimo_login"   },
    ];
    datos.usuarios.forEach((r) => ws.addRow({
      ...r,
      activo:       r.activo ? "Sí" : "No",
      ultimo_login: fmt(r.ultimo_login),
      contrasena:   undefined, // nunca exportar el hash
    }));
    estiloCabecera(ws, "833C00");
    autoAncho(ws);
  }

  // ── Hoja 7: Membresías vigentes (últimos 60 días) ────────────────────────
  {
    const ws = wb.addWorksheet("Membresias Vigentes");
    ws.columns = [
      { header: "ID",           key: "id"                   },
      { header: "Alumno",       key: "alumno"               },
      { header: "DNI",          key: "dni"                  },
      { header: "Plan",         key: "plan"                 },
      { header: "Monto",        key: "monto_pagado"         },
      { header: "Método Pago",  key: "metodo_pago"          },
      { header: "Inicio",       key: "fecha_inicio"         },
      { header: "Vencimiento",  key: "fecha_fin"            },
      { header: "Días",         key: "dias_totales"         },
      { header: "Ing. Disp.",   key: "ingresos_disponibles" },
    ];
    datos.membresiasVigentes.forEach((r) => ws.addRow({
      ...r,
      monto_pagado: fmtMonto(r.monto_pagado),
      fecha_inicio: fmt(r.fecha_inicio),
      fecha_fin:    fmt(r.fecha_fin),
    }));
    estiloCabecera(ws, "1F4E79");
    autoAncho(ws);
  }

  // ── Hoja 8: Catálogos ────────────────────────────────────────────────────
  {
    const ws = wb.addWorksheet("Catalogos");
    let fila = 1;

    const agregarSeccion = (titulo, cols, filas) => {
      const encabezado = ws.getRow(fila);
      encabezado.getCell(1).value = titulo;
      encabezado.getCell(1).font  = { bold: true, size: 12 };
      fila++;
      const header = ws.getRow(fila);
      cols.forEach((c, i) => {
        header.getCell(i + 1).value = c;
        header.getCell(i + 1).font  = { bold: true };
        header.getCell(i + 1).fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9D9D9" } };
      });
      fila++;
      filas.forEach((r) => {
        const row = ws.getRow(fila);
        Object.values(r).forEach((v, i) => { row.getCell(i + 1).value = v; });
        fila++;
      });
      fila++;
    };

    agregarSeccion("PLANES",
      ["ID", "Descripción", "Días Totales", "Ingresos", "Precio", "Activo"],
      datos.catalogos.planes.map(r => ({ id: r.id, descripcion: r.descripcion, dias_totales: r.dias_totales, ingresos: r.ingresos, precio: fmtMonto(r.precio), activo: r.activo ? "Sí" : "No" }))
    );
    agregarSeccion("ROLES",
      ["ID", "Código", "Descripción"],
      datos.catalogos.roles.map(r => ({ id: r.id, codigo: r.codigo, descripcion: r.descripcion }))
    );
    agregarSeccion("ESTADOS ALUMNO",
      ["ID", "Descripción"],
      datos.catalogos.estados.map(r => ({ id: r.id, descripcion: r.descripcion }))
    );
    agregarSeccion("TIPOS DOCUMENTO",
      ["ID", "Descripción"],
      datos.catalogos.tipoDocs.map(r => ({ id: r.id, descripcion: r.descripcion }))
    );

    ws.columns = [{ width: 20 }, { width: 30 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 10 }];
  }

  const xlsxPath = path.join(dirSalida, `backup_dynamicgym_${fechaStr}.xlsx`);
  await wb.xlsx.writeFile(xlsxPath);
  return xlsxPath;
}

// ── Guardar JSONs para migración posterior ───────────────────────────────────

function guardarJSON(nombre, datos) {
  const filePath = path.join(dirSalida, `${nombre}.json`);
  fs.writeFileSync(filePath, JSON.stringify(datos, null, 2), "utf-8");
  return filePath;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔌 Conectando a la base de datos...");
  await pool.query("SELECT 1");
  console.log("✅ Conexión OK\n");

  console.log("📊 Consultando datos...");
  const [recaudacion, pagos, ingresos, personas, alumnos, membresiasVigentes, usuarios, catalogos] =
    await Promise.all([
      qRecaudacionMensual(),
      qDetallePagos(),
      qIngresosDiarios(),
      qPersonas(),
      qAlumnos(),
      qMembresiasVigentes(),
      qUsuarios(),
      qCatalogos(),
    ]);

  const totales = {
    recaudacion:       recaudacion.length,
    pagos:             pagos.length,
    ingresos:          ingresos.length,
    personas:          personas.length,
    alumnos:           alumnos.length,
    membresias_vigentes: membresiasVigentes.length,
    usuarios:          usuarios.length,
  };

  console.log("📦 Registros encontrados:");
  Object.entries(totales).forEach(([k, v]) => console.log(`   ${k.padEnd(22)}: ${v}`));
  console.log();

  // ── Excel ─────────────────────────────────────────────────────────────────
  console.log("📝 Generando Excel...");
  const xlsxPath = await generarExcel({ recaudacion, pagos, ingresos, personas, alumnos, membresiasVigentes, usuarios, catalogos });
  console.log(`✅ Excel: ${xlsxPath}`);

  // ── JSONs para migración ──────────────────────────────────────────────────
  console.log("\n💾 Guardando JSONs para migración...");

  // Limpiar contraseñas de los JSONs de usuario (exportar solo lo necesario)
  const usuariosMigracion = usuarios.map(({ contrasena, ...u }) => u);

  const archivos = [
    guardarJSON("personas",           personas),
    guardarJSON("alumnos",            alumnos),
    guardarJSON("membresias_vigentes", membresiasVigentes),
    guardarJSON("usuarios",           usuariosMigracion),
    guardarJSON("catalogos",          catalogos),
    guardarJSON("recaudacion_mensual", recaudacion),
    guardarJSON("_resumen",           { exportado_en: ahora.toISOString(), totales }),
  ];

  archivos.forEach((f) => console.log(`   ${path.basename(f)}`));

  console.log(`\n🎉 Backup completo en: ${dirSalida}`);
  console.log(`   - backup_dynamicgym_${fechaStr}.xlsx  → archivo Excel`);
  console.log(`   - *.json                               → datos para migración`);
}

main()
  .catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
  })
  .finally(() => pool.end());
