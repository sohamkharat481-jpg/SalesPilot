import { Request, Response, NextFunction } from 'express';
import { logAuditEvent } from './auditLogger';

export function centralizedErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const reqId = (req as any).id || 'unknown';
  const statusCode = err.status || err.statusCode || 500;
  
  // Log security/error audit event
  logAuditEvent(req, 'API_ERROR_EXCEPTION', 'SYSTEM', 'FAILED', undefined, {
    message: err.message,
    statusCode,
    path: req.path
  });

  console.error(`💥 [CENTRALIZED ERROR HANDLER] [ReqID: ${reqId}] [${req.method} ${req.path}] Status ${statusCode}:`, err.message || err);

  if (res.headersSent) {
    return next(err);
  }

  // Safe error response without exposing internal server stack traces to users
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal Server Error' : err.message || 'An unexpected error occurred',
    details: isProduction ? undefined : (err.details || err.message),
    requestId: reqId,
    timestamp: new Date().toISOString()
  });
}
