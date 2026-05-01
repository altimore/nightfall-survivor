import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/nightfall-survivor/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
          react: ['react', 'react-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
});
