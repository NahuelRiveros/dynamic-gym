// Los E2E corren contra su propia base LOCAL y puertos propios, así no tocan producción (Neon),
// ni los datos de desarrollo, ni chocan con `npm run dev`.
export const BASE_E2E = "dynamicgym_e2e_auto_test";
export const PUERTO_API = 3101;
export const PUERTO_WEB = 5175;
