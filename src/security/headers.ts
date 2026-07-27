import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

export function configureSecurityHeaders() {
  const helmetMiddleware = helmet({
    contentSecurityPolicy: false, // Let custom CSP / CORS handle iframe and OAuth popup requirements
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    frameguard: false, // Allow iframe embedding in AI Studio workspace
    xssFilter: true,
    noSniff: true,
    hidePoweredBy: true
  });

  return (req: Request, res: Response, next: NextFunction) => {
    helmetMiddleware(req, res, () => {
      // Additional security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

      // CORS Security Handling
      const origin = req.headers.origin;
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Request-ID');
      }

      if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
      }

      next();
    });
  };
}
