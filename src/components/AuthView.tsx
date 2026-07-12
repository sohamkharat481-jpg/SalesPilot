import React, { useState } from 'react';
import { useAuth } from '../authentication/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, Lock, User, Briefcase, Building, Globe, ChevronRight, 
  Sparkles, Check, AlertCircle, Loader2, ArrowLeft, Plus, Trash2, Shield, Info
} from 'lucide-react';
import { UserRole, SubscriptionTier } from '../types';

export function AuthView() {
  const {
    authView,
    setAuthView,
    authError,
    isLoading,
    isSandbox,
    login,
    signup,
    forgotPassword,
    verifyEmail,
    setupProfile,
    setupOrganization,
    inviteTeamMember,
    teamMembers,
    deleteTeamMember,
    loginWithGoogle,
    user,
    changePassword
  } = useAuth();

  // Local state managers
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('ADMIN');
  const [resetSent, setResetSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [title, setTitle] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80');

  // Password reset specific
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMeLocal, setRememberMeLocal] = useState(true);

  // Org local state with extended enterprise properties
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('Marketing Agency');
  const [domain, setDomain] = useState('');
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('GROWTH');
  const [country, setCountry] = useState('India');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [currency, setCurrency] = useState('INR');
  const [logo, setLogo] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=60');

  // Team Invite local state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('SALES');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    await login(email, password, rememberMeLocal);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) return;
    await signup(email, password, fullName, role);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const ok = await forgotPassword(email);
    if (ok) {
      setResetSent(true);
      // Automatically prompt to simulation password reset screen
      setTimeout(() => {
        setAuthView('reset_password');
      }, 1500);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode) return;
    await verifyEmail(verificationCode);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await setupProfile(fullName || user?.fullName || '', title, avatarUrl);
  };

  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName) return;
    await setupOrganization(companyName, industry, domain, selectedTier, country, timezone, currency, logo);
  };

  const handleAddInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    const ok = await inviteTeamMember(inviteEmail, inviteRole);
    if (ok) {
      setInviteEmail('');
    }
  };

  const handleFinishOnboarding = () => {
    window.location.reload(); // refresh to load application dashboard
  };

  const avatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80'
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans text-slate-100">
      
      {/* Decorative background visual flair */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Connection Indicator Mode Header */}
      <div className="absolute top-6 left-6 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono">
        <span className={`w-1.5 h-1.5 rounded-full ${isSandbox ? 'bg-blue-500' : 'bg-emerald-500'}`} />
        <span className="text-slate-400">
          {isSandbox ? 'Local Sandbox Session' : 'Live Supabase Instance Connected'}
        </span>
      </div>

      <div className="w-full max-w-md z-10">
        
        {/* Main Branding Logo block */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] mb-3">
            SP
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">SalesPilot</h2>
          <p className="text-xs text-slate-500 font-mono mt-1">Autonomous B2B Outreach Platform</p>
        </div>

        {/* Global Error Alert Banner */}
        {authError && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-950/40 border border-red-500/30 rounded-lg flex items-start gap-2.5 text-xs text-red-200"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{authError}</span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* LOGIN VIEW */}
          {authView === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-8 rounded-2xl shadow-xl w-full"
            >
              <h3 className="text-lg font-bold text-white mb-2">Welcome Back</h3>
              <p className="text-xs text-slate-400 mb-6">Enter your credentials to manage your sales automation dashboard.</p>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.in"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg pl-10 pr-4 py-3 text-sm outline-none transition-all text-white placeholder:text-slate-700 min-h-[44px]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">Password</label>
                    <button 
                      type="button"
                      onClick={() => { setAuthView('forgot_password'); setResetSent(false); }}
                      className="text-[10px] font-mono text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg pl-10 pr-4 py-3 text-sm outline-none transition-all text-white placeholder:text-slate-700 min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMeLocal}
                    onChange={(e) => setRememberMeLocal(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-slate-950 border-slate-800 rounded focus:ring-blue-500 focus:ring-offset-slate-900 focus:ring-2 cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2 text-xs text-slate-400 select-none cursor-pointer">
                    Remember me on this machine
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-medium text-xs uppercase tracking-wider py-3.5 rounded-lg transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)] flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>Sign In <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-[10px] font-mono uppercase">
                  <span className="bg-slate-900 px-3 text-slate-500">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={loginWithGoogle}
                className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium py-3 rounded-lg flex items-center justify-center gap-2.5 transition-colors min-h-[44px] cursor-pointer"
              >
                {/* Visual SVG Google Icon */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.44 7.56l3.85 2.99C6.23 7.37 8.89 5.04 12 5.04z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2.01 3.7-4.97 3.7-8.62z" />
                  <path fill="#FBBC05" d="M5.29 14.81c-.24-.72-.38-1.49-.38-2.31s.14-1.59.38-2.31l-3.85-2.99C.51 8.94 0 10.42 0 12s.51 3.06 1.44 4.8l3.85-2.99z" />
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.73-2.89c-1.1.74-2.51 1.18-4.23 1.18-3.11 0-5.77-2.33-6.71-5.51l-3.85 2.99C3.37 20.33 7.35 23 12 23z" />
                </svg>
                Google Credentials
              </button>

              <div className="text-center mt-6 text-xs text-slate-500">
                Don't have an account?{' '}
                <button 
                  onClick={() => setAuthView('signup')}
                  className="text-blue-400 font-semibold hover:underline"
                >
                  Create one now
                </button>
              </div>
            </motion.div>
          )}

          {/* SIGNUP VIEW */}
          {authView === 'signup' && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-8 rounded-2xl shadow-xl w-full"
            >
              <h3 className="text-lg font-bold text-white mb-1">Create Your Account</h3>
              <p className="text-xs text-slate-400 mb-5">Launch your autonomous high-converting lead campaigns.</p>

              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Soham Kharat"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg pl-10 pr-4 py-3 text-sm outline-none transition-all text-white placeholder:text-slate-700 min-h-[44px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Work Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.in"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg pl-10 pr-4 py-3 text-sm outline-none transition-all text-white placeholder:text-slate-700 min-h-[44px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Create Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg pl-10 pr-4 py-3 text-sm outline-none transition-all text-white placeholder:text-slate-700 min-h-[44px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Your Workspace Role</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {[
                      { key: 'ADMIN', title: 'Admin', desc: 'Full control' },
                      { key: 'MANAGER', title: 'Manager', desc: 'Campaign creator' },
                      { key: 'SALES', title: 'Sales', desc: 'Lead updater' },
                      { key: 'VIEWER', title: 'Viewer', desc: 'Read-only' }
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.key}
                        onClick={() => setRole(item.key as UserRole)}
                        className={`p-2 rounded-lg border text-left transition-all ${
                          role === item.key 
                            ? 'bg-blue-600/10 border-blue-500 text-white' 
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold flex items-center gap-1">
                          <Shield className={`w-3.5 h-3.5 ${role === item.key ? 'text-blue-400' : 'text-slate-500'}`} />
                          {item.title}
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-medium text-xs uppercase tracking-wider py-3.5 rounded-lg transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)] flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>Create Account <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>

              <div className="text-center mt-6 text-xs text-slate-500">
                Already have an account?{' '}
                <button 
                  onClick={() => setAuthView('login')}
                  className="text-blue-400 font-semibold hover:underline"
                >
                  Sign in instead
                </button>
              </div>
            </motion.div>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {authView === 'forgot_password' && (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-8 rounded-2xl shadow-xl w-full"
            >
              <button 
                onClick={() => setAuthView('login')}
                className="text-slate-500 hover:text-slate-300 text-xs flex items-center gap-1.5 mb-5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </button>

              <h3 className="text-lg font-bold text-white mb-2">Reset Your Password</h3>
              <p className="text-xs text-slate-400 mb-6">Enter your registered email address and we will forward reset directions.</p>

              {resetSent ? (
                <div className="p-4 bg-blue-950/40 border border-blue-500/30 rounded-lg text-xs text-blue-200 text-center">
                  <Check className="w-8 h-8 text-blue-400 mx-auto mb-2.5" />
                  <p className="font-bold mb-1">Check your inbox</p>
                  <p className="text-slate-400">Password reset link has been dispatched to <span className="font-mono text-white">{email}</span></p>
                </div>
              ) : (
                <form onSubmit={handleResetSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Registered Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.in"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg pl-10 pr-4 py-3 text-sm outline-none transition-all text-white placeholder:text-slate-700 min-h-[44px]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-medium text-xs uppercase tracking-wider py-3.5 rounded-lg transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
                  </button>
                </form>
              )}
            </motion.div>
          )}

          {/* RESET PASSWORD VIEW */}
          {authView === 'reset_password' && (
            <motion.div
              key="reset_password"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-8 rounded-2xl shadow-xl w-full"
            >
              <h3 className="text-lg font-bold text-white mb-2">Create New Password</h3>
              <p className="text-xs text-slate-400 mb-6">Specify a strong secure password for your workspace account.</p>

              <form onSubmit={async (e) => {
                e.preventDefault();
                if (newPassword !== confirmPassword) {
                  alert('Passwords do not match.');
                  return;
                }
                const ok = await changePassword(newPassword);
                if (ok) {
                  alert('Password successfully updated! Redirecting to Login.');
                  setAuthView('login');
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="password" 
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg pl-10 pr-4 py-3 text-sm outline-none transition-all text-white placeholder:text-slate-700 min-h-[44px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="password" 
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg pl-10 pr-4 py-3 text-sm outline-none transition-all text-white placeholder:text-slate-700 min-h-[44px]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-medium text-xs uppercase tracking-wider py-3.5 rounded-lg transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                </button>
              </form>
            </motion.div>
          )}

          {/* EMAIL VERIFICATION VIEW */}
          {authView === 'email_verification' && (
            <motion.div
              key="verify"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-8 rounded-2xl shadow-xl w-full"
            >
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" /> Check Your Email
              </h3>
              <p className="text-xs text-slate-400 mb-5">
                We've sent a 6-digit confirmation PIN to <span className="text-white font-mono">{email || user?.email}</span>.
              </p>

              {/* Informational Hint about sandbox */}
              {isSandbox && (
                <div className="mb-4 p-3 bg-blue-950/20 border border-blue-500/20 rounded-lg flex items-start gap-2.5 text-[11px] text-blue-300">
                  <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    Sandbox bypass: Enter any 6-digit code (e.g. <span className="font-mono text-white">123456</span>) to proceed.
                  </span>
                </div>
              )}

              <form onSubmit={handleVerifySubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 text-center">Verification PIN</label>
                  <input 
                    type="text" 
                    required
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="123456"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg py-3 text-center tracking-[0.5em] text-lg font-bold outline-none transition-all text-white placeholder:text-slate-800 min-h-[48px]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-medium text-xs uppercase tracking-wider py-3.5 rounded-lg transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Activation'}
                </button>
              </form>

              <div className="text-center mt-6 text-xs text-slate-500">
                Didn't receive it?{' '}
                <button 
                  onClick={() => alert('Code resent successfully (simulated)')}
                  className="text-blue-400 font-semibold hover:underline"
                >
                  Resend PIN
                </button>
              </div>
            </motion.div>
          )}

          {/* PROFILE SETUP */}
          {authView === 'profile_setup' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-8 rounded-2xl shadow-xl w-full"
            >
              <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-bold">Onboarding: Step 1 of 3</span>
              <h3 className="text-lg font-bold text-white mb-2 mt-1">Profile Configuration</h3>
              <p className="text-xs text-slate-400 mb-6">Complete your profile to personalize campaign sequences and signature tags.</p>

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      required
                      value={fullName || user?.fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Soham Kharat"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg pl-10 pr-4 py-3 text-sm outline-none transition-all text-white placeholder:text-slate-700 min-h-[44px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Job Title</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Managing Director / Founder"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg pl-10 pr-4 py-3 text-sm outline-none transition-all text-white placeholder:text-slate-700 min-h-[44px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">Select Avatar</label>
                  <div className="flex gap-4">
                    {avatars.map((url, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => setAvatarUrl(url)}
                        className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                          avatarUrl === url ? 'border-blue-500 scale-105 shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={url} alt="Avatar option" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-medium text-xs uppercase tracking-wider py-3.5 rounded-lg transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
                >
                  Save and Continue <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}

          {/* ORGANIZATION SETUP */}
          {authView === 'org_setup' && (
            <motion.div
              key="org"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-8 rounded-2xl shadow-xl w-full"
            >
              <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-bold">Onboarding: Step 2 of 3</span>
              <h3 className="text-lg font-bold text-white mb-2 mt-1">Configure Organization</h3>
              <p className="text-xs text-slate-400 mb-6">Create your company team hub to manage contacts, analytics, and billing.</p>

              <form onSubmit={handleOrgSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Company Name</label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Horizon Media"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg pl-10 pr-4 py-3 text-sm outline-none transition-all text-white placeholder:text-slate-700 min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Website Domain</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input 
                        type="text" 
                        required
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        placeholder="horizonmedia.in"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg pl-8 pr-3 py-2 text-xs outline-none transition-all text-white placeholder:text-slate-700 min-h-[40px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Industry Segment</label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs outline-none transition-all text-white min-h-[40px]"
                    >
                      <option value="Marketing Agency">Marketing Agency</option>
                      <option value="SaaS Company">SaaS Company</option>
                      <option value="IT Company">IT Solutions</option>
                      <option value="Web Agency">Web Dev Agency</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Recruitment">Recruitment Firm</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Country</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-2 py-2 text-xs outline-none text-white min-h-[40px]"
                    >
                      <option value="India">India</option>
                      <option value="United States">USA</option>
                      <option value="United Kingdom">UK</option>
                      <option value="Singapore">Singapore</option>
                      <option value="UAE">UAE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Timezone</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-2 py-2 text-xs outline-none text-white min-h-[40px]"
                    >
                      <option value="Asia/Kolkata">IST (+5:30)</option>
                      <option value="America/New_York">EST (-5:00)</option>
                      <option value="Europe/London">GMT (+0:00)</option>
                      <option value="Asia/Singapore">SGT (+8:00)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-2 py-2 text-xs outline-none text-white min-h-[40px]"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="SGD">SGD (S$)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Select Subscription Tier (INR Pricing)</label>
                  <div className="grid grid-cols-4 gap-1.5 mt-1">
                    {[
                      { tier: 'STARTER', price: '₹3,499', desc: 'Starter' },
                      { tier: 'GROWTH', price: '₹7,999', desc: 'Growth' },
                      { tier: 'BUSINESS', price: '₹14,999', desc: 'Business' },
                      { tier: 'ENTERPRISE', price: 'Custom', desc: 'Custom' }
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.tier}
                        onClick={() => setSelectedTier(item.tier as SubscriptionTier)}
                        className={`p-1.5 rounded-lg border text-center transition-all ${
                          selectedTier === item.tier 
                            ? 'bg-blue-600/15 border-blue-500 text-white' 
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-[8px] font-bold tracking-tight">{item.desc}</div>
                        <div className="text-[10px] font-bold text-blue-400 font-mono mt-0.5">{item.price}</div>
                        <div className="text-[7px] text-slate-500 font-mono mt-0.5">/ mo</div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-medium text-xs uppercase tracking-wider py-3.5 rounded-lg transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer mt-2"
                >
                  Create Organization <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}

          {/* TEAM INVITATIONS */}
          {authView === 'invite_team' && (
            <motion.div
              key="invites"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-8 rounded-2xl shadow-xl w-full"
            >
              <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-bold">Onboarding: Step 3 of 3</span>
              <h3 className="text-lg font-bold text-white mb-2 mt-1">Invite Team Members</h3>
              <p className="text-xs text-slate-400 mb-5">Delegate access permissions across role classifications.</p>

              {/* Form to add email & role */}
              <form onSubmit={handleAddInvite} className="flex gap-2 mb-6">
                <div className="flex-1">
                  <input 
                    type="email" 
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@company.in"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2.5 text-xs outline-none text-white placeholder:text-slate-700 min-h-[40px]"
                  />
                </div>
                <div className="w-24">
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as UserRole)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-2 py-2.5 text-xs outline-none text-white min-h-[40px]"
                  >
                    <option value="MANAGER">Manager</option>
                    <option value="SALES">Sales</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white p-2 rounded-lg transition-colors flex items-center justify-center min-w-[40px] cursor-pointer"
                  title="Add teammate"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              {/* List of currently invited members */}
              {teamMembers.length > 0 ? (
                <div className="mb-6 space-y-2 max-h-36 overflow-y-auto pr-1">
                  <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest">Invited Team ({teamMembers.length})</span>
                  {teamMembers.map((member) => (
                    <div 
                      key={member.id} 
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-200">{member.fullName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{member.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono font-bold bg-blue-600/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded uppercase">
                          {member.role}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteTeamMember(member.id)}
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mb-6 text-center py-4 bg-slate-950/40 border border-dashed border-slate-800 rounded-lg text-slate-600 text-xs font-mono">
                  No teammates added yet.
                </div>
              )}

              <button
                type="button"
                onClick={handleFinishOnboarding}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs uppercase tracking-wider py-3.5 rounded-lg transition-all shadow-[0_0_15px_rgba(37,99,235,0.25)] flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
              >
                Launch Pipeline Workspace <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
