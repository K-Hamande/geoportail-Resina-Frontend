import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // On cible precisement /backoffice/api (les vrais endpoints REST
      // du backend), et non /backoffice tout court - qui est une route
      // FRONTEND (le tableau de bord React), pas une route backend.
      '/backoffice/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})