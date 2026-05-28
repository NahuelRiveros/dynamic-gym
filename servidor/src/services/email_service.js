import nodemailer from "nodemailer";
import { env } from "../configuracion_servidor/env.js";

function crearTransporter() {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    throw new Error("SMTP no configurado. Agregá SMTP_USER y SMTP_PASS en las variables de entorno.");
  }
  return nodemailer.createTransport({
    host:   env.SMTP_HOST,
    port:   env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

/**
 * Envía un email a un único destinatario.
 */
export async function enviarEmail({ to, subject, html }) {
  const transporter = crearTransporter();
  return transporter.sendMail({
    from:    env.SMTP_FROM || env.SMTP_USER,
    to,
    subject,
    html,
  });
}

/**
 * Envía emails en lote con un pequeño delay entre cada uno
 * para evitar el rate limit de Gmail (500/día, ~1/seg recomendado).
 * Devuelve { enviados, fallidos, errores }.
 */
export async function enviarEmailsMasivos({ destinatarios, subject, html }) {
  const transporter = crearTransporter();
  const from = env.SMTP_FROM || env.SMTP_USER;

  let enviados = 0;
  const fallidos = [];

  for (const { email, nombre } of destinatarios) {
    try {
      // Reemplaza {nombre} en asunto y cuerpo con el nombre real del alumno
      const subjectPersonal = subject.replace(/\{nombre\}/gi, nombre);
      const htmlPersonal    = html.replace(/\{nombre\}/gi, nombre);

      await transporter.sendMail({ from, to: email, subject: subjectPersonal, html: htmlPersonal });
      enviados++;

      // Pequeño delay para respetar el rate limit de Gmail
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      fallidos.push({ email, nombre, error: err.message });
    }
  }

  return { enviados, fallidos, total: destinatarios.length };
}
