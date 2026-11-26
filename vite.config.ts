import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { handleWall, memoryStore, storeFromEnv } from './server/wall';

/**
 * Local stand-in for the Vercel Function at /api/wall. Uses Upstash if its
 * env vars are present (e.g. from `vercel env pull`), otherwise an in-memory
 * store that resets when the dev server restarts.
 */
function wallDevApi(): Plugin {
  return {
    name: 'svc-wall-dev-api',
    configureServer(server) {
      const store = storeFromEnv(process.env) ?? memoryStore();
      const admin = process.env.WALL_ADMIN_TOKEN ?? 'dev-admin';
      server.middlewares.use('/api/wall', async (req, res) => {
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);
        const body = chunks.length ? Buffer.concat(chunks) : undefined;
        const request = new Request(`http://localhost${req.originalUrl ?? req.url}`, {
          method: req.method,
          headers: req.headers as Record<string, string>,
          body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body,
        });
        const response = await handleWall(request, store, admin);
        res.statusCode = response.status;
        response.headers.forEach((v, k) => res.setHeader(k, v));
        res.end(await response.text());
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), wallDevApi()],
  server: { port: 5173 },
});
