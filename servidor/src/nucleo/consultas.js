/**
 * Patrón para ILIKE "contiene" con el texto del usuario tal cual: escapa \ % y _, que en LIKE son
 * comodines (sin esto, buscar "_" trae cualquier cosa). Usar siempre con replacements, nunca con ${}.
 */
export function patronContiene(texto) {
  return `%${String(texto ?? "").replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}
