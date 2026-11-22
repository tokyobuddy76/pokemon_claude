import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Serves the Vercel-style functions in /api during `npm run dev` and
 * `npm run preview`, so /api/pokemon works locally without the Vercel CLI.
 * On Vercel, the platform serves /api itself and this plugin is not used.
 */
function localApiRoutes() {
  const apiDir = resolve(import.meta.dirname, 'api');

  const middleware = (loadModule) => async (req, res, next) => {
    const match = /^\/api\/([a-z0-9-]+)(?:[/?]|$)/i.exec(req.url ?? '');
    if (!match) return next();
    const file = resolve(apiDir, `${match[1]}.js`);
    if (!existsSync(file)) return next();
    try {
      const mod = await loadModule(file);
      await mod.default(req, res);
    } catch (err) {
      console.error('[api] handler error:', err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Internal error in local API route.' }));
      }
    }
  };

  return {
    name: 'pokematch-local-api',
    configureServer(server) {
      // ssrLoadModule picks up edits to api/*.js without restarting.
      server.middlewares.use(middleware((file) => server.ssrLoadModule(file)));
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware((file) => import(pathToFileURL(file).href)));
    },
  };
}

export default defineConfig({
  plugins: [react(), localApiRoutes()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
