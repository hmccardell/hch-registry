import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Forward API calls to the local Express server so the browser stays
    // single-origin, matching production where the server serves this app.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
