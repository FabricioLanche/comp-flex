import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@backend': resolve(__dirname, '../Backend'),
    },
  },
  server: {
    host: true,
    watch: { usePolling: true },
    proxy: {
      '/scan': {
        target: process.env.BACKEND_ORIGIN ?? 'http://localhost:3000',
        changeOrigin: true,
      },
      '/health': {
        target: process.env.BACKEND_ORIGIN ?? 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
