import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // FIX: rewrite the cookie domain so the browser accepts the HttpOnly
        // jwt cookie from :8080 when the dev server runs on :5173.
        // Without this the Set-Cookie header is ignored and every request
        // after login appears unauthenticated.
        cookieDomainRewrite: 'localhost',
      }
    }
  }
})
