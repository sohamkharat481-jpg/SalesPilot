// @ts-ignore
import { app, serverInitPromise } from '../dist/server.cjs';

export default async function handler(req: any, res: any) {
  // CORS & Preflight OPTIONS handler
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-organization-id, X-Organization-ID, x-requested-with');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  const pathParam = String(req.query?.path || req.headers?.['x-matched-path'] || req.url || '');
  if (pathParam.includes('google/callback')) {
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    if (serverInitPromise) {
      await serverInitPromise;
    }
  } catch (err) {
    console.error('[SERVERLESS INIT ERROR]', err);
  }

  // Restore request URL from Vercel rewrite parameter if present
  if (req.query && req.query.path && typeof req.query.path === 'string') {
    const queryEntries = Object.entries(req.query).filter(([k]) => k !== 'path');
    if (queryEntries.length > 0) {
      const qs = new URLSearchParams(queryEntries.map(([k, v]) => [k, String(v)])).toString();
      req.url = `${req.query.path}${req.query.path.includes('?') ? '&' : '?'}${qs}`;
    } else {
      req.url = req.query.path;
    }
  } else if (req.headers && req.headers['x-matched-path'] && typeof req.headers['x-matched-path'] === 'string') {
    req.url = req.headers['x-matched-path'];
  }

  return app(req, res);
}
