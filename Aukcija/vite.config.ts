import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',  // Osigurava da rute rade ispravno
  build: {
    outDir: 'dist', // osigurava da se build generiše u pravi folder
  },
})
