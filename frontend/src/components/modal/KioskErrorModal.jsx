export default function KioskErrorModal({ resp, onClose }) {
  if (!resp) return null;

  const codigo = resp.codigo || "ERROR";
  const alumno = resp.alumno || null;
  const plan = resp.plan || null;

  // Texto “amigable” según código
  const tituloPorCodigo = {
    NO_EXISTE: "⛔ DNI no registrado",
    NO_ES_ALUMNO: "⛔ No es alumno",
    VENCIDO: "⛔ Plan vencido",
    SIN_INGRESOS: "⛔ Sin ingresos disponibles",
    RESTRINGIDO: "⛔ Alumno restringido",
    YA_INGRESO_HOY: "⚠️ Ya ingresó hoy",
    VALIDACION: "⚠️ DNI inválido",
  };

  const titulo = tituloPorCodigo[codigo] || "⛔ Ingreso denegado";
  const mensaje = resp.mensaje || resp.motivo || "No se pudo registrar el ingreso";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 border border-red-200">
        <div className="text-center">
          <div className="text-3xl font-bold text-red-600">{titulo}</div>
          <p className="text-gray-600 mt-2">{mensaje}</p>

          <div className="mt-3 inline-flex px-3 py-1 rounded-full bg-red-50 text-red-700 text-sm font-semibold">
            Código: {codigo}
          </div>
        </div>

        {/* Si viene alumno, lo mostramos */}
        {alumno && (
          <div className="mt-6 rounded-xl bg-gray-50 p-4 space-y-1 text-lg">
            <div>
              👤 Alumno:{" "}
              <b>
                {alumno.nombre ?? "—"} {alumno.apellido ?? ""}
              </b>
            </div>
            {alumno.documento && (
              <div>
                🪪 DNI: <b>{alumno.documento}</b>
              </div>
            )}
            {alumno.estado_id != null && (
              <div>
                🧾 Estado ID: <b>{alumno.estado_id}</b>
              </div>
            )}
          </div>
        )}

        {/* Si viene plan, lo mostramos (vencimiento / ingresos) */}
        {plan && (
          <div className="mt-4 rounded-xl bg-gray-50 p-4 space-y-1 text-lg">
            {plan.fin && (
              <div>
                📅 Vence: <b>{plan.fin}</b>
              </div>
            )}
            {plan.ingresos_restantes != null && (
              <div>
                🔢 Ingresos restantes: <b>{plan.ingresos_restantes}</b>
              </div>
            )}
          </div>
        )}
        <div className="flex justify-center items-center">
            <button
            onClick={onClose}
            className="mt-6 w-full bg-black text-white py-3 rounded-xl font-semibold">
            Continuar
            </button>
        </div>
      </div>
    </div>
  );
}
