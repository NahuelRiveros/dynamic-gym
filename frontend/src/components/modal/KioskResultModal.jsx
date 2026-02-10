import SubmitButton from "../form/submit_button";
import { Users, IdCard, Clock9, FileCheck , Calendar1 , CalendarX} from "lucide-react";
  

export default function KioskResultModal({ resp, onClose }) {
  if (!resp) return null;
  const iconClass = "inline-block m-2 w-8 h-8 ";
  const alumno = resp.alumno || {};
  const plan = resp.plan || null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600">✅ INGRESO OK</div>
          <p className="text-gray-600 mt-1">{resp.mensaje}</p>
        </div>

        <div className="mt-6 space-y-2 text-lg">
          <div>
            <Users className={iconClass}/> <b>{alumno.nombre} {alumno.apellido}</b>
          </div>
          <div>
            <IdCard className={iconClass} /> DNI:  <b>{alumno.documento}</b>
            
          </div>
          {resp.fecha_ingreso && (
            <div>
              <Clock9 className={iconClass}/> Ingreso: <b>{new Date(resp.fecha_ingreso).toLocaleString()}</b>
            </div>
          )}
        </div>

        {plan && (
          <div className="mt-6 rounded-xl bg-gray-50 p-4 space-y-1">
            <div>
              <FileCheck className={iconClass + "text-blue-600"}/> Plan: <b className="text-xl">{plan.tipo_plan}</b>
            </div>
            <div className="">
              <Calendar1 className={iconClass + "text-green-600"}/> Vigencia: (<b className="text-xl">{plan.inicio})</b> Hasta→ <b className="text-xl">({plan.fin})</b>
            </div>
            {plan.ingresos_restantes != null && ( 
              <div>
                <CalendarX className={iconClass + "text-red-600"}/> Ingresos restantes: <b className="text-xl">{plan.ingresos_restantes}</b>
              </div>
            )}
          </div>
        )}
        <div className="flex justify-center items-centers">

          <SubmitButton
            label="Continuar"
            type="button"
            onClick={onClose}
          />
        </div>
      </div>
    </div>
  );
}
