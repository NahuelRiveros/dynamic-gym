import { useState } from "react";
import StaffFormModal from "../../components/modal/staff_form_modal";
import StaffPasswordModal from "../../components/modal/staff_password_modal";
import DataGrid from "../../components/ui/data_grid/data_grid.jsx";
import ConfirmDialog from "../../components/ui/confirm_dialog.jsx";
import EstadoError from "../../components/ui/estado_error.jsx";
import { mensajeDeError } from "../../hook/consultas_utils.js";
import { useCambiarEstadoStaff, useCambiarPasswordStaff, useGuardarStaff, useStaff } from "../../hook/use_staff.js";
import { Users, UserPlus, Edit2, KeyRound, ShieldCheck, ShieldOff, RefreshCw } from "lucide-react";

function formatearFecha(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Cordoba",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function iniciales(nombre, apellido) {
  return ((String(apellido || "")[0] || "") + (String(nombre || "")[0] || "")).toUpperCase() || "?";
}

export default function StaffPage() {
  const consulta = useStaff();
  const staff = consulta.data ?? [];
  const cargando = consulta.isFetching;
  const cargarStaff = () => consulta.refetch();

  const [modalFormAbierto, setModalFormAbierto]         = useState(false);
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false);
  const [staffSeleccionado, setStaffSeleccionado]       = useState(null);
  const [staffAConfirmar, setStaffAConfirmar]           = useState(null);
  const guardar = useGuardarStaff();
  const cambiarPassword = useCambiarPasswordStaff();
  const cambiarEstado = useCambiarEstadoStaff();

  function abrirNuevo()           { guardar.reset(); setStaffSeleccionado(null); setModalFormAbierto(true); }
  function abrirEditar(usuario)   { guardar.reset(); setStaffSeleccionado(usuario); setModalFormAbierto(true); }
  function abrirPassword(usuario) { cambiarPassword.reset(); setStaffSeleccionado(usuario); setModalPasswordAbierto(true); }
  function cerrarFormModal()      { setModalFormAbierto(false); setStaffSeleccionado(null); }
  function cerrarPasswordModal()  { setModalPasswordAbierto(false); setStaffSeleccionado(null); }

  // Si algo falla, el modal queda abierto y muestra el error del servidor (ej. email repetido).
  async function guardarStaff(datos) {
    await guardar.mutateAsync({ usuarioId: staffSeleccionado?.gym_usuario_id, datos }).then(cerrarFormModal, () => {});
  }

  async function guardarPassword({ password }) {
    await cambiarPassword.mutateAsync({ usuarioId: staffSeleccionado.gym_usuario_id, password }).then(cerrarPasswordModal, () => {});
  }

  function toggleEstado(usuario) {
    cambiarEstado.reset();
    setStaffAConfirmar(usuario);
  }

  async function confirmarCambioEstado() {
    const u = staffAConfirmar;
    await cambiarEstado.mutateAsync({ usuarioId: u.gym_usuario_id, activo: !u.gym_usuario_activo }).then(() => setStaffAConfirmar(null), () => {});
  }

  const activos   = staff.filter((u) => u.gym_usuario_activo).length;
  const inactivos = staff.length - activos;

  const columns = [
    {
      key: "gym_persona_apellido",
      label: "Nombre",
      sortable: true,
      searchable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold text-white shadow-sm ${row.gym_usuario_activo ? "bg-blue-600 shadow-blue-500/30" : "bg-slate-400"}`}>
            {iniciales(row.gym_persona_nombre, row.gym_persona_apellido)}
          </div>
          <div>
            <p className="font-semibold text-slate-900 leading-tight">
              {row.gym_persona_apellido} {row.gym_persona_nombre}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "gym_persona_email",
      label: "Email",
      searchable: true,
      className: "text-slate-500 hidden sm:table-cell",
      headerClassName: "hidden sm:table-cell",
    },
    {
      key: "gym_persona_documento",
      label: "DNI",
      sortable: true,
      searchable: true,
      className: "text-slate-600 hidden md:table-cell",
      headerClassName: "hidden md:table-cell",
    },
    {
      key: "gym_usuario_activo",
      label: "Estado",
      render: (_, val) => (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${val ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
          {val ? <ShieldCheck size={10} /> : <ShieldOff size={10} />}
          {val ? "Activo" : "Inactivo"}
        </span>
      ),
    },
    {
      key: "gym_usuario_ultimo_login",
      label: "Último login",
      className: "text-slate-500 text-xs hidden lg:table-cell",
      headerClassName: "hidden lg:table-cell",
      render: (_, val) => formatearFecha(val),
    },
  ];

  const actions = [
    {
      key: "editar",
      label: "Editar",
      icon: <Edit2 size={12} />,
      variant: "primary",
      onClick: (row) => abrirEditar(row),
    },
    {
      key: "password",
      label: "Contraseña",
      icon: <KeyRound size={12} />,
      variant: "default",
      onClick: (row) => abrirPassword(row),
    },
    {
      key: "desactivar",
      label: "Desactivar",
      icon: <ShieldOff size={12} />,
      variant: "danger",
      onClick: (row) => toggleEstado(row),
      show: (row) => row.gym_usuario_activo,
    },
    {
      key: "activar",
      label: "Activar",
      icon: <ShieldCheck size={12} />,
      variant: "success",
      onClick: (row) => toggleEstado(row),
      show: (row) => !row.gym_usuario_activo,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6">
      <div className="mx-auto w-full max-w-6xl space-y-4">

        {/* ── ENCABEZADO ── */}
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm shadow-blue-500/10">
          <div className="h-1 w-full bg-linear-to-r from-blue-600 via-blue-500 to-cyan-400" />
          <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm shadow-blue-500/30">
                <Users size={11} />
                Admin
              </span>
              <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Staff</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Administrá usuarios con rol staff, sus datos, contraseña y estado.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button" onClick={cargarStaff} disabled={cargando} aria-label="Actualizar staff" title="Actualizar staff"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
              >
                <RefreshCw size={13} className={cargando ? "animate-spin" : ""} aria-hidden="true" />
              </button>
              <button
                type="button" onClick={abrirNuevo}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-500 transition"
              >
                <UserPlus size={14} /> Nuevo staff
              </button>
            </div>
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total staff"  value={String(staff.length)} highlight />
          <StatCard label="Activos"      value={String(activos)}      green />
          <StatCard label="Inactivos"    value={String(inactivos)} />
        </div>

        {/* ── ERROR ── */}
        {consulta.isError && <EstadoError error={consulta.error} onReintentar={cargarStaff} reintentando={cargando} />}

        {/* ── TABLA ── */}
        <DataGrid
          rows={staff}
          columns={columns}
          keyField="gym_usuario_id"
          loading={consulta.isPending}
          searchable
          searchPlaceholder="Buscar por nombre, email o DNI…"
          emptyMessage="No hay staff cargado."
          actions={actions}
          actionsLabel="Acciones"
          pageSize={15}
          pageSizeOptions={[10, 15, 25]}
        />

      </div>

      <StaffFormModal
        abierto={modalFormAbierto}
        onClose={cerrarFormModal}
        onGuardar={guardarStaff}
        staffEditar={staffSeleccionado}
        cargando={guardar.isPending}
        errorServidor={guardar.isError ? mensajeDeError(guardar.error, "No se pudo guardar el staff") : null}
      />

      <StaffPasswordModal
        abierto={modalPasswordAbierto}
        onClose={cerrarPasswordModal}
        onGuardar={guardarPassword}
        staffSeleccionado={staffSeleccionado}
        cargando={cambiarPassword.isPending}
        errorServidor={cambiarPassword.isError ? mensajeDeError(cambiarPassword.error, "No se pudo cambiar la contraseña") : null}
      />

      <ConfirmDialog
        open={Boolean(staffAConfirmar)}
        title={staffAConfirmar?.gym_usuario_activo ? "¿Desactivar staff?" : "¿Activar staff?"}
        message={
          cambiarEstado.isError
            ? mensajeDeError(cambiarEstado.error, "No se pudo cambiar el estado")
            : `${staffAConfirmar?.gym_persona_nombre ?? ""} ${staffAConfirmar?.gym_persona_apellido ?? ""} ${staffAConfirmar?.gym_usuario_activo ? "no va a poder iniciar sesión." : "va a poder iniciar sesión de nuevo."}`
        }
        confirmLabel={staffAConfirmar?.gym_usuario_activo ? "Desactivar" : "Activar"}
        variant={staffAConfirmar?.gym_usuario_activo ? "danger" : "primary"}
        loading={cambiarEstado.isPending}
        onConfirm={confirmarCambioEstado}
        onClose={() => setStaffAConfirmar(null)}
      />
    </div>
  );
}

function StatCard({ label, value, highlight, green }) {
  return (
    <div className={[
      "rounded-2xl border px-4 py-3.5 shadow-sm",
      highlight ? "border-blue-200 bg-linear-to-br from-blue-600 to-blue-500 shadow-blue-500/20"
        : green  ? "border-emerald-200 bg-emerald-50"
        : "border-slate-200 bg-white",
    ].join(" ")}>
      <div className={`text-[11px] font-bold uppercase tracking-wider ${highlight ? "text-blue-100" : green ? "text-emerald-600" : "text-slate-500"}`}>
        {label}
      </div>
      <p className={`mt-1.5 text-2xl font-extrabold leading-tight ${highlight ? "text-white" : green ? "text-emerald-700" : "text-slate-900"}`}>
        {value}
      </p>
    </div>
  );
}
