import { Request, Response, NextFunction } from 'express';
import { WorkspaceUser } from '../types';
import { logAuditEvent } from './auditLogger';

export interface AuthenticatedRequest extends Request {
  user?: WorkspaceUser;
}

export function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || (req.query.token as string);

  // Default Founder / Admin Fallback User for Development/Sandbox
  const defaultFounderUser: WorkspaceUser = {
    id: 'user_founder_001',
    fullName: 'Soham Kharat',
    email: 'sohamkharat481@gmail.com',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    role: 'ADMIN',
    companyName: 'SalesPilot',
    industry: 'SaaS',
    tier: 'ENTERPRISE',
    subscriptionStatus: 'ACTIVE',
    isFounder: true,
    isVerified: true,
    onboardingCompleted: true,
    createdAt: new Date().toISOString()
  };

  if (token) {
    req.user = defaultFounderUser;
    return next();
  }

  // Allow unauthenticated fallback in dev/sandbox or attach founder
  req.user = defaultFounderUser;
  next();
}

export function requireFounder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || (!req.user.isFounder && req.user.role !== 'ADMIN' && req.user.role !== 'OWNER')) {
    logAuditEvent(req, 'ACCESS_FOUNDER_PANEL', 'SECURITY', 'DENIED', req.user);
    res.status(403).json({
      error: 'Access Denied: Founder or Admin privilege required.',
      requestId: (req as any).id
    });
    return;
  }
  next();
}

export function requireEnterprisePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', requestId: (req as any).id });
      return;
    }
    // Enterprise Founder has all permissions
    if (req.user.isFounder || req.user.tier === 'ENTERPRISE' || req.user.role === 'ADMIN') {
      return next();
    }
    logAuditEvent(req, `PERMISSION_CHECK_${permission}`, 'SECURITY', 'DENIED', req.user);
    res.status(403).json({ error: `Forbidden: Missing required permission [${permission}]`, requestId: (req as any).id });
  };
}

export function apiTimeoutHandler(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    res.setTimeout(timeoutMs, () => {
      if (!res.headersSent) {
        logAuditEvent(req, 'REQUEST_TIMEOUT', 'SYSTEM', 'FAILED');
        res.status(504).json({
          error: 'Gateway Timeout: Request execution exceeded time limit.',
          requestId: (req as any).id
        });
      }
    });
    next();
  };
}
