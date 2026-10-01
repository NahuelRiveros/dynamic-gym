import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    css: false,
    // Los tests nunca usan el API real: todas las llamadas las responde MSW (src/test/servidor_mock.js).
    env: { VITE_API_URL: "http://localhost:3001/api" },
    // Node 25+ trae un localStorage experimental propio que tapa al de jsdom.
    poolOptions: { forks: { execArgv: ["--no-experimental-webstorage"] } },
  },
})
