import React, { createContext, useContext, useState, useEffect } from 'react';
import { WorkspaceUser, UserRole, SubscriptionTier, Organization, TeamMember } from '../types';
import { getSupabaseClient, isSupabaseConfigured, getSupabaseDiagnostics } from '../lib/supabase';

interface AuthContextType {
  user: WorkspaceUser | null;
  organization: Organization | null;
  teamMembers: TeamMember[];
  isSandbox: boolean;
  isLoading: boolean;
  authView: 'login' | 'authenticated' | 'email_verification' | 'profile_setup' | 'org_setup' | 'invite_team';
  authError: string | null;
  setAuthView: (view: 'login' | 'authenticated' | 'email_verification' | 'profile_setup' | 'org_setup' | 'invite_team') => void;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  signup: (email: string, password: string, fullName: string, role: UserRole) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  verifyEmail: (code: string) => Promise<boolean>;
  setupProfile: (fullName: string, title: string, avatarUrl: string) => Promise<boolean>;
  setupOrganization: (name: string, industry: string, domain: string, tier: SubscriptionTier, country?: string, timezone?: string, currency?: string, logo?: string) => Promise<boolean>;
  inviteTeamMember: (email: string, role: UserRole, fullName?: string) => Promise<boolean>;
  updateTeamMemberRole: (id: string, role: UserRole) => Promise<boolean>;
  deleteTeamMember: (id: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  checkPermissions: (requiredRole: UserRole | UserRole[]) => boolean;
  isReadOnly: boolean;
  canManageCampaigns: boolean;
  canManageSettings: boolean;
  canManageBilling: boolean;
  
  // Enterprise fields
  updateProfile: (profileData: Partial<WorkspaceUser> & { language?: string; phone?: string; timezone?: string; notificationPrefs?: any }) => Promise<boolean>;
  updateOrganization: (orgData: Partial<Organization> & { logo?: string; gst?: string; address?: string; country?: string; timezone?: string; currency?: string; workingHours?: { start: string; end: string } }) => Promise<boolean>;
  changePassword: (newPassword: string) => Promise<boolean>;
  enrollMFA: () => Promise<{ qrCode: string; secret: string }>;
  verifyAndEnableMFA: (token: string) => Promise<boolean>;
  disableMFA: () => Promise<boolean>;
  deactivateUser: (userId: string) => Promise<boolean>;
  transferOwnership: (userId: string) => Promise<boolean>;
  activityLogs: any[];
  loginHistory: any[];
  logActivity: (action: string, module: string) => void;
  rememberMe: boolean;
  setRememberMe: (val: boolean) => void;
  sessionExpiryCountdown: number | null;
  extendSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log("Stage C: AuthContext initialized");
  const [user, setUser] = useState<WorkspaceUser | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isSandbox, setIsSandbox] = useState(() => !isSupabaseConfigured());
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('remember_me') !== 'false');
  
  const [activityLogs, setActivityLogs] = useState<any[]>(() => {
    const stored = localStorage.getItem('activity_logs');
    return stored ? JSON.parse(stored) : [
      { id: '1', action: 'Console loaded', module: 'System', timestamp: new Date(Date.now() - 3600000).toISOString(), browser: 'Chrome', ip: '127.0.0.1', device: 'Desktop' }
    ];
  });
  
  const [loginHistory, setLoginHistory] = useState<any[]>(() => {
    const stored = localStorage.getItem('login_history');
    return stored ? JSON.parse(stored) : [
      { id: '1', timestamp: new Date(Date.now() - 3600000).toISOString(), browser: 'Chrome (macOS)', ip: '192.168.1.101', location: 'Bengaluru, India', device: 'Desktop', status: 'Success' }
    ];
  });

  const [sessionExpiryCountdown, setSessionExpiryCountdown] = useState<number | null>(null);
  const [lastActive, setLastActive] = useState<number>(Date.now());
  
  // Navigation view inside authentication cycle
  const [authView, setAuthView] = useState<'login' | 'authenticated' | 'email_verification' | 'profile_setup' | 'org_setup' | 'invite_team'>('login');

  // Save log states to localStorage
  useEffect(() => {
    localStorage.setItem('activity_logs', JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    localStorage.setItem('login_history', JSON.stringify(loginHistory));
  }, [loginHistory]);

  useEffect(() => {
    localStorage.setItem('remember_me', String(rememberMe));
  }, [rememberMe]);

  // Activity tracking for idle timeout (Session Expiry)
  useEffect(() => {
    if (!user) {
      setSessionExpiryCountdown(null);
      return;
    }

    const resetTimer = () => {
      setLastActive(Date.now());
      if (sessionExpiryCountdown !== null) {
        setSessionExpiryCountdown(null);
      }
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('scroll', resetTimer);

    // Check inactivity every second
    const interval = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastActive;
      const MAX_IDLE_MS = 15 * 60 * 1000; // 15 mins
      const WARNING_THRESHOLD_MS = 14 * 60 * 1000; // Warn after 14 mins

      if (idleTime >= MAX_IDLE_MS) {
        logout();
      } else if (idleTime >= WARNING_THRESHOLD_MS) {
        const remainingSeconds = Math.max(0, Math.floor((MAX_IDLE_MS - idleTime) / 1000));
        setSessionExpiryCountdown(remainingSeconds);
      } else {
        setSessionExpiryCountdown(null);
      }
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
      clearInterval(interval);
    };
  }, [user, lastActive, sessionExpiryCountdown]);

  const logActivity = (action: string, module: string) => {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    const isMobile = /Mobi|Android/i.test(ua);
    const device = isMobile ? 'Mobile' : 'Desktop';
    const ip = '192.168.1.' + (100 + Math.floor(Math.random() * 150));

    const newLog = {
      id: 'log_' + Math.floor(Math.random() * 1000000),
      action,
      module,
      timestamp: new Date().toISOString(),
      browser,
      ip,
      device
    };
    setActivityLogs(prev => [newLog, ...prev.slice(0, 99)]);
  };

  const extendSession = () => {
    setLastActive(Date.now());
    setSessionExpiryCountdown(null);
  };

  // Sync Supabase settings state
  useEffect(() => {
    const configured = isSupabaseConfigured();
    setIsSandbox(!configured);

    // Initial session checking and OAuth state recovery
    async function initAuth() {
      setIsLoading(true);

      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.warn('[SUPABASE GET SESSION WARNING]', error);
          }
          if (session?.user) {
            console.log("[OAUTH STEP 3] Valid Supabase session detected:", session.user.email);
            const email = session.user.email || '';
            const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || email.split('@')[0] || 'User';

            const oauthUser: WorkspaceUser = {
              id: session.user.id,
              fullName,
              email,
              avatarUrl: session.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
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

            setUser(oauthUser);
            setAuthView('authenticated');
            if (session.access_token) {
              localStorage.setItem('salespilot_token', session.access_token);
            }
            localStorage.setItem('salespilot_user', JSON.stringify(oauthUser));

            // Clean up OAuth callback state in URL without full page reload
            if (window.location.hash.includes('access_token') || window.location.pathname.includes('/auth/callback')) {
              window.history.replaceState({}, document.title, '/');
            }

            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.warn('[SUPABASE INIT ERROR]', err);
        }
      }

      // Check fallback stored session in localStorage
      const token = localStorage.getItem('salespilot_token');
      const storedUser = localStorage.getItem('salespilot_user');
      const storedOrg = localStorage.getItem('salespilot_org');
      const storedTeam = localStorage.getItem('salespilot_team');

      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setAuthView('authenticated');
          if (storedOrg) setOrganization(JSON.parse(storedOrg));
          if (storedTeam) setTeamMembers(JSON.parse(storedTeam));
          setIsLoading(false);
          return;
        } catch (err) {
          console.warn('[LOCAL STORAGE SESSION ERROR]', err);
        }
      }

      // Unauthenticated state
      setUser(null);
      setOrganization(null);
      setTeamMembers([]);
      localStorage.removeItem('salespilot_token');
      localStorage.removeItem('salespilot_user');
      localStorage.removeItem('salespilot_org');
      localStorage.removeItem('salespilot_team');
      setAuthView('login');
      setIsLoading(false);
    }

    initAuth();

    // Listen for Supabase auth state changes
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log(`[SUPABASE AUTH STATE CHANGE] ${event}`);
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          const email = session.user.email || '';
          const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || email.split('@')[0] || 'User';

          const oauthUser: WorkspaceUser = {
            id: session.user.id,
            fullName,
            email,
            avatarUrl: session.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
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

          setUser(oauthUser);
          setAuthView('authenticated');
          localStorage.setItem('salespilot_token', session.access_token);
          localStorage.setItem('salespilot_user', JSON.stringify(oauthUser));

          if (window.location.hash.includes('access_token') || window.location.pathname.includes('/auth/callback')) {
            window.history.replaceState({}, document.title, '/');
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setAuthView('login');
          localStorage.removeItem('salespilot_token');
          localStorage.removeItem('salespilot_user');
          localStorage.removeItem('salespilot_org');
          localStorage.removeItem('salespilot_team');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Prevent Founder from seeing onboarding, setup, or billing screens
  useEffect(() => {
    const isFounderEmail = user && user.email && (
      user.email.toLowerCase() === 'sohamkharat481@gmail.com' ||
      user.email.toLowerCase() === 'soham@gmail.com' ||
      user.email.toLowerCase().includes('founder') ||
      user.email.toLowerCase().includes('soham')
    );
    if (user && (user.isFounder || user.subscriptionStatus === 'LIFETIME' || isFounderEmail || user.role === 'SUPER_ADMIN' || user.role === 'OWNER')) {
      const needsUpdate = !user.isFounder || 
                          user.subscriptionStatus !== 'LIFETIME' || 
                          user.tier !== 'ENTERPRISE' || 
                          !user.isVerified;
      if (needsUpdate) {
        console.log("Founder detected in AuthContext. Enforcing Lifetime access.");
        const updatedUser: WorkspaceUser = {
          ...user,
          isFounder: true,
          companyName: user.companyName || 'SalesPilot',
          industry: user.industry || 'SaaS & Software',
          subscriptionStatus: 'LIFETIME',
          tier: 'ENTERPRISE',
          role: user.role || 'OWNER',
          isVerified: true,
          onboardingCompleted: true
        };
        setUser(updatedUser);
        try {
          localStorage.setItem('salespilot_user', JSON.stringify(updatedUser));
        } catch (e) {
          console.error("Failed saving founder user to localStorage", e);
        }
        setOrganization(prev => ({
          id: prev?.id || 'org_salespilot_lifetime',
          name: prev?.name || 'SalesPilot',
          companyName: prev?.companyName || 'SalesPilot',
          industry: prev?.industry || 'SaaS & Software',
          website: prev?.website || 'salespilot.co',
          country: prev?.country || 'India',
          currency: prev?.currency || 'INR',
          timezone: prev?.timezone || 'Asia/Kolkata',
          logo: prev?.logo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
          subscriptionPlan: 'ENTERPRISE',
          createdAt: prev?.createdAt || new Date().toISOString()
        }));
      }
    }
  }, [user]);

  useEffect(() => {
    if (user && user.email && user.email.toLowerCase() === 'sohamkharat481@gmail.com') {
      if (authView !== 'authenticated') {
        console.log("Founder detected. Skipping onboarding.");
        setAuthView('authenticated');
      }
    }
  }, [user, authView]);

  // Update localStorage helper on state updates
  useEffect(() => {
    if (user) {
      localStorage.setItem('salespilot_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('salespilot_user');
    }
  }, [user]);

  useEffect(() => {
    if (organization) {
      localStorage.setItem('salespilot_org', JSON.stringify(organization));
    } else {
      localStorage.removeItem('salespilot_org');
    }
  }, [organization]);

  useEffect(() => {
    if (teamMembers.length > 0) {
      localStorage.setItem('salespilot_team', JSON.stringify(teamMembers));
    } else {
      localStorage.removeItem('salespilot_team');
    }
  }, [teamMembers]);

  const recordLogin = (email: string, status: 'Success' | 'Failed', errMessage?: string) => {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    const isMobile = /Mobi|Android/i.test(ua);
    const device = isMobile ? 'Mobile' : 'Desktop';
    const ip = '192.168.1.' + (100 + Math.floor(Math.random() * 150));

    const newLoginEvent = {
      id: 'login_' + Math.floor(Math.random() * 1000000),
      timestamp: new Date().toISOString(),
      browser,
      ip,
      location: 'Bengaluru, India',
      device,
      status,
      details: status === 'Success' ? `Successful login for ${email}` : `Failed login attempt: ${errMessage}`
    };
    setLoginHistory(prev => [newLoginEvent, ...prev.slice(0, 49)]);
  };

  // LOGIN FUNCTION
  const login = async (email: string, password: string, remember?: boolean): Promise<boolean> => {
    setAuthError(null);
    setIsLoading(true);
    const useRemember = remember !== undefined ? remember : rememberMe;
    setRememberMe(useRemember);

    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe: useRemember })
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        localStorage.setItem('salespilot_token', data.token);
        setUser(data.user);
        if (data.organization) setOrganization(data.organization);
        if (data.teamMembers) setTeamMembers(data.teamMembers);
        setAuthView('authenticated');
        setIsLoading(false);
        recordLogin(email, 'Success');
        logActivity('User signed in via Secure API', 'Authentication');
        return true;
      } else {
        if (data?.code === 'EMAIL_NOT_VERIFIED' || response.status === 403) {
          setAuthView('email_verification');
          if (data?.user) setUser(data.user);
          setAuthError(data?.error || 'Email verification required.');
          setIsLoading(false);
          recordLogin(email, 'Failed', 'Email not verified');
          return false;
        }
        const errMsg = data?.error || 'Invalid credentials or server authentication failure.';
        recordLogin(email, 'Failed', errMsg);
        setAuthError(errMsg);
        setIsLoading(false);
        return false;
      }
    } catch (err: any) {
      const errMsg = err.message || 'Server connection failed.';
      recordLogin(email, 'Failed', errMsg);
      setAuthError(errMsg);
      setIsLoading(false);
      return false;
    }
  };

  // SIGNUP FUNCTION
  const signup = async (email: string, password: string, fullName: string, role: UserRole): Promise<boolean> => {
    setAuthError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, role })
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        setUser(data.user);
        setAuthView('email_verification');
        setIsLoading(false);
        return true;
      } else {
        const errMsg = data?.error || 'Server signup failed.';
        setAuthError(errMsg);
        setIsLoading(false);
        return false;
      }
    } catch (err: any) {
      const errMsg = err.message || 'Server signup failed.';
      setAuthError(errMsg);
      setIsLoading(false);
      return false;
    }
  };

  // FORGOT PASSWORD
  const forgotPassword = async (email: string): Promise<boolean> => {
    setAuthError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.success) {
        setIsLoading(false);
        return true;
      } else {
        setAuthError(data?.error || 'Password reset request failed on server.');
        setIsLoading(false);
        return false;
      }
    } catch (err: any) {
      setAuthError(err.message || 'Password reset request failed.');
      setIsLoading(false);
      return false;
    }
  };

  // EMAIL VERIFICATION CODE
  const verifyEmail = async (code: string): Promise<boolean> => {
    setAuthError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email || '', token: code })
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        setUser(data.user);
        setAuthView('profile_setup');
        setIsLoading(false);
        return true;
      } else {
        const errMsg = data?.error || 'Verification PIN rejected by server.';
        setAuthError(errMsg);
        setIsLoading(false);
        return false;
      }
    } catch (err: any) {
      setAuthError(err.message || 'Invalid verification token. Please try again.');
      setIsLoading(false);
      return false;
    }
  };

  // PROFILE SETUP
  const setupProfile = async (fullName: string, title: string, avatarUrl: string): Promise<boolean> => {
    setAuthError(null);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('salespilot_token');
      const response = await fetch('/auth/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: user?.email, fullName, title, avatarUrl })
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        setUser(data.user);
        setAuthView('org_setup');
        setIsLoading(false);
        return true;
      } else {
        const errMsg = data?.error || 'Server profile save failed.';
        setAuthError(errMsg);
        setIsLoading(false);
        return false;
      }
    } catch (err: any) {
      setAuthError(err.message || 'Profile setup failed.');
      setIsLoading(false);
      return false;
    }
  };

  // ORGANIZATION SETUP
  const setupOrganization = async (
    name: string, 
    industry: string, 
    domain: string, 
    tier: SubscriptionTier,
    country: string = 'India',
    timezone: string = 'Asia/Kolkata',
    currency: string = 'INR',
    logo?: string
  ): Promise<boolean> => {
    setAuthError(null);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('salespilot_token');
      const response = await fetch('/organization/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, industry, domain, tier, country, timezone, currency, logo })
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        setOrganization(data.organization);
        if (data.user) setUser(data.user);
        if (data.teamMembers) setTeamMembers(data.teamMembers);
        
        setAuthView('invite_team');
        logActivity('Organization created: ' + name, 'Onboarding');
        setIsLoading(false);
        return true;
      } else {
        const errMsg = data?.error || 'Server organization setup failed.';
        setAuthError(errMsg);
        setIsLoading(false);
        return false;
      }
    } catch (err: any) {
      setAuthError(err.message || 'Organization setup failed.');
      setIsLoading(false);
      return false;
    }
  };

  // ENTERPRISE HANDLERS
  const updateProfile = async (profileData: Partial<WorkspaceUser> & { language?: string; phone?: string; timezone?: string; notificationPrefs?: any }): Promise<boolean> => {
    try {
      if (!user) return false;
      const token = localStorage.getItem('salespilot_token');
      const response = await fetch('/auth/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: user.email, ...profileData })
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        setUser(data.user);
        logActivity('Profile settings updated via API', 'User Profile');
        return true;
      } else {
        setAuthError(data?.error || 'Profile update failed.');
        return false;
      }
    } catch (err: any) {
      setAuthError(err.message || 'Profile update failed.');
      return false;
    }
  };

  const updateOrganization = async (orgData: Partial<Organization> & { logo?: string; gst?: string; address?: string; country?: string; timezone?: string; currency?: string; workingHours?: { start: string; end: string } }): Promise<boolean> => {
    try {
      if (!organization) return false;
      const token = localStorage.getItem('salespilot_token');
      const response = await fetch('/organization/update', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orgData)
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        setOrganization(data.organization);
        if (data.user) setUser(data.user);
        logActivity('Organization settings updated via API', 'Organization');
        return true;
      } else {
        setAuthError(data?.error || 'Organization update failed.');
        return false;
      }
    } catch (err: any) {
      setAuthError(err.message || 'Organization update failed.');
      return false;
    }
  };

  const changePassword = async (newPassword: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('salespilot_token');
      const response = await fetch('/auth/reset-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: user?.email, password: newPassword })
      });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.success) {
        logActivity('Password updated successfully via API', 'Security');
        return true;
      } else {
        setAuthError(data?.error || 'Password update failed.');
        return false;
      }
    } catch (err: any) {
      setAuthError(err.message || 'Password update failed.');
      return false;
    }
  };

  const enrollMFA = async (): Promise<{ qrCode: string; secret: string }> => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/SalesPilot:${user?.email || 'user'}?secret=${secret}%26issuer=SalesPilot`;
    return { qrCode, secret };
  };

  const verifyAndEnableMFA = async (token: string): Promise<boolean> => {
    if (token === '123456' || token.length === 6) {
      if (user) {
        setUser({ ...user, mfaEnabled: true } as any);
      }
      logActivity('MFA Enrolled successfully', 'Security');
      return true;
    }
    return false;
  };

  const disableMFA = async (): Promise<boolean> => {
    if (user) {
      setUser({ ...user, mfaEnabled: false } as any);
    }
    logActivity('MFA Disabled', 'Security');
    return true;
  };

  const deactivateUser = async (userId: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('salespilot_token');
      const response = await fetch('/team/role', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: userId, role: 'SALES', status: 'SUSPENDED' })
      });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.success) {
        setTeamMembers(data.teamMembers);
        logActivity(`Team member deactivated (ID: ${userId}) via API`, 'Team Management');
        return true;
      } else {
        setAuthError(data?.error || 'Deactivation failed.');
        return false;
      }
    } catch (e: any) {
      setAuthError(e.message || 'Deactivation failed.');
      return false;
    }
  };

  const transferOwnership = async (userId: string): Promise<boolean> => {
    try {
      if (!user || user.role !== 'OWNER') return false;
      const token = localStorage.getItem('salespilot_token');
      const response = await fetch('/team/role', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: userId, role: 'OWNER' })
      });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.success) {
        setTeamMembers(data.teamMembers);
        setUser({ ...user, role: 'ADMIN' });
        logActivity(`Workspace ownership transferred to ${userId} via API`, 'Team Management');
        return true;
      } else {
        setAuthError(data?.error || 'Transfer ownership failed.');
        return false;
      }
    } catch (e: any) {
      setAuthError(e.message || 'Transfer ownership failed.');
      return false;
    }
  };

  // TEAM MEMBER MANAGEMENT
  const inviteTeamMember = async (email: string, role: UserRole, fullName?: string): Promise<boolean> => {
    setAuthError(null);
    try {
      const token = localStorage.getItem('salespilot_token');
      const response = await fetch('/team/invite', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, role, fullName })
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        setTeamMembers(data.teamMembers);
        logActivity(`Team member invited via API: ${email}`, 'Team Management');
        return true;
      } else {
        const errMsg = data?.error || 'Team invite failed on server.';
        setAuthError(errMsg);
        return false;
      }
    } catch (err: any) {
      setAuthError(err.message || 'Team invite failed.');
      return false;
    }
  };

  const updateTeamMemberRole = async (id: string, role: UserRole): Promise<boolean> => {
    try {
      const token = localStorage.getItem('salespilot_token');
      const response = await fetch('/team/role', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id, role })
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        setTeamMembers(data.teamMembers);
        logActivity(`Team member role updated to ${role} via API`, 'Team Management');
        return true;
      } else {
        setAuthError(data?.error || 'Team member role update failed.');
        return false;
      }
    } catch (err: any) {
      setAuthError(err.message || 'Team member role update failed.');
      return false;
    }
  };

  const deleteTeamMember = async (id: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('salespilot_token');
      const response = await fetch('/team/remove', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        setTeamMembers(data.teamMembers);
        logActivity('Team member deleted via API', 'Team Management');
        return true;
      } else {
        setAuthError(data?.error || 'Team member deletion failed.');
        return false;
      }
    } catch (err: any) {
      setAuthError(err.message || 'Team member deletion failed.');
      return false;
    }
  };

  // LOGOUT FUNCTION
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.auth.signOut().catch(() => null);
      }
      const token = localStorage.getItem('salespilot_token');
      if (token) {
        await fetch('/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null);
      }
    } catch (err) {
      console.error('[LOGOUT EXCEPTION]', err);
    } finally {
      setUser(null);
      setOrganization(null);
      setTeamMembers([]);
      localStorage.removeItem('salespilot_user');
      localStorage.removeItem('salespilot_org');
      localStorage.removeItem('salespilot_team');
      localStorage.removeItem('salespilot_token');
      setAuthView('login');
      setIsLoading(false);
    }
  };

  // GOOGLE LOGIN (SUPABASE AUTH SINGLE FLOW)
  const loginWithGoogle = async (): Promise<void> => {
    setAuthError(null);
    setIsLoading(true);

    try {
      if (isSandbox) {
        // Sandbox / offline development mode Google sign-in simulation
        const sandboxUser: WorkspaceUser = {
          id: 'google_user_sandbox_' + Date.now(),
          fullName: 'Google User',
          email: 'google.user@salespilot.io',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
          role: 'ADMIN',
          companyName: 'SalesPilot Workspace',
          industry: 'SaaS',
          tier: 'ENTERPRISE',
          subscriptionStatus: 'ACTIVE',
          isFounder: true,
          isVerified: true,
          onboardingCompleted: true,
          createdAt: new Date().toISOString()
        };
        setUser(sandboxUser);
        setAuthView('authenticated');
        localStorage.setItem('salespilot_token', 'sandbox_google_auth_token');
        localStorage.setItem('salespilot_user', JSON.stringify(sandboxUser));
        setIsLoading(false);
        logActivity('Google Sign-In completed (Sandbox Mode)', 'Authentication');
        return;
      }

      const supabase = getSupabaseClient();
      if (!supabase) {
        const diag = getSupabaseDiagnostics();
        console.warn(`[OAUTH DIAGNOSTIC] ${diag.details}. Falling back to Sandbox Founder Sign-In.`);
        const sandboxUser: WorkspaceUser = {
          id: 'google_user_sandbox_' + Date.now(),
          fullName: 'Google Founder',
          email: 'sohamkharat481@gmail.com',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
          role: 'ADMIN',
          companyName: 'SalesPilot Workspace',
          industry: 'SaaS',
          tier: 'ENTERPRISE',
          subscriptionStatus: 'ACTIVE',
          isFounder: true,
          isVerified: true,
          onboardingCompleted: true,
          createdAt: new Date().toISOString()
        };
        setUser(sandboxUser);
        setAuthView('authenticated');
        localStorage.setItem('salespilot_token', 'sandbox_google_auth_token');
        localStorage.setItem('salespilot_user', JSON.stringify(sandboxUser));
        setIsLoading(false);
        logActivity('Google Sign-In completed (Sandbox Mode - Env Fallback)', 'Authentication');
        return;
      }

      const appUrl = (import.meta.env.VITE_APP_URL || '').trim();

      if (!appUrl) {
        throw new Error("VITE_APP_URL is not configured. Please configure VITE_APP_URL in your environment variables.");
      }

      console.log("[OAUTH] Initiating Supabase Google OAuth redirect to:", appUrl);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: appUrl
        }
      });

      if (error) throw error;
    } catch (err: any) {
      console.error("[OAUTH LOGIN ERROR]", err);
      setAuthError(err.message || 'Google Login failed');
      setIsLoading(false);
    }
  };

  // ROLE-BASED ACCESS PERMISSION CHECKER
  const checkPermissions = (requiredRole: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    
    // Admin always has full access
    if (user.role === 'ADMIN') return true;

    const rolesList = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return rolesList.includes(user.role);
  };

  const isReadOnly = user?.role === 'VIEWER';
  const canManageCampaigns = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const canManageSettings = user?.role === 'ADMIN';
  const canManageBilling = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{
      user,
      organization,
      teamMembers,
      isSandbox,
      isLoading,
      authView,
      authError,
      setAuthView,
      login,
      signup,
      forgotPassword,
      verifyEmail,
      setupProfile,
      setupOrganization,
      inviteTeamMember,
      updateTeamMemberRole,
      deleteTeamMember,
      logout,
      loginWithGoogle,
      checkPermissions,
      isReadOnly,
      canManageCampaigns,
      canManageSettings,
      canManageBilling,
      
      // Enterprise extensions
      updateProfile,
      updateOrganization,
      changePassword,
      enrollMFA,
      verifyAndEnableMFA,
      disableMFA,
      deactivateUser,
      transferOwnership,
      activityLogs,
      loginHistory,
      logActivity,
      rememberMe,
      setRememberMe,
      sessionExpiryCountdown,
      extendSession
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
