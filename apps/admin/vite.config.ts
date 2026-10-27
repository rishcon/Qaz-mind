import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// QazMind Admin: http://127.0.0.1:5174 (also reachable as http://localhost:5174).
// /api is forwarded to the same FastAPI backend that serves QazMind Web.
const apiTarget = process.env.API_PROXY_TARGET || 'http://localhost:8000';
// In Docker the dev server listens on all interfaces of the container and polls files on the bind mount.
const host = process.env.DEV_HOST || '127.0.0.1';
const usePolling = process.env.DEV_USE_POLLING === 'true';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host,
    port: 5174,
    strictPort: true,
    watch: usePolling ? { usePolling: true, interval: 300 } : undefined,
    proxy: { '/api': { target: apiTarget } },
  },
  preview: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true,
    proxy: { '/api': { target: apiTarget } },
  },
});
