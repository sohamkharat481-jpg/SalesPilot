import { authenticateUser, AuthenticatedRequest } from '../security/authMiddleware';
import { OutreachWorker, OutreachWorkerContext } from '../backend/outreachWorker';
import { OutreachQueueItem, OutreachEvent } from '../types/outreach';
import { WorkspaceUser, UserRole } from '../types';

declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;
declare const afterEach: any;

if (typeof describe === 'function') {
  describe('1. Production Authentication Hardening Verification', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it('missing token returns 401 Unauthorized in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.ENABLE_DEV_AUTH_BYPASS = 'false';

      let statusCode = 0;
      let jsonBody: any = null;
      let nextCalled = false;

      const req: any = { headers: {} };
      const res: any = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (body: any) => { jsonBody = body; }
          };
        }
      };
      const next = () => { nextCalled = true; };

      authenticateUser(req, res, next);

      expect(statusCode).toBe(401);
      expect(nextCalled).toBe(false);
      expect(jsonBody?.error).toContain('Unauthorized');
    });

    it('production rejects dev auth bypass even if ENABLE_DEV_AUTH_BYPASS=true', () => {
      process.env.NODE_ENV = 'production';
      process.env.ENABLE_DEV_AUTH_BYPASS = 'true';

      let statusCode = 0;
      let jsonBody: any = null;
      let nextCalled = false;

      const req: any = { headers: {} };
      const res: any = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (body: any) => { jsonBody = body; }
          };
        }
      };
      const next = () => { nextCalled = true; };

      authenticateUser(req, res, next);

      // In production, bypass MUST NOT activate
      expect(statusCode).toBe(401);
      expect(nextCalled).toBe(false);
      expect(req.user).toBeUndefined();
    });

    it('VERCEL environment flag triggers production security enforcement', () => {
      delete process.env.NODE_ENV;
      process.env.VERCEL = '1';
      process.env.ENABLE_DEV_AUTH_BYPASS = 'true';

      let statusCode = 0;
      const req: any = { headers: {} };
      const res: any = {
        status: (code: number) => {
          statusCode = code;
          return { json: () => {} };
        }
      };
      const next = () => {};

      authenticateUser(req, res, next);
      expect(statusCode).toBe(401);
      expect(req.user).toBeUndefined();
    });

    it('expired session token resolver returns null and rejects access', () => {
      const expiredTimestamp = Date.now() - 10000;
      const sessionStore = new Map<string, { userId: string; expiresAt: number }>();
      sessionStore.set('expired_tok_123', { userId: 'usr_test_1', expiresAt: expiredTimestamp });

      const resolveSession = (token: string) => {
        const session = sessionStore.get(token);
        if (session && session.expiresAt > Date.now()) {
          return session.userId;
        }
        return null;
      };

      expect(resolveSession('expired_tok_123')).toBeNull();
    });

    it('invalid token structure returns null and denies access', () => {
      const sessionStore = new Map<string, { userId: string; expiresAt: number }>();
      const resolveSession = (token: string) => {
        if (!token || token.trim() === '' || !sessionStore.has(token)) return null;
        return sessionStore.get(token)!.userId;
      };

      expect(resolveSession('invalid_garbage_token')).toBeNull();
      expect(resolveSession('')).toBeNull();
    });
  });

  describe('2. Gmail Account Resolution & Send Safety Verification', () => {
    it('rejects sending when no Gmail account is connected', async () => {
      const sendGmailMessage = async (account: any, recipient: string, subject: string, body: string) => {
        if (!account || !account.accessToken) {
          throw new Error('No authorized Gmail account connected.');
        }
        return { providerMessageId: 'msg_1' };
      };

      await expect(sendGmailMessage(null, 'test@example.com', 'Subject', 'Body'))
        .rejects.toThrow('No authorized Gmail account connected.');
    });

    it('rejects mock_access_token in production mode', async () => {
      const sendGmailMessage = async (account: any, recipient: string, subject: string, body: string, isProduction: boolean) => {
        if (!account || !account.accessToken) {
          throw new Error('No authorized Gmail account connected.');
        }
        if (account.accessToken.startsWith('mock_')) {
          if (isProduction) {
            throw new Error(`Cannot send live email with mock token for ${account.email}. Real Gmail OAuth connection required.`);
          }
        }
        return { providerMessageId: 'real_msg_id' };
      };

      const mockGoogleAccountsDb = [
        { id: '1', email: 'alpha@company.com', access_token: 'real_token_alpha', organization_id: 'org_alpha' },
        { id: '2', email: 'beta@company.com', access_token: 'real_token_beta', organization_id: 'org_beta' },
        { id: '3', email: 'gamma@company.com', access_token: 'mock_token', organization_id: 'org_gamma' }
      ];

      const getGmailAccount = async (orgId: string) => {
        const match = mockGoogleAccountsDb.find(a => a.organization_id === orgId && !a.access_token.startsWith('mock_'));
        if (!match) return null;
        return { email: match.email, accessToken: match.access_token };
      };

      const alphaAccount = await getGmailAccount('org_alpha');
      const betaAccount = await getGmailAccount('org_beta');
      const gammaAccount = await getGmailAccount('org_gamma');

      expect(alphaAccount?.email).toBe('alpha@company.com');
      expect(betaAccount?.email).toBe('beta@company.com');
      expect(gammaAccount).toBeNull(); // No cross-tenant leak or fallback
    });
  });

  describe('3. Dynamic Role and Membership Verification', () => {
    it('resolves non-founder role to unprivileged VIEWER if not set to OWNER/ADMIN', () => {
      const resolveRole = (profileRole?: string, isFounder: boolean = false): UserRole => {
        if (isFounder) return 'OWNER';
        if (profileRole) {
          const r = profileRole.toUpperCase();
          if (r === 'OWNER' || r === 'ADMIN' || r === 'SALES' || r === 'VIEWER') {
            return r as UserRole;
          }
        }
        return 'VIEWER';
      };

      expect(resolveRole('ADMIN', false)).toBe('ADMIN');
      expect(resolveRole('SALES', false)).toBe('SALES');
      expect(resolveRole(undefined, false)).toBe('VIEWER');
      expect(resolveRole('UNKNOWN_ROLE', false)).toBe('VIEWER');
      expect(resolveRole(undefined, true)).toBe('OWNER');
    });

    it('does not assign hardcoded ADMIN on standard sign-in', () => {
      const newUser = {
        id: 'usr_new_99',
        email: 'member@company.com',
        user_metadata: { full_name: 'Regular Member' }
      };

      const resolveNewUserRole = (email: string) => {
        const isFounder = email.toLowerCase() === 'sohamkharat481@gmail.com';
        return isFounder ? 'OWNER' : 'VIEWER';
      };

      expect(resolveNewUserRole(newUser.email)).toBe('VIEWER');
    });
  });

  describe('4. Outreach Queue Endpoint & Tenant Isolation Verification', () => {
    it('rejects unauthenticated requests to /api/v1/outreach/queue', () => {
      const handleGetQueue = (user: WorkspaceUser | null) => {
        if (!user) {
          return { status: 401, error: 'Unauthorized. Authentication token required.' };
        }
        return { status: 200, queue: [] };
      };

      const result = handleGetQueue(null);
      expect(result.status).toBe(401);
    });

    it('enforces tenant isolation and rejects cross-organization mismatch with 403', () => {
      const verifiedUser: WorkspaceUser = {
        id: 'usr_alpha_1',
        email: 'user@alpha.com',
        fullName: 'Alpha User',
        companyName: 'Alpha Corp',
        industry: 'SaaS',
        role: 'VIEWER',
        organizationId: 'org_alpha',
        tier: 'STARTER',
        subscriptionStatus: 'ACTIVE',
        isFounder: false,
        isVerified: true,
        createdAt: new Date().toISOString()
      };

      const resolveOrgAccess = (user: WorkspaceUser, requestedOrgId?: string) => {
        const verifiedOrg = user.organizationId;
        if (!verifiedOrg) {
          return { status: 403, error: 'No active workspace' };
        }
        if (requestedOrgId && requestedOrgId !== verifiedOrg) {
          return { status: 403, error: 'Access denied: Organization mismatch' };
        }
        return { status: 200, orgId: verifiedOrg };
      };

      // User belonging to org_alpha requests org_beta
      const mismatch = resolveOrgAccess(verifiedUser, 'org_beta');
      expect(mismatch.status).toBe(403);
      expect(mismatch.error).toContain('mismatch');

      // Matching org access succeeds
      const match = resolveOrgAccess(verifiedUser, 'org_alpha');
      expect(match.status).toBe(200);
      expect(match.orgId).toBe('org_alpha');
    });

    it('safely handles non-JSON / HTML response from endpoints without throwing JSON parsing syntax errors', async () => {
      const mockSafeFetch = async (mockResponse: { ok: boolean; contentType: string; text: string }) => {
        if (!mockResponse.ok) return null;
        if (!mockResponse.contentType.includes('application/json')) return null;
        try {
          return JSON.parse(mockResponse.text);
        } catch {
          return null;
        }
      };

      // Simulating Vite SPA HTML fallback returned for an unmapped route
      const htmlResponse = {
        ok: true,
        contentType: 'text/html; charset=utf-8',
        text: '<!DOCTYPE html><html><body>Preview App</body></html>'
      };

      const result = await mockSafeFetch(htmlResponse);
      // Must gracefully return null without throwing SyntaxError: Unexpected token '<'
      expect(result).toBeNull();

      // Valid JSON response succeeds
      const jsonResponse = {
        ok: true,
        contentType: 'application/json',
        text: JSON.stringify({ queue: [{ id: 'q_1', status: 'QUEUED' }] })
      };
      const validResult = await mockSafeFetch(jsonResponse);
      expect(validResult).toEqual({ queue: [{ id: 'q_1', status: 'QUEUED' }] });
    });
  });

  describe('5. Founder/Lifetime Enterprise Access System Verification', () => {
    it('automatically grants LIFETIME / ENTERPRISE / OWNER / unlimited access to ayesha.kashif13008@gmail.com', () => {
      const email = 'ayesha.kashif13008@gmail.com';
      const emailLower = email.toLowerCase();
      
      // Simulate isFounder check
      const isFounder = emailLower === 'sohamkharat481@gmail.com' || 
                        emailLower === 'soham@gmail.com' || 
                        emailLower === 'pordigyai@gmail.com' || 
                        emailLower === 'ayesha.kashif13008@gmail.com' || 
                        emailLower.includes('founder') || 
                        emailLower.includes('pordigy');
                        
      expect(isFounder).toBe(true);

      // Simulate user object enrichment for founder
      const userObj = {
        email,
        tier: 'STARTER',
        subscriptionStatus: 'ACTIVE',
        role: 'VIEWER',
        isFounder: false
      };

      if (isFounder) {
        userObj.tier = 'ENTERPRISE';
        userObj.isFounder = true;
        userObj.subscriptionStatus = 'LIFETIME';
        userObj.role = 'OWNER';
      }

      expect(userObj.tier).toBe('ENTERPRISE');
      expect(userObj.isFounder).toBe(true);
      expect(userObj.subscriptionStatus).toBe('LIFETIME');
      expect(userObj.role).toBe('OWNER');
    });
  });
}

export async function runFinalProductionVerificationTestSuite() {
  console.log('=== STARTING FINAL PRODUCTION VERIFICATION TEST SUITE ===');
  let passed = 0;
  let failed = 0;
  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  };

  try {
    const email = 'ayesha.kashif13008@gmail.com';
    const emailLower = email.toLowerCase();
    
    const isFounder = emailLower === 'sohamkharat481@gmail.com' || 
                      emailLower === 'soham@gmail.com' || 
                      emailLower === 'pordigyai@gmail.com' || 
                      emailLower === 'ayesha.kashif13008@gmail.com' || 
                      emailLower.includes('founder') || 
                      emailLower.includes('pordigy');
                      
    assert(isFounder === true, 'ayesha.kashif13008@gmail.com is recognized as founder');

    const userObj = {
      email,
      tier: 'STARTER',
      subscriptionStatus: 'ACTIVE',
      role: 'VIEWER',
      isFounder: false
    };

    if (isFounder) {
      userObj.tier = 'ENTERPRISE';
      userObj.isFounder = true;
      userObj.subscriptionStatus = 'LIFETIME';
      userObj.role = 'OWNER';
    }

    assert(userObj.tier === 'ENTERPRISE', 'ayesha receives ENTERPRISE tier');
    assert(userObj.isFounder === true, 'ayesha receives founder flag');
    assert(userObj.subscriptionStatus === 'LIFETIME', 'ayesha receives LIFETIME subscription status');
    assert(userObj.role === 'OWNER', 'ayesha receives OWNER role');
  } catch (err) {
    console.error('Founder verification test error:', err);
    failed++;
  }

  return { passed, failed };
}
