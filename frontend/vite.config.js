import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Static build for GitHub Pages at https://<user>.github.io/planet-mixer/
export default defineConfig({
  base: '/planet-mixer/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1600,
  },
});
