import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2, Lock, LogIn, Mail } from "lucide-react";

import InputField from "../../components/form/input_field.jsx";
import FormError from "../../components/form/form_error.jsx";
import WelcomeModal from "../../components/modal/welcome_modal.jsx";
import { images } from "../../assets/index.js";
import { useAuth } from "../../auth/auth_context.jsx";
import PanelMarcaLogin from "./panel_marca_login.jsx";

const schema = z.object({
  email: z.string().trim().min(1, "El email es obligatorio").email("Email inválido"),
  password: z.string().trim().min(4, "Mínimo 4 caracteres"),
});

export default function LoginPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, usuario } = useAuth();

  const sesionExpirada = searchParams.get("expired") === "1";
  const from = searchParams.get("from") || "/";

  const [error, setError] = useState(null);
  const [mostrarWelcome, setMostrarWelcome] = useState(false);
  const [mayusculas, setMayusculas] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  async function onSubmit(values) {
    setError(null);
    try {
      await login(values);
      setMostrarWelcome(true);
    } catch (err) {
      setError(err?.response?.data?.mensaje || err?.message || "No se pudo iniciar sesión");
    }
  }

  // Con Bloq Mayús activado la contraseña falla sin que se note por qué.
  const revisarMayusculas = (e) => setMayusculas(e.getModifierState?.("CapsLock") ?? false);

  return (
    <div className="grid min-h-[calc(100dvh-4rem)] bg-white lg:grid-cols-[1.1fr_1fr]">
      <PanelMarcaLogin />

      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <img src={images.dynamicLogo} alt="" className="mb-6 h-14 w-14 rounded-2xl object-cover shadow-md lg:hidden" />

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Iniciar sesión</h1>
          <p className="mt-2 text-sm text-slate-500">Ingresá con el email y la contraseña que te dio el gimnasio.</p>

          {sesionExpirada && (
            <div role="status" className="mt-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle aria-hidden="true" className="h-5 w-5 shrink-0" />
              Tu sesión expiró. Volvé a iniciar sesión para continuar.
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
            <InputField
              label="Email"
              name="email"
              register={register}
              error={errors?.email?.message}
              placeholder="nombre@ejemplo.com"
              type="email"
              autoComplete="username"
              icon={Mail}
              className="py-3"
            />

            <InputField
              label="Contraseña"
              name="password"
              register={register}
              error={errors?.password?.message}
              warning={mayusculas ? "Bloq Mayús está activado" : undefined}
              placeholder="••••••••"
              type="password"
              autoComplete="current-password"
              icon={Lock}
              showPasswordToggle
              onKeyUp={revisarMayusculas}
              onKeyDown={revisarMayusculas}
              className="py-3"
            />

            <FormError message={error} />

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-sky-600/25 transition outline-none hover:bg-sky-700 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                  Ingresando…
                </>
              ) : (
                <>
                  <LogIn aria-hidden="true" className="h-4 w-4" />
                  Ingresar
                </>
              )}
            </button>

            <p className="text-center text-xs text-slate-500">¿Te olvidaste la contraseña? Pedile al administrador que te la cambie.</p>
          </form>

          <div className="mt-8 space-y-3 border-t border-slate-100 pt-6 text-center text-sm">
            <p className="text-slate-600">
              ¿Sos alumno?{" "}
              <Link to="/consulta-plan" className="font-semibold text-sky-700 hover:underline">
                Consultá tu plan con tu DNI
              </Link>
            </p>
            <Link to="/" className="inline-block font-medium text-slate-500 transition hover:text-slate-800">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>

      {mostrarWelcome && (
        <WelcomeModal
          nombre={usuario?.nombre}
          apellido={usuario?.apellido}
          onFinish={() => {
            setMostrarWelcome(false);
            nav(from);
          }}
        />
      )}
    </div>
  );
}
