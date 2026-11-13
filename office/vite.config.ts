import { defineConfig } from 'vite'

export default defineConfig({
  root: 'web',
  build: { outDir: '../dist', emptyOutDir: true, chunkSizeWarningLimit: 900 },
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://127.0.0.1:4310', changeOrigin: false } },
  },
})
