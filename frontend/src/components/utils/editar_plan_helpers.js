export function hoyISO() {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

export function fechaAR(fecha) {
  if (!fecha) return "—";
  const [anio, mes, dia] = String(fecha).slice(0, 10).split("-");
  if (!anio || !mes || !dia) return fecha;
  return `${dia}/${mes}/${anio}`;
}

export function money(v) {
  const n = Number(v || 0);
  return n.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function estadoBadge(estadoDesc) {
  const t = String(estadoDesc || "").toLowerCase();

  let estilos = "bg-gray-50 text-gray-700 border-gray-200";

  if (t.includes("habil")) {
    estilos = "bg-green-50 text-green-700 border-green-200";
  } else if (t.includes("restring") || t.includes("bloq") || t.includes("inactiv")) {
    estilos = "bg-red-50 text-red-700 border-red-200";
  } else if (t.includes("pend")) {
    estilos = "bg-yellow-50 text-yellow-700 border-yellow-200";
  }

  return {
    texto: estadoDesc || "—",
    className: `inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${estilos}`,
  };
}

export function validarFormularioPlan({ documento, form }) {
  const doc = String(documento).replace(/[.\s]/g, "").trim();

  if (!doc) return "Falta el DNI";
  if (!form.tipo_plan_id) return "Seleccioná un tipo de plan";
  if (!form.fecha_inicio || !form.fecha_fin) {
    return "Completá fecha inicio y fecha fin";
  }
  if (form.fecha_fin < form.fecha_inicio) {
    return "La fecha fin no puede ser menor a la fecha inicio";
  }
  if (
    form.ingresos_disponibles !== "" &&
    (!Number.isFinite(Number(form.ingresos_disponibles)) ||
      Number(form.ingresos_disponibles) < 0)
  ) {
    return "Ingresos disponibles debe ser un número válido";
  }

  return null;
}

export function mapearPlanAForm(plan) {
  return {
    tipo_plan_id: plan?.tipo_plan_id ?? "",
    fecha_inicio: plan?.inicio ?? hoyISO(),
    fecha_fin: plan?.fin ?? hoyISO(),
    ingresos_disponibles:
      plan?.ingresos_disponibles != null
        ? String(plan.ingresos_disponibles)
        : "",
  };
}