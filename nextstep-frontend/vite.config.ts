import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'

dotenv.config()

const allowedHosts = (process.env.VITE_ALLOWED_HOSTS || '')
  .split(';')
  .map(host => host.trim())
  .filter(Boolean) // remove empty strings

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.VITE_PORT || '5000'),
    host: process.env.VITE_DOMAIN_NAME || 'localhost',
    allowedHosts: allowedHosts.length > 0 ? allowedHosts : undefined
  },
  preview: {
    port: parseInt(process.env.VITE_PORT || '5000'),
    host: process.env.VITE_DOMAIN_NAME || 'localhost'
  }
})
