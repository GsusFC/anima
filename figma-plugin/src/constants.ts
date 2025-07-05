// API base URL can be injected at build time via process.env.API_BASE_URL (esbuild inlines the string)
// Fallbacks:
// 1. Explicit ENV var (highest priority)
// 2. Localhost when running plugin with local dev server
// 3. Production API domain

// Declare minimal type so TypeScript does not complain – this gets stripped by esbuild.
declare const process: {
  env: { API_BASE_URL?: string };
};

// Allow overriding the API URL at runtime via storage (handy when running the plugin on Figma Web)
const localOverride = (() => {
  try {
    // Import storage utility inline to avoid circular dependencies
    if (typeof window !== 'undefined') {
      // Try sessionStorage first, then fall back to null
      return sessionStorage?.getItem('ANIMAGEN_API') || null;
    }
    return null;
  } catch (_) {
    return null;
  }
})();

export const API_BASE_URL: string = localOverride && localOverride.length > 0
  ? localOverride
  : (typeof process !== 'undefined' && process.env.API_BASE_URL && process.env.API_BASE_URL.length > 0
      ? process.env.API_BASE_URL
      : (window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://anima-production-4d10.up.railway.app')); // production fallback

 