import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv';


dotenv.config();

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.VITE_PORT || '5000'),
    host: process.env.VITE_DOMAIN_NAME || 'localhost'
  },
  preview: {
    port: parseInt(process.env.VITE_PORT || '5000'),
    host: process.env.VITE_DOMAIN_NAME || 'localhost'
  }
})
