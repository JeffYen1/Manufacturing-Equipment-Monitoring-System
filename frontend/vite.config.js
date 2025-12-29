/**
 * Equipment Detail page
 *
 * Shows:
 * - tool metadata (name, type, location)
 * - recent sensor readings for quick diagnosis
 *
 * We fetch two endpoints in parallel:
 * - GET /equipment/{id} for metadata
 * - GET /equipment/{id}/readings for telemetry history
 *
 * The "limit" dropdown is a lightweight performance control:
 * it prevents rendering huge tables while still supporting deeper inspection.
 */


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
