/**
 * offline_queue_service.js
 *
 * Cola local para ingresos cuando la base de datos no está disponible.
 * Usa un archivo JSON — sin dependencias nativas, compatible con PyInstaller.
 *
 * Ubicación del archivo:  {cwd}/data/offline_queue.json
 * (cuando el servidor corre con npm start desde la carpeta "servidor/",
 *  el archivo queda en  servidor/data/offline_queue.json)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

// ── Directorio de datos ──────────────────────────────────────────────────────
// Se puede sobreescribir con QUEUE_DATA_DIR para tests o configuración avanzada.
const DATA_DIR = process.env.QUEUE_DATA_DIR
  ? process.env.QUEUE_DATA_DIR
  : path.join(process.cwd(), "data");

const QUEUE_FILE = path.join(DATA_DIR, "offline_queue.json");

// ── helpers internos ─────────────────────────────────────────────────────────

function asegurarDirectorio() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function leerCola() {
  asegurarDirectorio();
  if (!existsSync(QUEUE_FILE)) return [];
  try {
    const contenido = readFileSync(QUEUE_FILE, "utf-8");
    const parsed = JSON.parse(contenido);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.warn("⚠  Cola offline: error al leer JSON, se reinicia la cola.");
    return [];
  }
}

function guardarCola(items) {
  asegurarDirectorio();
  writeFileSync(QUEUE_FILE, JSON.stringify(items, null, 2), "utf-8");
}

// ── API pública ──────────────────────────────────────────────────────────────

/**
 * Agrega un ingreso a la cola pendiente.
 * @param {{ dni: string, fecha: string, hora: string }} datos
 * @returns {object} El ítem creado (incluye su id único).
 */
export function agregarALaCola({ dni, fecha, hora }) {
  const cola = leerCola();
  const item = {
    id:            randomUUID(),
    dni,
    fecha_ingreso: fecha,          // "YYYY-MM-DD" (hora Argentina al momento del scan)
    hora_ingreso:  hora,           // "HH:MM:SS"
    fecha_hora:    `${fecha} ${hora}`,
    timestamp:     Date.now(),
    estado:        "pendiente",    // pendiente | sincronizado | error
    intentos:      0,
    ultimo_error:  null,
    sincronizado_en: null,
  };
  cola.push(item);
  guardarCola(cola);
  console.log(`📥 Cola offline: DNI ${dni} encolado (id ${item.id})`);
  return item;
}

/**
 * Devuelve todos los ítems con estado "pendiente".
 */
export function obtenerPendientes() {
  return leerCola().filter((i) => i.estado === "pendiente");
}

/**
 * Marca un ítem como sincronizado con éxito.
 */
export function marcarComoSincronizado(id) {
  const cola = leerCola();
  const item = cola.find((i) => i.id === id);
  if (item) {
    item.estado          = "sincronizado";
    item.sincronizado_en = new Date().toISOString();
    guardarCola(cola);
  }
}

/**
 * Marca un ítem como error permanente (falla de negocio, no de conexión).
 * El ítem queda registrado pero no se reintentará.
 */
export function marcarComoErrorPermanente(id, mensaje) {
  const cola = leerCola();
  const item = cola.find((i) => i.id === id);
  if (item) {
    item.estado       = "error";
    item.ultimo_error = String(mensaje);
    item.intentos    += 1;
    guardarCola(cola);
  }
}

/**
 * Devuelve un resumen del estado de la cola.
 */
export function estadoCola() {
  const cola = leerCola();
  return {
    total:          cola.length,
    pendientes:     cola.filter((i) => i.estado === "pendiente").length,
    sincronizados:  cola.filter((i) => i.estado === "sincronizado").length,
    errores:        cola.filter((i) => i.estado === "error").length,
    archivo:        QUEUE_FILE,
  };
}

/**
 * Cuántos ítems están pendientes de sincronizar.
 */
export function contarPendientes() {
  return leerCola().filter((i) => i.estado === "pendiente").length;
}
