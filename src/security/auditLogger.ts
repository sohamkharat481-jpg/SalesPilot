import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface SecurityAuditLog {
  id: string;
  requestId: string;
  timestamp: string;
  userId?: string;
  userEmail?: string;
  action: string;
  module: string;
  status: 'SUCCESS' | 'DENIED' | 'FAILED';
  ipAddress: string;
  userAgent: string;
  details?: Record<string, any>;
}

const auditLogs: SecurityAuditLog[] = [];
const MAX_AUDIT_LOGS = 500;

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const reqId = (req.headers['x-request-id'] as string) || `req_${crypto.randomBytes(8).toString('hex')}`;
  (req as any).id = reqId;
  res.setHeader('X-Request-ID', reqId);
  next();
}

export function logAuditEvent(
  req: Request,
  action: string,
  module: string,
  status: 'SUCCESS' | 'DENIED' | 'FAILED',
  user?: { id?: string; email?: string },
  details?: Record<string, any>
) {
  const log: SecurityAuditLog = {
    id: `audit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    requestId: (req as any).id || 'unknown',
    timestamp: new Date().toISOString(),
    userId: user?.id,
    userEmail: user?.email,
    action,
    module,
    status,
    ipAddress: (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1').split(',')[0],
    userAgent: req.headers['user-agent'] || 'Unknown',
    details
  };

  auditLogs.unshift(log);
  if (auditLogs.length > MAX_AUDIT_LOGS) {
    auditLogs.pop();
  }

  console.log(`🛡️ [AUDIT] [${log.status}] ${log.module} - ${log.action} | User: ${log.userEmail || 'anonymous'} | ReqID: ${log.requestId}`);
  return log;
}

export function getAuditLogs(): SecurityAuditLog[] {
  return auditLogs;
}
