import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["**/dist", "**/node_modules", "test-results", "playwright-report", "frontend/.agents"]),
  {
    files: ["**/*.{js,jsx,mjs}"],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node,
    },
    rules: {
      "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z_]", argsIgnorePattern: "^(_|[A-Z])" }],
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "always", { null: "ignore" }],
    },
  },
  {
    files: ["frontend/**/*.{js,jsx}"],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // TEMPORAL: aviso y no error mientras las pantallas cargan datos con useEffect. Al pasar
      // cada una a TanStack Query (etapa 4) desaparece; cuando no quede ninguna, vuelve a "error".
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    // El contexto exporta el Provider y su hook useAuth juntos (patrón habitual de React);
    // tests y helpers de tests pueden exportar cosas que no son componentes.
    files: ["frontend/src/auth/auth_context.jsx", "frontend/src/**/*.test.jsx", "frontend/src/test/**"],
    rules: { "react-refresh/only-export-components": "off" },
  },
]);
