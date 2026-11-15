import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the browser talks only to Vite (http://localhost:5173).
// Vite forwards every /api/... request (including uploaded cover photos, /api/covers/...) to Laravel, so there are no CORS problems.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },
});
