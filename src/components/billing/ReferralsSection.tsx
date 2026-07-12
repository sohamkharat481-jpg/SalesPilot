import React, { useState } from 'react';
import { Gift, Share2, Copy, Send, Users, Award, CheckCircle2, Trophy, ArrowUpRight } from 'lucide-react';

interface ReferralsSectionProps {
  userEmail: string | undefined;
  onLogMessage: (text: string, type: 'info' | 'success' | 'warn') => void;
}

interface Invitee {
  id: string;
  email: string;
  joinedDate: string;
  status: 'PENDING' | 'REGISTERED' | 'SUBSCRIBED';
  reward: string;
}

export function ReferralsSection({ userEmail, onLogMessage }: ReferralsSectionProps) {
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [referralCode, setReferralCode] = useState(() => {
    const prefix = userEmail ? userEmail.split('@')[0].toUpperCase().substring(0, 6) : 'PILOT';
    return `SP-${prefix}-${Math.floor(100 + Math.random() * 900)}`;
  });

  const [invitees, setInvitees] = useState<Invitee[]>([
    { id: '1', email: 'harish.m@vector-consulting.com', joinedDate: 'Jul 02, 2026', status: 'SUBSCRIBED', reward: '₹500 Credits + 1 Free Month' },
    { id: '2', email: 'priya.sharma@growthlabs.in', joinedDate: 'Jul 08, 2026', status: 'REGISTERED', reward: 'Pending Subscription' },
    { id: '3', email: 'amit.patel@martech-solutions.co', joinedDate: 'Jul 10, 2026', status: 'PENDING', reward: '—' },
  ]);

  const [leaderboard, setLeaderboard] = useState([
    { rank: 1, name: 'Vikram Malhotra', referrals: 18, credits: '₹9,000' },
    { rank: 2, name: 'Ananya Sen', referrals: 12, credits: '₹6,000' },
    { rank: 3, name: 'Rohan Deshmukh', referrals: 9, credits: '₹4,500' },
  ]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(`https://salespilot.ai/register?ref=${referralCode}`);
    setCopied(true);
    onLogMessage(`Referral link copied to clipboard: https://salespilot.ai/register?ref=${referralCode}`, 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim();
    if (!email) return;

    // Check if email already invited
    if (invitees.some(inv => inv.email.toLowerCase() === email.toLowerCase())) {
      onLogMessage(`Email "${email}" has already been invited!`, 'warn');
      return;
    }

    const newInvitee: Invitee = {
      id: Math.random().toString(),
      email,
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      status: 'PENDING',
      reward: '—'
    };

    setInvitees(prev => [newInvitee, ...prev]);
    setInviteEmail('');
    onLogMessage(`Invitation email sent successfully to "${email}"!`, 'success');
  };

  const getStatusBadge = (status: 'PENDING' | 'REGISTERED' | 'SUBSCRIBED') => {
    switch (status) {
      case 'PENDING': return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
      case 'REGISTERED': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400';
      case 'SUBSCRIBED': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400';
    }
  };

  return (
    <div id="referrals_hub_section" className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* Referral Code and Invites */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
        <div>
          <h3 className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Gift className="w-4 h-4 text-indigo-600" /> REFERRAL PROGRAM & CREDITS
          </h3>
          <p className="text-xs text-slate-500 mt-1">Invite friends to SalesPilot and earn ₹500 credits + 1 Free Month of Growth Professional upon upgrade.</p>
        </div>

        {/* Copy Referral Code Card */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-lg space-y-2">
          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block">Your Invitation link</span>
          <div className="flex gap-2">
            <div className="flex-grow bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono px-3 py-2 rounded-lg text-slate-700 dark:text-slate-350 truncate">
              salespilot.ai/register?ref={referralCode}
            </div>
            <button
              onClick={handleCopyCode}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition shrink-0"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Send Direct Email Invitation */}
        <form onSubmit={handleSendInvite} className="space-y-2">
          <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase">Invite Friend via Email</label>
          <div className="flex gap-2">
            <input 
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="friend@company.com"
              required
              className="flex-grow bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs px-3 py-2.5 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:bg-white"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-950 dark:bg-slate-800 hover:bg-slate-900 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
            >
              Send <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Reward milestones tracker */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-850">
          <div className="p-2.5 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-center">
            <span className="text-[9px] font-mono text-indigo-500 block">REVENUE CREDITS</span>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 font-mono">₹1,500</span>
          </div>
          <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-center">
            <span className="text-[9px] font-mono text-emerald-500 block">FREE MONTHS EARNED</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">1 Month</span>
          </div>
        </div>
      </div>

      {/* Referral Status Pipeline & Leaderboard */}
      <div className="space-y-6">
        
        {/* Referral Status Pipeline */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
          <h4 className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-600" /> INVITE TRACKING STATUS
          </h4>
          
          <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
            {invitees.map((inv) => (
              <div key={inv.id} className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-lg text-[11px]">
                <div className="space-y-0.5">
                  <span className="font-medium text-slate-800 dark:text-slate-350 block truncate max-w-[170px]">{inv.email}</span>
                  <span className="text-[9px] text-slate-400 font-mono">Invited {inv.joinedDate}</span>
                </div>
                <div className="text-right space-y-1">
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono ${getStatusBadge(inv.status)}`}>
                    {inv.status}
                  </span>
                  <span className="block text-[8px] text-slate-450 font-mono">{inv.reward}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
          <h4 className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-500" /> GLOBAL REFERRAL LEADERBOARD
          </h4>
          
          <div className="space-y-2">
            {leaderboard.map((lead) => (
              <div key={lead.rank} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                    lead.rank === 1 ? 'bg-amber-100 text-amber-700' : lead.rank === 2 ? 'bg-slate-100 text-slate-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {lead.rank}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{lead.name}</span>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
                  <span>{lead.referrals} joins</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{lead.credits} earned</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
