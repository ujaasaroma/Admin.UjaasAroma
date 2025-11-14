import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  base: "/Admin.UjaasAroma",
  server: {
    host: true, // same as --host
    port: 5173, // or another open port
  }
})
