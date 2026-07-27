import { Request, Response, NextFunction } from 'express';

// Remove dangerous script tags and HTML injection patterns
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return input;
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

// Deep sanitize object values
export function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return sanitizeString(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (typeof obj === 'object') {
    const sanitized: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  return obj;
}

// Input sanitization middleware for Express
export function globalSanitizerMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
}

// Check for dangerous SQL injection signatures in dynamic raw strings
export function detectSqlInjectionPattern(value: string): boolean {
  if (typeof value !== 'string') return false;
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC|UNION)\b)/i,
    /(--|\/\*|\*\/|;)/,
    /(' OR '1'='1'|' OR 1=1)/i
  ];
  return sqlPatterns.some(pattern => pattern.test(value));
}
