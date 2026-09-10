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
    // Forward API calls to the local Express server so the browser stays
    // single-origin, matching production where the server serves this app.
    // The server also mounts its routes under BASE_PATH, so proxy that prefix.
    proxy: {
      [`${BASE_PATH}api`]: 'http://localhost:4000',
    },
  },
});
