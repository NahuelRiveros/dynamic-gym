import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import FormCard from "../components/form/form_card.jsx";
import InputField from "../components/form/input_field.jsx";
import SubmitButton from "../components/form/submit_button.jsx";
import FormError from "../components/form/form_error.jsx";
import WelcomeModal from "../components/modal/WelcomeModal.jsx";

import { useAuth } from "../auth/auth_context.jsx";
import { authConfig } from "../config/auth_config.js";

export default function LoginPage() {
  const nav = useNavigate();
  const { login, user } = useAuth();

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
        email: z.string().email("Email inválido"),
        password: z.string().min(4, "Mínimo 4 caracteres"),
      }),
    []
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values) {
    setError(null);
    try {
      await login(values);
      setMostrarWelcome(true); // ✅ abrimos modal
    } catch (err) {
      setError(
        err?.response?.data?.mensaje ||
        err?.message ||
        "No se pudo iniciar sesión"
      );
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <FormCard titulo="Login" subtitulo="Ingresá tus credenciales">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

          <InputField
            label={labels.emailLabel}
            name="email"
            register={register}
            error={errors?.email?.message}
            placeholder="admin@gym.com"
            type="email"
          />

          <InputField
            label={labels.passwordLabel}
            name="password"
            register={register}
            error={errors?.password?.message}
            placeholder="••••••••"
            type="password"
          />

          <FormError message={error} />

          <div className="flex justify-center">
            <SubmitButton
              loading={isSubmitting}
              label={labels.botonLabel}
              loadingLabel="Ingresando..."
            />
          </div>
        </form>

        <div className="mt-6 text-center text-sm">
          <a className="text-blue-600 underline" href="/">
            Volver
          </a>
        </div>
      </FormCard>

      {/* ✅ MODAL BIENVENIDA */}
      {mostrarWelcome && (
        <WelcomeModal
          nombre={user?.nombre}
          apellido={user?.apellido}
          onFinish={() => {
            setMostrarWelcome(false);
            nav("/"); // o /home
          }}
        />
      )}

    </div>
  );
}
