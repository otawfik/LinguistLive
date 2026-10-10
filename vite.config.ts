import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// dev only: answer /api/live-token with the same server function Vercel runs in production
const liveTokenApi = (): Plugin => ({
  name: 'live-token-dev',
  configureServer(server) {
    server.middlewares.use('/api/live-token', async (_req, res) => {
      const mod = await server.ssrLoadModule('/api/live-token.ts');
      const response: Response = await mod.POST();
      res.statusCode = response.status;
      res.setHeader('Content-Type', 'application/json');
      res.end(await response.text());
    });
  },
});

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // only when set: process.env coerces undefined to the string 'undefined'
    if (env.GEMINI_API_KEY) process.env.GEMINI_API_KEY ??= env.GEMINI_API_KEY;
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), liveTokenApi()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
