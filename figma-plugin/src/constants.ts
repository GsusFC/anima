// API base URL can be injected at build time via process.env.API_BASE_URL (esbuild inlines the string)
// Fallbacks:
// 1. Explicit ENV var (highest priority)
// 2. Localhost when running plugin with local dev server
// 3. Production API domain

// Declare minimal type so TypeScript does not complain – this gets stripped by esbuild.
declare const process: {
  env: { API_BASE_URL?: string };
};

export const API_BASE_URL: string =
  typeof process !== 'undefined' && process.env.API_BASE_URL && process.env.API_BASE_URL.length > 0
    ? process.env.API_BASE_URL
    : window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : 'https://anima-production-4d10.up.railway.app'; 