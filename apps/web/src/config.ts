/**
 * DEMO_MODE shows the prototype school, teacher and platform-admin screens. They still run on
 * browser-only demo data (src/services/schoolService.ts) and must never be enabled in production.
 */
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
