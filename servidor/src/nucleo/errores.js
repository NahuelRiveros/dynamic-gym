/**
 * Errores con status HTTP y código. El manejador central (manejador_errores.js) los responde como
 * { ok: false, codigo, mensaje, detalles }, el mismo formato que ya usa el resto de la API.
 */
export class ErrorApp extends Error {
  constructor({ status = 500, codigo = "ERROR", mensaje = "Error interno del servidor", detalles } = {}) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

export class DatosInvalidos extends ErrorApp {
  constructor({ mensaje = "Los datos enviados no son válidos", detalles } = {}) {
    super({ status: 400, codigo: "VALIDACION", mensaje, detalles });
  }
}

export class NoEncontrado extends ErrorApp {
  constructor({ codigo = "NO_EXISTE", mensaje = "No se encontró lo que buscabas" } = {}) {
    super({ status: 404, codigo, mensaje });
  }
}

export class Conflicto extends ErrorApp {
  constructor({ codigo = "CONFLICTO", mensaje } = {}) {
    super({ status: 409, codigo, mensaje });
  }
}

export class SinPermiso extends ErrorApp {
  constructor({ codigo = "SIN_PERMISO", mensaje = "No tenés permisos" } = {}) {
    super({ status: 403, codigo, mensaje });
  }
}
