/**
 * Admin access is not verified yet: the backend has no administrator sign-in. The panel therefore runs only
 * in an explicit demo mode.
 *   - Development (npm run dev): on by default, marked on screen. Set VITE_ADMIN_DEMO_MODE=false to see the gate.
 *   - Production build: off unless VITE_ADMIN_DEMO_MODE=true is set at build time. Do not set it on a public host.
 * Demo mode never proves that a user is allowed to be here. The server must enforce permissions (RBAC) and MFA.
 */
export const ADMIN_DEMO_MODE = import.meta.env.DEV
  ? import.meta.env.VITE_ADMIN_DEMO_MODE !== 'false'
  : import.meta.env.VITE_ADMIN_DEMO_MODE === 'true';

export const WEB_URL = import.meta.env.VITE_WEB_URL || 'http://localhost:5173';
export const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174';
