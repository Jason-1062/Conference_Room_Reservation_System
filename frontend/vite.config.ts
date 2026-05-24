import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        // Fallback to localhost:5574 if Aspire environment variables are not set
        target: process.env.SERVER_HTTPS || process.env.SERVER_HTTP || 'http://localhost:5574',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
