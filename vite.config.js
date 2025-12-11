import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: "/5ave-5core/",
  plugins: [
    react(),
    tailwindcss(),
  ],
})
