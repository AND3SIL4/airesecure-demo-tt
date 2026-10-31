import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/** Asigna las librerías pesadas a fragmentos propios (feature 009, plan §1). */
function vendorChunk(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined;
  // Three.js juntos superaba 500 kB: el núcleo (three.core.js) y el renderizador WebGL + addons van aparte.
  if (/[\\/]node_modules[\\/]three[\\/]build[\\/]three\.core\.js$/.test(id)) return 'vendor-three-core';
  if (/[\\/]node_modules[\\/]three[\\/]/.test(id)) return 'vendor-three';
  if (/[\\/]node_modules[\\/](recharts|d3-[^\\/]+|victory-vendor|internmap|decimal\.js-light|es-toolkit|eventemitter3|immer|reselect|redux|@reduxjs[\\/]toolkit|react-redux|redux-thunk|use-sync-external-store|tiny-invariant|clsx)[\\/]/.test(id)) {
    return 'vendor-charts';
  }
  if (/[\\/]node_modules[\\/]@tanstack[\\/]/.test(id)) return 'vendor-query';
  if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler|cookie|set-cookie-parser)[\\/]/.test(id)) {
    return 'vendor-react';
  }
  return undefined;
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: vendorChunk,
      },
    },
  },
});
