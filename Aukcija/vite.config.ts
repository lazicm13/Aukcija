import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
<<<<<<< HEAD
  server: {
    host: '192.168.68.133', // ili '0.0.0.0' da sluša na svim interfejsima
    port: 5173, // Opciono: možeš promeniti port ako je potrebno
  }
=======
  base: '/',  // Osigurava da rute rade ispravno
  build: {
    outDir: 'dist', // osigurava da se build generiše u pravi folder
  },
>>>>>>> c7ee0d598cb7f3c043116d34a14febec0f366a7c
})
