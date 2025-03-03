import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '192.168.68.133', // ili '0.0.0.0' da sluša na svim interfejsima
    port: 5173, // Opciono: možeš promeniti port ako je potrebno
  }
})
