export const authConfig = {
  storageKey: "token", // donde se guarda el token
  endpoints: {
    login: "/auth/login",
    me: "/auth/me",
    logout: "/auth/logout",
    register: "/auth/register", // lo dejamos listo aunque no lo uses todavía
  },
  // para proyectos futuros: campos default
  loginCampos: {
    emailLabel: "Email",
    passwordLabel: "Contraseña",
    botonLabel: "Login",
  },

};

export const registroAlumnoConfig = {
  titulo: "Registro de Alumno",
  subtitulo: "Alta rápida (Persona + Alumno)",
  botonLabel: "Registrar",

  // campos (como objeto reusable)
  campos: [
    { name: "documento", label: "DNI", placeholder: "48146705", inputMode: "numeric" },
    { name: "nombre", label: "Nombre", placeholder: "Juan" },
    { name: "apellido", label: "Apellido", placeholder: "Pérez" },
    { name: "fecha_nacimiento", label: "Fecha nacimiento", type: "date",  },
    { name: "email", label: "Email (opcional)", placeholder: "juan@mail.com" },
    { name: "celular", label: "Celular", placeholder: "3705..." },
    { name: "celular", label: "Celular (Emergencia)", placeholder: "3705..." },
  ],

  // valores fijos (porque tu service los usa)
  defaults: {
    tipo_documento_id: 1,
    sexo_id: null,
    tipo_persona_id: 1,
    celular_emergencia: null,
  },

  // navegación
  redirigirA: "/admin", // o "/"
};

