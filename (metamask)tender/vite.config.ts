import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: { 'process.env': {}, global: 'globalThis' },
  css: {
    postcss: { plugins: [tailwindcss(), autoprefixer()] }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      process: path.resolve(__dirname, 'node_modules/process/browser'),
      buffer: path.resolve(__dirname, 'node_modules/buffer'),
      stream: path.resolve(__dirname, 'node_modules/stream-browserify'),
      crypto: path.resolve(__dirname, 'node_modules/crypto-browserify'),
      path: path.resolve(__dirname, 'node_modules/path-browserify'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          ethers: ['ethers'],
        },
      },
      external: ['buffer'],
    },
  },
  server: {
    port: 3000,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 3000,
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ['buffer','process'],
    esbuildOptions: {
      define: { global: 'globalThis' },
    },
  },
}); 