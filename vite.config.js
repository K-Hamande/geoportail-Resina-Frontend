import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Toute requete du frontend commencant par /api ou /backoffice est
    // automatiquement redirigee vers le backend Spring Boot, cote serveur.
    // Le navigateur ne voit jamais localhost:8080 directement -> pas de CORS.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/backoffice': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})