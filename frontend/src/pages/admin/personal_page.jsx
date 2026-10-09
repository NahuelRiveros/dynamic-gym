import { useState } from "react";
import { Edit2, KeyRound, ShieldCheck, ShieldOff, UserPlus } from "lucide-react";
import StaffFormModal from "../../components/modal/staff_form_modal.jsx";
import StaffPasswordModal from "../../components/modal/staff_password_modal.jsx";
import DataGrid from "../../components/ui/data_grid/data_grid.jsx";
import ConfirmDialog from "../../components/ui/confirm_dialog.jsx";
import EstadoError from "../../components/ui/estado_error.jsx";
import { mensajeDeError } from "../../hook/consultas_utils.js";
import { useCambiarEstadoStaff, useCambiarPasswordStaff, useGuardarStaff, useStaff } from "../../hook/use_staff.js";
import { cn } from "../../lib/cn.js";
import { haceCuanto } from "../../lib/fecha_ar.js";

const FILTROS = [
  { clave: "activos", texto: "Activos", incluye: (u) => u.gym_usuario_activo },
  { clave: "inactivos", texto: "Inactivos", incluye: (u) => !u.gym_usuario_activo },
  { clave: "todos", texto: "Todos", incluye: () => true },
];
const VACIO = { activos: "No hay personal activo.", inactivos: "No hay personal desactivado.", todos: "Todavía no agregaste a nadie del personal." };

const nombreDe = (u) => `${u?.gym_persona_nombre ?? ""} ${u?.gym_persona_apellido ?? ""}`.trim();
const iniciales = (u) => `${u.gym_persona_nombre?.[0] ?? ""}${u.gym_persona_apellido?.[0] ?? ""}`.toUpperCase() || "?";

const COLUMNAS = [
  {
    key: "gym_persona_apellido",
    label: "Persona",
    principal: true,
    sortable: true,
    render: (u) => (
      <span className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold", u.gym_usuario_activo ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400")}
        >
          {iniciales(u)}
        </span>
        <span className="min-w-0">
          <span className={cn("block truncate font-semibold", u.gym_usuario_activo ? "text-slate-900" : "text-slate-500")}>{nombreDe(u)}</span>
          <span className="block truncate text-xs text-slate-500">{u.gym_persona_email}</span>
        </span>
      </span>
    ),
  },
  { key: "gym_persona_documento", label: "DNI", sortable: true },
  {
    key: "gym_usuario_activo",
    label: "Acceso",
    searchable: false,
    render: (_u, activo) => (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold",
          activo ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500",
        )}
      >
        {activo ? <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" /> : <ShieldOff aria-hidden="true" className="h-3.5 w-3.5" />}
        {activo ? "Activo" : "Desactivado"}
      </span>
    ),
  },
  {
    key: "gym_usuario_ultimo_login",
    label: "Último ingreso",
    searchable: false,
    render: (_u, fecha) => (
      <span className="text-slate-600" title={fecha ? new Date(fecha).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }) : undefined}>
        {haceCuanto(fecha) ?? "Nunca"}
      </span>
    ),
  },
];

/** Personal del gimnasio (rol staff): agregar, editar datos, cambiar la contraseña y activar o desactivar. */
export default function PersonalPage() {
  const consulta = useStaff();
  const personal = consulta.data ?? [];
  const [filtro, setFiltro] = useState("activos");

  const [formulario, setFormulario] = useState(null); // null | { persona } (persona null = alta)
  const [paraClave, setParaClave] = useState(null);
  const [paraEstado, setParaEstado] = useState(null);
  const guardar = useGuardarStaff();
  const cambiarPassword = useCambiarPasswordStaff();
  const cambiarEstado = useCambiarEstadoStaff();

  function abrirFormulario(persona = null) {
    guardar.reset();
    setFormulario({ persona });
  }

  // Si algo falla, el modal queda abierto y muestra el error del servidor (ej. email repetido).
  const guardarDatos = (datos) =>
    guardar.mutateAsync({ usuarioId: formulario?.persona?.gym_usuario_id, datos }).then(() => setFormulario(null), () => {});
  const guardarClave = ({ password }) =>
    cambiarPassword.mutateAsync({ usuarioId: paraClave.gym_usuario_id, password }).then(() => setParaClave(null), () => {});
  const confirmarEstado = () =>
    cambiarEstado.mutateAsync({ usuarioId: paraEstado.gym_usuario_id, activo: !paraEstado.gym_usuario_activo }).then(() => setParaEstado(null), () => {});

  const filtroActual = FILTROS.find((f) => f.clave === filtro);
  const filas = personal.filter(filtroActual.incluye);
  const desactivando = paraEstado?.gym_usuario_activo;

  const acciones = [
    { key: "editar", label: "Editar", icon: <Edit2 className="h-3.5 w-3.5" />, onClick: (u) => abrirFormulario(u) },
    {
      key: "clave",
      label: "Contraseña",
      icon: <KeyRound className="h-3.5 w-3.5" />,
      onClick: (u) => {
        cambiarPassword.reset();
        setParaClave(u);
      },
    },
    {
      key: "desactivar",
      label: "Desactivar",
      icon: <ShieldOff className="h-3.5 w-3.5" />,
      variant: "danger",
      show: (u) => u.gym_usuario_activo,
      onClick: (u) => {
        cambiarEstado.reset();
        setParaEstado(u);
      },
    },
    {
      key: "activar",
      label: "Activar",
      icon: <ShieldCheck className="h-3.5 w-3.5" />,
      variant: "success",
      show: (u) => !u.gym_usuario_activo,
      onClick: (u) => {
        cambiarEstado.reset();
        setParaEstado(u);
      },
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Personal</h1>
          <p className="mt-1 text-sm text-slate-500">Quiénes atienden la recepción: entran al ingreso, alumnos, cobros y ventas.</p>
        </div>
        <button
          type="button"
          onClick={() => abrirFormulario()}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition outline-none hover:bg-sky-700 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
        >
          <UserPlus aria-hidden="true" className="h-4 w-4" />
          Agregar al personal
        </button>
      </div>

      <div role="group" aria-label="Mostrar" className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
        {FILTROS.map(({ clave, texto, incluye }) => (
          <button
            key={clave}
            type="button"
            aria-pressed={filtro === clave}
            onClick={() => setFiltro(clave)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
              filtro === clave ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100",
            )}
          >
            {texto} <span className={filtro === clave ? "text-slate-300" : "text-slate-400"}>{personal.filter(incluye).length}</span>
          </button>
        ))}
      </div>

      {consulta.isError && <EstadoError error={consulta.error} onReintentar={() => consulta.refetch()} reintentando={consulta.isFetching} />}

      <DataGrid
        rows={filas}
        columns={COLUMNAS}
        keyField="gym_usuario_id"
        loading={consulta.isPending}
        searchPlaceholder="Buscar por nombre, email o DNI…"
        emptyMessage={VACIO[filtro]}
        actions={acciones}
        pageSize={15}
        pageSizeOptions={[15, 30]}
      />

      <StaffFormModal
        abierto={Boolean(formulario)}
        onClose={() => setFormulario(null)}
        onGuardar={guardarDatos}
        staffEditar={formulario?.persona ?? null}
        cargando={guardar.isPending}
        errorServidor={guardar.isError ? mensajeDeError(guardar.error, "No se pudo guardar") : null}
      />

      <StaffPasswordModal
        abierto={Boolean(paraClave)}
        onClose={() => setParaClave(null)}
        onGuardar={guardarClave}
        staffSeleccionado={paraClave}
        cargando={cambiarPassword.isPending}
        errorServidor={cambiarPassword.isError ? mensajeDeError(cambiarPassword.error, "No se pudo cambiar la contraseña") : null}
      />

      <ConfirmDialog
        open={Boolean(paraEstado)}
        title={desactivando ? `¿Desactivar a ${nombreDe(paraEstado)}?` : `¿Activar a ${nombreDe(paraEstado)}?`}
        message={
          cambiarEstado.isError
            ? mensajeDeError(cambiarEstado.error, "No se pudo cambiar el acceso")
            : desactivando
              ? "No va a poder iniciar sesión. Su historial (cobros, ventas) se conserva y lo podés volver a activar cuando quieras."
              : "Va a poder iniciar sesión de nuevo con su email y su contraseña de siempre."
        }
        confirmLabel={desactivando ? "Desactivar" : "Activar"}
        variant={desactivando ? "danger" : "primary"}
        loading={cambiarEstado.isPending}
        onConfirm={confirmarEstado}
        onClose={() => setParaEstado(null)}
      />
    </div>
  );
}
