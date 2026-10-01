export function validarPlanBody(body) {
  const errores = [];

  const descripcion = body.descripcion?.toString().trim();
  const dias_totales = Number(body.dias_totales);
  const ingresos = Number(body.ingresos);
  const precio = Number(body.precio);

  if (!descripcion) {
    errores.push("La descripción es obligatoria");
  } else if (descripcion.length < 3) {
    errores.push("La descripción debe tener al menos 3 caracteres");
  }

  // La base exige dias_totales > 0 (CHECK en plan_tipo): con 0 terminaba en "Error interno".
  if (!Number.isInteger(dias_totales) || dias_totales < 1) {
    errores.push("Los días totales deben ser un número entero mayor a 0");
  }

  if (!Number.isInteger(ingresos) || ingresos < 0) {
    errores.push("Los ingresos deben ser un número entero mayor o igual a 0");
  }

  if (Number.isNaN(precio) || precio < 0) {
    errores.push("El precio debe ser un número mayor o igual a 0");
  }

  return {
    esValido: errores.length === 0,
    errores,
    valores: {
      descripcion,
      dias_totales,
      ingresos,
      precio,
    },
  };
}