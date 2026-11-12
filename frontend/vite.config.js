import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'firebase'],
  },
  server: {
    fs: { allow: [fileURLToPath(new URL('../..', import.meta.url))] },
  },
})
