import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import FormCard from "../components/form/form_card.jsx";
import InputField from "../components/form/input_field.jsx";
import SubmitButton from "../components/form/submit_button.jsx";
import FormError from "../components/form/form_error.jsx";
import WelcomeModal from "../components/modal/welcome_modal.jsx";

import { useAuth } from "../auth/auth_context.jsx";
import { authConfig } from "../config/auth_config.js";

export default function LoginPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, user } = useAuth();

  const sesionExpirada = searchParams.get("expired") === "1";
  const from = searchParams.get("from") || "/";

  const [error, setError] = useState(null);
  const [mostrarWelcome, setMostrarWelcome] = useState(false);

  const labels = authConfig?.loginCampos || {
    emailLabel: "Email",
    passwordLabel: "Contraseña",
    botonLabel: "Entrar",
  };

  const schema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .trim()
          .min(1, "El email es obligatorio")
          .email("Email inválido"),
        password: z
          .string()
          .trim()
          .min(4, "Mínimo 4 caracteres"),
      }),
    []
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values) {
    setError(null);

    try {
      await login(values);
      setMostrarWelcome(true);
    } catch (err) {
      setError(
        err?.response?.data?.mensaje ||
          err?.message ||
          "No se pudo iniciar sesión"
      );
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.10),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.08),_transparent_30%)]" />

      <div className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-2">
        <div className="hidden lg:flex items-center justify-center p-10">
          <div className="max-w-xl">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 shadow-sm backdrop-blur">
              Sistema de gestión
            </div>

            <h1 className="mt-6 text-4xl font-extrabold leading-tight text-slate-900">
              Acceso seguro y profesional a la plataforma
            </h1>

            <p className="mt-4 max-w-lg text-base leading-7 text-slate-600">
              Ingresá con tus credenciales para administrar la información del
              sistema de manera ordenada, rápida y segura.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
                <p className="text-sm font-semibold text-slate-800">Seguridad</p>
                <p className="mt-1 text-sm text-slate-500">
                  Acceso controlado por usuario.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
                <p className="text-sm font-semibold text-slate-800">Gestión</p>
                <p className="mt-1 text-sm text-slate-500">
                  Información organizada y centralizada.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
                <p className="text-sm font-semibold text-slate-800">Control</p>
                <p className="mt-1 text-sm text-slate-500">
                  Flujo de trabajo más claro y eficiente.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-4 sm:p-6 lg:p-10">
          <div className="w-full max-w-md">
            <div className="mb-5 text-center lg:hidden">
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 shadow-sm">
                Sistema de gestión
              </div>
            </div>

            {sesionExpirada && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Tu sesión expiró. Volvé a iniciar sesión para continuar.
              </div>
            )}

            <FormCard
              titulo="Iniciar sesión"
              subtitulo="Ingresá tus credenciales para continuar"
            >
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <InputField
                  label={labels.emailLabel}
                  name="email"
                  register={register}
                  error={errors?.email?.message}
                  placeholder="admin@gym.com"
                  type="email"
                  autoComplete="username"
                  className="py-3"
                />

                <InputField
                  label={labels.passwordLabel}
                  name="password"
                  register={register}
                  error={errors?.password?.message}
                  placeholder="••••••••"
                  type="password"
                  autoComplete="current-password"
                  className="py-3"
                />

                <FormError message={error} />

                <SubmitButton
                  loading={isSubmitting}
                  label={labels.botonLabel}
                  loadingLabel="Ingresando..."
                  className="w-full py-3 text-sm shadow-sm"
                />
              </form>

              <div className="mt-6 border-t border-slate-100 pt-4 text-center">
                <a
                  href="/"
                  className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
                >
                  Volver al inicio
                </a>
              </div>
            </FormCard>
          </div>
        </div>
      </div>

      {mostrarWelcome && (
        <WelcomeModal
          nombre={user?.nombre}
          apellido={user?.apellido}
          onFinish={() => {
            setMostrarWelcome(false);
            nav(from);
          }}
        />
      )}
    </div>
  );
}