import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  // Configuración del servidor de desarrollo
  server: {
    port: 5173,
    strictPort: true,
    host: 'localhost',
  },

  // Configuración de build
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'axios': ['axios']
        }
      }
    }
  },

  // Aliases para imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@assets': path.resolve(__dirname, './src/assets')
    }
  },

  // Optimizaciones
  optimizeDeps: {
    include: ['react', 'react-dom', 'axios']
  }
});