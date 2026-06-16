import { defineConfig } from 'vite';

export default defineConfig({
  root: 'client',
  server: {
    port: 41023,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:42023',
        changeOrigin: true
      }
    }
  }
});
