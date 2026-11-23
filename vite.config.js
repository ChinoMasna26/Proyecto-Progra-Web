import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // En desarrollo, /api se reenvía al servidor Express (carpeta backend).
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
