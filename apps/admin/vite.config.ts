import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// QazMind Admin: http://127.0.0.1:5174 (also reachable as http://localhost:5174).
// /api is forwarded to the same FastAPI backend that serves QazMind Web.
const apiTarget = process.env.API_PROXY_TARGET || 'http://localhost:8000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true,
    proxy: { '/api': { target: apiTarget } },
  },
  preview: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true,
    proxy: { '/api': { target: apiTarget } },
  },
});
