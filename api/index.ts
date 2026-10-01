// @ts-ignore
import { app, serverInitPromise } from '../dist/server.cjs';

export default async function handler(req: any, res: any) {
  try {
    if (serverInitPromise) {
      await serverInitPromise;
    }
  } catch (err) {
    console.error('[SERVERLESS INIT ERROR]', err);
  }

  // Restore request URL from Vercel rewrite parameter if present
  if (req.query && req.query.path && typeof req.query.path === 'string') {
    req.url = req.query.path;
  } else if (req.headers && req.headers['x-matched-path'] && typeof req.headers['x-matched-path'] === 'string') {
    req.url = req.headers['x-matched-path'];
  }

  return app(req, res);
}
