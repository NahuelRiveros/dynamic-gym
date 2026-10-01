---
name: security-audit
description: Audita la seguridad del proyecto o de una parte (OWASP Top 10, SQL injection, permisos, secretos, dependencias, headers, validación, webhooks de pago). Genera un reporte priorizado con archivo:línea y solución. No modifica código salvo que se pida.
argument-hint: [ruta o dominio; vacío = todo el proyecto]
---

# Auditoría de seguridad: $ARGUMENTS

(Si no se indicó nada, auditar todo el proyecto.)

Reportar cada hallazgo con gravedad (CRÍTICA / ALTA / MEDIA / BAJA), `archivo:línea`, cómo se podría
aprovechar en concreto, y la solución. Explicar en español simple. Las soluciones no pueden requerir
cambios en la base; si alguna lo necesita, indicarlo aparte.

## Revisar
1. **SQL injection**: `sequelize.query` con `${}` de datos del usuario, `Op.iLike` con `%${q}%` sin escapar, orden armado con texto del cliente.
2. **Permisos**: rutas privadas con `requireAuth`; admin con `requireRole`; rutas públicas que cambian datos (ej. reset de contraseña) sin prueba de que la persona es dueña de la cuenta.
3. **Validación** de body/query/params en todas las rutas.
4. **Negocio**: montos y planes recalculados en el servidor; ingresos y estados en transacción; webhooks de Mercado Pago idempotentes (un aviso repetido no puede extender dos veces).
5. **Mass assignment**: ningún `create(req.body)` / `update(req.body)`.
6. **Auth**: bcrypt, JWT con secreto fuerte, expiración y algoritmo fijo; rate limit en login y recuperación.
7. **Secretos**: nada en git (`git grep` de claves y tokens, también en el historial), `.env` en `.gitignore`, nada sensible en logs ni en `VITE_*`.
8. **Headers/CORS**: helmet activo, CORS con lista blanca.
9. **Frontend**: `dangerouslySetInnerHTML`, URLs del usuario en links, datos sensibles en `localStorage`.
10. **Dependencias**: `npm audit --omit=dev` en `frontend/` y `servidor/`.

## Salida
Tabla resumen + detalle. Terminar con "Top 3 para arreglar ya" y ofrecer aplicar las soluciones.
