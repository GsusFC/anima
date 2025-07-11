import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  build: {
    rollupOptions: {
      external: [],
    },
    // Force esbuild for better compatibility in Docker
    minify: 'esbuild'
  },
  esbuild: {
    jsx: 'automatic'
  },
  optimizeDeps: {
    force: true,
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
  }
}) 