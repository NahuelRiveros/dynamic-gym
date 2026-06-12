import { QueryTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

const TZ_BA = "America/Argentina/Buenos_Aires";

function hoyArgentinaPartes() {
  const hoyStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ_BA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const [anio, mes, dia] = hoyStr.split("-").map(Number);
  return { hoyStr, anio, mes, dia };
}

function formatearFechaDDMM(fecha) {
  const f = new Date(fecha);
  return `${String(f.getUTCDate()).padStart(2, "0")}/${String(f.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function obtenerAlumnosCumples({ dias = 3, incluirMes = false } = {}) {
  const diasNumero = Number.isFinite(Number(dias)) ? Number(dias) : 3;
  const { hoyStr, anio, mes, dia } = hoyArgentinaPartes();

  const alumnos = await sequelize.query(
    `
    SELECT
      p.id AS persona_id,
      p.nombre,
      p.apellido,
      p.fecha_nacimiento,
      a.id AS alumno_id
    FROM persona p
    INNER JOIN alumno a ON a.persona_id = p.id
    WHERE p.fecha_nacimiento IS NOT NULL
    ORDER BY p.nombre, p.apellido
    `,
    { type: QueryTypes.SELECT }
  );

  const hoyDate = new Date(`${hoyStr}T00:00:00`);

  const procesados = alumnos.map((alumno) => {
    const fechaNac = new Date(alumno.fecha_nacimiento);

    const cumpleEsteAnio = new Date(anio, fechaNac.getUTCMonth(), fechaNac.getUTCDate());

    let proximoCumple = cumpleEsteAnio;
    if (cumpleEsteAnio < hoyDate) {
      proximoCumple = new Date(anio + 1, fechaNac.getUTCMonth(), fechaNac.getUTCDate());
    }

    const diffMs = proximoCumple - hoyDate;
    const diasRestantes = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return {
      ...alumno,
      fecha: formatearFechaDDMM(alumno.fecha_nacimiento),
      dias_restantes: diasRestantes,
      es_hoy: fechaNac.getUTCMonth() + 1 === mes && fechaNac.getUTCDate() === dia,
    };
  });

  const hoy = procesados
    .filter((a) => a.es_hoy)
    .map((a) => ({
      alumno_id: a.alumno_id, persona_id: a.persona_id,
      nombre: a.nombre, apellido: a.apellido,
      fecha_nacimiento: a.fecha_nacimiento, fecha: a.fecha, tipo: "hoy",
    }));

  const proximos = procesados
    .filter((a) => !a.es_hoy && a.dias_restantes > 0 && a.dias_restantes <= diasNumero)
    .sort((a, b) => a.dias_restantes - b.dias_restantes)
    .map((a) => ({
      alumno_id: a.alumno_id, persona_id: a.persona_id,
      nombre: a.nombre, apellido: a.apellido,
      fecha_nacimiento: a.fecha_nacimiento, fecha: a.fecha,
      dias_restantes: a.dias_restantes, tipo: "proximos",
    }));

  let delMes = [];
  if (incluirMes) {
    delMes = procesados
      .filter((a) => {
        const fechaNac = new Date(a.fecha_nacimiento);
        return fechaNac.getUTCMonth() + 1 === mes;
      })
      .sort((a, b) => {
        const fa = new Date(a.fecha_nacimiento);
        const fb = new Date(b.fecha_nacimiento);
        return fa.getUTCDate() - fb.getUTCDate();
      })
      .map((a) => ({
        alumno_id: a.alumno_id, persona_id: a.persona_id,
        nombre: a.nombre, apellido: a.apellido,
        fecha_nacimiento: a.fecha_nacimiento, fecha: a.fecha,
      }));
  }

  return { ok: true, hoy, proximos, delMes, total: hoy.length + proximos.length };
}
