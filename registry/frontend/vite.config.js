import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The registry is served from a subpath of the main HCH site (e.g.
// hubcityhackers.com/registry), not its own origin. `base` prefixes every
// asset URL and the dev server's own routes with it. This must stay in sync
// with BASE_PATH in server/src/config.js and the reverse-proxy path in front
// of the deployed service.
const BASE_PATH = '/registry/';

export default defineConfig({
  base: BASE_PATH,
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Fail instead of silently hopping to 5174+ — magic links and the API
    // proxy assume this port.
    strictPort: true,
    // Forward API calls to the local Express server so the browser stays
    // single-origin, matching production where the server serves this app.
    // The server also mounts its routes under BASE_PATH, so proxy that prefix.
    proxy: {
      [`${BASE_PATH}api`]: {
        target: 'http://127.0.0.1:4000',
        changeOrigin: false,
      },
    },
  },
});
