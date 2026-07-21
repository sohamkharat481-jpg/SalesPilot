import React, { useState } from 'react';
import { 
  Smartphone, Download, Code, BookOpen, Cpu, Play, CheckCircle, 
  Lock, Wifi, Battery, Terminal, ArrowRight, Activity, FileText, 
  Check, Copy, RotateCcw, ShieldCheck, Mail, Calendar, Phone, 
  Settings, User, Eye, QrCode, Sparkles
} from 'lucide-react';

interface MobileHubViewProps {
  leads: any[];
  setLeads: React.Dispatch<React.SetStateAction<any[]>>;
  appointments: any[];
  setAppointments: React.Dispatch<React.SetStateAction<any[]>>;
  deals: any[];
  setDeals: React.Dispatch<React.SetStateAction<any[]>>;
}

export function MobileHubView({
  leads,
  setLeads,
  appointments,
  setAppointments,
  deals,
  setDeals
}: MobileHubViewProps) {
  // Navigation tabs of the Web Hub
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'simulator' | 'code' | 'docs'>('simulator');
  const [activeDocSection, setActiveDocSection] = useState<'architecture' | 'api' | 'build' | 'stores'>('architecture');
  
  // Interactive Simulator States
  const [isLogged, setIsLogged] = useState(false);
  const [simTab, setSimTab] = useState<'dashboard' | 'crm' | 'ai' | 'calendar' | 'gmail' | 'voice' | 'scanner' | 'settings'>('dashboard');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  // Simulator Lead form state
  const [simLeads, setSimLeads] = useState([
    { id: '1', name: 'Vijay Shekhar', company: 'Paytm', email: 'vijay@paytm.com', phone: '+91 98765 43210', status: 'QUALIFIED' },
    { id: '2', name: 'Kunal Shah', company: 'Cred', email: 'kunal@cred.club', phone: '+91 99999 88888', status: 'MEETING_BOOKED' },
    { id: '3', name: 'Nithin Kamath', company: 'Zerodha', email: 'nithin@zerodha.tech', phone: '+91 95555 44444', status: 'NEW' }
  ]);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadCompany, setNewLeadCompany] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');

  // Voice call simulator states
  const [simCallActive, setSimCallActive] = useState(false);
  const [simCallStatus, setSimCallStatus] = useState<'dialing' | 'connected' | 'ended'>('dialing');
  const [simCallName, setSimCallName] = useState('Priya Sharma (Razorpay)');
  const [simTranscripts, setSimTranscripts] = useState<string[]>([]);
  const [simDuration, setSimDuration] = useState(0);

  // Scanner Simulator States
  const [simCardScanActive, setSimCardScanActive] = useState(false);
  const [simQrScanActive, setSimQrScanActive] = useState(false);
  const [simScanResult, setSimScanResult] = useState<any | null>(null);

  // Settings Simulation toggles
  const [simBiometric, setSimBiometric] = useState(true);
  const [simNotifications, setSimNotifications] = useState(true);

  // Selected file in the code browser
  const [selectedFile, setSelectedFile] = useState<string>('App.tsx');

  const fileContents: Record<string, string> = {
    'App.tsx': `import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-navigation';
import { LoginScreen } from './src/screens/LoginScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';

export default function App() {
  const [user, setUser] = useState(null);
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {!user ? <LoginScreen onLogin={setUser} /> : <DashboardScreen user={user} />}
    </SafeAreaView>
  );
}`,
    'storage.ts': `import AsyncStorage from '@react-native-async-storage/async-storage';

export const OfflineStorage = {
  async getLeads() {
    const data = await AsyncStorage.getItem('@salespilot_leads');
    return data ? JSON.parse(data) : [];
  },
  async saveLeads(leads) {
    await AsyncStorage.setItem('@salespilot_leads', JSON.stringify(leads));
  },
  async addToSyncQueue(action, data) {
    const queue = JSON.parse(await AsyncStorage.getItem('@sync_queue') || '[]');
    queue.push({ id: Date.now().toString(), action, data });
    await AsyncStorage.setItem('@sync_queue', JSON.stringify(queue));
  }
};`,
    'api.ts': `const API_BASE = 'https://salespilot.co/api/v1';

export const MobileApi = {
  async getCRMLeads(token) {
    const response = await fetch(\`\${API_BASE}/leads\`, {
      headers: { 'Authorization': \`Bearer \${token}\` }
    });
    return response.json();
  },
  async triggerSync(token, queue) {
    return fetch(\`\${API_BASE}/sync\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
      body: JSON.stringify({ queue })
    });
  }
};`
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(label);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  // Trigger call simulation
  const startSimCall = (name: string) => {
    setSimCallName(name);
    setSimCallActive(true);
    setSimCallStatus('dialing');
    setSimDuration(0);
    setSimTranscripts(['[System] Initiating secure WebRTC voice channel...']);

    setTimeout(() => {
      setSimCallStatus('connected');
      setSimTranscripts(prev => [...prev, '[Voice AI] Hello! I am SalesPilot SDR calling on behalf of Soham.', '[Prospect] Yes, hello! I received your email, let\'s chat.']);
    }, 1500);
  };

  // Trigger Scanner Simulation
  const runSimCardScan = () => {
    setSimCardScanActive(true);
    setSimScanResult(null);
    setTimeout(() => {
      setSimCardScanActive(false);
      const parsed = {
        name: 'Ritesh Agarwal',
        company: 'Oyo Rooms',
        email: 'ritesh@oyo.in',
        phone: '+91 91111 22222',
        role: 'Founder & CEO'
      };
      setSimScanResult(parsed);
      setSimLeads(prev => [
        { id: Date.now().toString(), name: parsed.name, company: parsed.company, email: parsed.email, phone: parsed.phone, status: 'NEW' },
        ...prev
      ]);
    }, 2000);
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-emerald-600 uppercase bg-emerald-50 px-3 py-1 rounded-full">
            SalesPilot Mobile Workspace
          </span>
          <h1 className="text-3xl font-bold text-slate-900 mt-2 tracking-tight">Expo iOS & Android Client</h1>
          <p className="text-slate-500 text-sm mt-1">
            Access, view, download, and test the production-ready React Native (Expo) codebases.
          </p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => copyToClipboard('cd mobile && npm install && npx expo start', 'terminal')}
            className="flex items-center gap-2 bg-slate-900 text-white font-semibold px-4 py-2.5 rounded-xl text-xs hover:bg-slate-800 transition shadow-sm font-mono"
          >
            {copiedFile === 'terminal' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Terminal className="w-3.5 h-3.5" />}
            <span>npx expo start</span>
          </button>

          <button 
            onClick={() => AlertUser('Code package successfully cached locally in /mobile directory. Use settings menu to export zip directly.')}
            className="flex items-center gap-2 bg-emerald-600 text-white font-semibold px-4 py-2.5 rounded-xl text-xs hover:bg-emerald-700 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Expo Zip</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Navigation Tab Bar */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveWorkspaceTab('simulator')}
          className={`pb-3 font-semibold text-sm transition flex items-center gap-2 ${activeWorkspaceTab === 'simulator' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Interactive Mobile Simulator</span>
        </button>
        <button
          onClick={() => setActiveWorkspaceTab('code')}
          className={`pb-3 font-semibold text-sm transition flex items-center gap-2 ${activeWorkspaceTab === 'code' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <Code className="w-4 h-4" />
          <span>React Native Codebase</span>
        </button>
        <button
          onClick={() => setActiveWorkspaceTab('docs')}
          className={`pb-3 font-semibold text-sm transition flex items-center gap-2 ${activeWorkspaceTab === 'docs' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Production Build & Store Release Guides</span>
        </button>
      </div>

      {/* View Content Handler */}
      {activeWorkspaceTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Simulator Control Panel (Left column - 5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-500" />
                <span>Simulation Controller</span>
              </h2>
              <p className="text-slate-500 text-xs mt-1">
                Trigger real-time notifications, camera hardware captures, and background sync routines in the phone simulator.
              </p>

              <div className="mt-6 space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <TextLabel text="Mock Device Actions" />
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button 
                      onClick={() => {
                        setIsLogged(true);
                        setSimTab('dashboard');
                        AlertUser('Push Alert Dispatched: "New CRM Lead Kunal Shah from Cred signed up via campaign"');
                      }}
                      className="bg-white text-slate-800 border border-slate-200 text-xs font-semibold py-2 px-3 rounded-lg hover:bg-slate-50 transition"
                    >
                      🛎️ Push Alert: Lead
                    </button>
                    <button 
                      onClick={() => {
                        setIsLogged(true);
                        setSimTab('calendar');
                        AlertUser('Push Alert Dispatched: "Meeting Reminder: Demo Call with Paytm starts in 15 mins."');
                      }}
                      className="bg-white text-slate-800 border border-slate-200 text-xs font-semibold py-2 px-3 rounded-lg hover:bg-slate-50 transition"
                    >
                      ⏰ Push Alert: Meeting
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <TextLabel text="Local SQLite Cache Sync Diagnostics" />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-500 font-mono">Sync Pending Outbox Queue</span>
                    <span className="text-xs bg-amber-50 text-amber-700 font-bold border border-amber-200 px-2 py-0.5 rounded-full">
                      {simLeads.filter(l => l.status === 'NEW').length} items cached
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      setSimLeads(prev => prev.map(l => ({ ...l, status: 'QUALIFIED' })));
                      AlertUser('Auto Sync Completed! Outbox queue cleared and updated on SalesPilot primary server database.');
                    }}
                    className="w-full mt-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition border border-emerald-200 text-xs font-bold py-2 px-3 rounded-lg"
                  >
                    🔄 Run Sync Engine Daemon
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-slate-200 rounded-2xl p-6 border border-slate-800 font-mono text-xs space-y-3">
              <div className="flex justify-between items-center text-slate-400">
                <span>EAS CLI EXPO STREAM</span>
                <span className="text-emerald-400 font-bold animate-pulse">● COMPILING APP</span>
              </div>
              <div className="h-40 overflow-y-auto space-y-1 text-emerald-400">
                <p>&gt; expo install expo-local-authentication expo-camera expo-barcode-scanner</p>
                <p>&gt; tsc --noEmit</p>
                <p className="text-slate-300">&gt; Building local SQLite tables for client CRM caching...</p>
                <p className="text-slate-300">&gt; Generating secure AES-256 local keychain containers...</p>
                <p className="text-white font-bold">&gt; Metro Dev Server bound to port 19000 successfully.</p>
                <p className="text-slate-400">&gt; Biometric Lock module integrated with TouchID system.</p>
                <p className="text-emerald-500 font-bold">&gt; Ready for physical device preview. Scan Metro QR code.</p>
              </div>
            </div>
          </div>

          {/* Interactive CSS Phone Simulator (Right column - 7 cols) */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="relative w-[360px] h-[720px] bg-slate-950 rounded-[48px] border-[12px] border-slate-800 shadow-2xl overflow-hidden flex flex-col">
              
              {/* iPhone Notch */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-slate-800 rounded-b-2xl z-50 flex items-center justify-center">
                <div className="w-3 h-3 bg-slate-900 rounded-full" />
              </div>

              {/* Status Bar */}
              <div className="bg-slate-900 h-8 px-6 pt-2 flex justify-between items-center text-[10px] text-white font-mono z-40">
                <span>09:41 AM</span>
                <div className="flex items-center gap-1.5">
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  <Battery className="w-3 h-3" />
                </div>
              </div>

              {/* Interactive Phone Content Area */}
              <div className="flex-1 bg-slate-950 flex flex-col text-white">
                {!isLogged ? (
                  /* SIMULATOR LOGIN SCREEN */
                  <div className="flex-1 p-6 flex flex-col justify-center">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-black text-emerald-400 tracking-tight">SalesPilot</h3>
                      <p className="text-slate-400 text-xs mt-1">SDR AI Voice Mobile Console</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Email address</label>
                        <input 
                          type="text" 
                          placeholder="soham@salespilot.co" 
                          disabled 
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-slate-300"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Secure Password</label>
                        <input 
                          type="password" 
                          value="••••••••••••" 
                          disabled 
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-slate-300"
                        />
                      </div>

                      <button 
                        onClick={() => setIsLogged(true)}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-2.5 rounded-xl text-xs text-white transition mt-2 shadow-lg shadow-emerald-900/35"
                      >
                        Unlock Workspace
                      </button>

                      <div className="relative my-4 flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800" /></div>
                        <span className="relative bg-slate-950 px-2 text-[8px] text-slate-500 font-bold">OR SECURE UNLOCK</span>
                      </div>

                      <button 
                        onClick={() => {
                          setIsLogged(true);
                          AlertUser('Biometric Handshake successful! Welcome to SalesPilot.');
                        }}
                        className="w-full border border-emerald-600/55 hover:bg-emerald-950/20 text-emerald-400 font-bold py-2 rounded-xl text-xs transition"
                      >
                        👍 Touch ID / Face ID
                      </button>
                    </div>
                    <p className="text-[9px] text-slate-600 text-center mt-8">AES-256 Token Session Key Encryption</p>
                  </div>
                ) : (
                  /* SIMULATOR MAIN APP LOGGED IN CONTENT */
                  <div className="flex-1 flex flex-col bg-slate-950">
                    
                    {/* Phone App Header */}
                    <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-black tracking-tight text-emerald-400">SalesPilot Mobile</span>
                      </div>
                      <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-bold uppercase font-mono">
                        {simTab}
                      </span>
                    </div>

                    {/* Active Tab Screen Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      
                      {simTab === 'dashboard' && (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-[10px] text-slate-400">Hi, Soham Kharat</p>
                              <h4 className="text-sm font-bold">Outbound Daily Metrics</h4>
                            </div>
                            <span className="text-[9px] bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                              Soham Labs Team
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                              <p className="text-[9px] text-slate-500 font-bold uppercase">Meetings Today</p>
                              <p className="text-lg font-black text-white mt-1">3</p>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                              <p className="text-[9px] text-slate-500 font-bold uppercase">New Leads Cached</p>
                              <p className="text-lg font-black text-emerald-400 mt-1">+{simLeads.length}</p>
                            </div>
                          </div>

                          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
                            <p className="text-[9px] text-slate-400 font-bold uppercase">Outbound Revenue pipeline</p>
                            <h5 className="text-xl font-black">₹5,40,000</h5>
                            <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '65%' }} />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-[10px] text-slate-400 font-bold">System Sync Logs</p>
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2 text-[11px]">
                              <div className="flex justify-between">
                                <span className="font-bold text-white">Ashish (Paytm)</span>
                                <span className="text-slate-500">10m ago</span>
                              </div>
                              <p className="text-slate-400 text-[10px]">AI Call complete. Demo request recorded in database.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {simTab === 'crm' && (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="text-xs font-bold text-slate-400">CRM LOCAL LEAD PIPELINE</h4>
                            <span className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded font-bold">
                              {simLeads.length} Total
                            </span>
                          </div>

                          <div className="space-y-2.5">
                            {simLeads.map(l => (
                              <div key={l.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex justify-between items-center">
                                <div>
                                  <h5 className="text-xs font-bold text-white">{l.name}</h5>
                                  <p className="text-[10px] text-slate-400">{l.company} • {l.email}</p>
                                </div>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${l.status === 'NEW' ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'}`}>
                                  {l.status}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
                            <p className="text-[10px] text-slate-400 font-bold">FAST CRM LEAD ADD</p>
                            <input 
                              type="text" 
                              placeholder="Prospect Name" 
                              value={newLeadName}
                              onChange={(e) => setNewLeadName(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-600"
                            />
                            <input 
                              type="text" 
                              placeholder="Company" 
                              value={newLeadCompany}
                              onChange={(e) => setNewLeadCompany(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-600"
                            />
                            <button 
                              onClick={() => {
                                if(!newLeadName || !newLeadCompany) return;
                                setSimLeads(prev => [{ id: Date.now().toString(), name: newLeadName, company: newLeadCompany, email: `${newLeadName.toLowerCase().replace(' ', '')}@gmail.com`, phone: '+91 99999 55555', status: 'NEW' }, ...prev]);
                                setNewLeadName('');
                                setNewLeadCompany('');
                                AlertUser('Lead added locally. Trigger offline sync engine to sync with core database.');
                              }}
                              className="w-full bg-emerald-600 text-white font-bold py-1.5 rounded-lg text-[10px]"
                            >
                              Add Lead to CRM Queue
                            </button>
                          </div>
                        </div>
                      )}

                      {simTab === 'ai' && (
                        <div className="space-y-4 flex flex-col h-full">
                          <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-xl p-3 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-emerald-400" />
                            <p className="text-[10px] text-emerald-300 font-bold">SDR Co-Pilot Active</p>
                          </div>

                          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs space-y-2">
                            <p className="font-bold text-white">&gt; How can I help you today?</p>
                            <p className="text-slate-400">Ask me to draft emails, analyze inbound calls, reschedule Google meetings, or query the CRM.</p>
                          </div>

                          <div className="flex gap-2">
                            <button 
                              onClick={() => AlertUser('Voice Input Emulation started: Speak into your microphone...')}
                              className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs"
                            >
                              🎙️ Speak
                            </button>
                            <input 
                              type="text" 
                              placeholder="Type natural command..." 
                              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2 text-xs focus:outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {simTab === 'calendar' && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-slate-400">UPCOMING APPOINTMENTS</h4>
                          <div className="space-y-3">
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
                              <div className="flex justify-between">
                                <span className="font-bold text-xs">Vijay Shekhar</span>
                                <span className="text-[9px] bg-blue-950 text-blue-400 px-2 py-0.5 rounded">11:30 AM</span>
                              </div>
                              <p className="text-[10px] text-slate-400">Oyo Rooms Demo meeting. Google Meet invite dispatched.</p>
                              <button 
                                onClick={() => AlertUser('Joining Google Meet Room via secure mobile overlay...')}
                                className="w-full bg-blue-600 text-white font-bold text-[10px] py-1.5 rounded-lg"
                              >
                                Join Google Meet Room
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {simTab === 'gmail' && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-400">GMAIL CONNECTED CLIENT</h4>
                          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
                            <div className="flex justify-between">
                              <span className="font-bold text-xs text-emerald-400">vijay@paytm.com</span>
                              <span className="text-[9px] text-slate-500 font-mono">Today</span>
                            </div>
                            <p className="text-[11px] font-bold">API Outbound voice calling features</p>
                            <p className="text-[10px] text-slate-400">Can you show me how your system triggers call-backs?</p>
                            <button 
                              onClick={() => {
                                AlertUser('AI Reply Drafted: "Hi Vijay, great connect. Let\'s do Wednesday 11 AM Zoom." Draft queued.');
                              }}
                              className="bg-emerald-950/45 text-emerald-400 font-bold border border-emerald-800/65 text-[10px] py-1 px-2.5 rounded"
                            >
                              🪄 Smart Reply AI Draft
                            </button>
                          </div>
                        </div>
                      )}

                      {simTab === 'voice' && (
                        <div className="space-y-4">
                          {!simCallActive ? (
                            <div className="space-y-3">
                              <h4 className="text-xs font-bold text-slate-400">ACTIVE OUTBOUND DIALER</h4>
                              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                                <p className="text-[10px] text-slate-500 font-bold">DIAL PAD INTERFACE</p>
                                <p className="text-xl font-bold text-emerald-400 my-3 tracking-widest">+91 99999 88888</p>
                                <button 
                                  onClick={() => startSimCall('Vijay Shekhar (Paytm)')}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-6 rounded-full"
                                >
                                  📞 Call Prospect Now
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
                              <div className="text-center">
                                <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block mb-1">
                                  {simCallStatus === 'dialing' ? 'Ringing Prospect...' : 'Active call duration'}
                                </span>
                                <h5 className="font-bold text-white text-sm">{simCallName}</h5>
                                <span className="text-xs text-slate-500 font-mono">00:0{simDuration}s</span>
                              </div>

                              <div className="h-16 flex items-center justify-center gap-1.5 bg-slate-950 rounded-lg px-3">
                                <div className="w-1.5 h-10 bg-emerald-500 rounded-full animate-bounce" />
                                <div className="w-1.5 h-6 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                <div className="w-1.5 h-12 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                                <div className="w-1.5 h-4 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.6s' }} />
                              </div>

                              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 h-28 overflow-y-auto space-y-1">
                                <p className="text-[9px] text-slate-500 font-bold">LIVE TRANSLATION STREAM</p>
                                {simTranscripts.map((t, idx) => (
                                  <p key={idx} className="text-[10px] text-slate-300 font-mono">{t}</p>
                                ))}
                              </div>

                              <button 
                                onClick={() => setSimCallActive(false)}
                                className="w-full bg-red-600 text-white font-bold text-xs py-2 rounded-xl"
                              >
                                Hang Up Call
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {simTab === 'scanner' && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-slate-400">HARDWARE CAMERA DIALOGS</h4>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <button 
                              onClick={runSimCardScan}
                              className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col items-center gap-1"
                            >
                              <span className="text-lg">📷</span>
                              <span className="text-[10px] font-bold text-white">Card Scanner</span>
                            </button>
                            <button 
                              onClick={() => {
                                setSimQrScanActive(true);
                                setSimScanResult(null);
                                setTimeout(() => {
                                  setSimQrScanActive(false);
                                  AlertUser('Deep Link Scanned: redirecting to Kunal Shah\'s CRM Profile.');
                                }, 1500);
                              }}
                              className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col items-center gap-1"
                            >
                              <span className="text-lg">🏁</span>
                              <span className="text-[10px] font-bold text-white">QR Reader</span>
                            </button>
                          </div>

                          {simCardScanActive && (
                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col items-center gap-2">
                              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                              <p className="text-[11px] text-slate-400">Analyzing card layout with Gemini OCR...</p>
                            </div>
                          )}

                          {simScanResult && (
                            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-1.5 text-[11px]">
                              <p className="text-slate-500 font-bold uppercase text-[9px]">Scan Result</p>
                              <p className="text-white font-bold">{simScanResult.name}</p>
                              <p className="text-slate-400">{simScanResult.company} • {simScanResult.email}</p>
                              <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-900 px-1.5 py-0.5 rounded">
                                Lead Injected to CRM Outbox
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {simTab === 'settings' && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-slate-400">DEVICE SECURITY PREFERENCES</h4>

                          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3 text-xs">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-bold">Biometric Screen Lock</p>
                                <p className="text-[10px] text-slate-400">Unlock with TouchID / FaceID</p>
                              </div>
                              <input 
                                type="checkbox" 
                                checked={simBiometric}
                                onChange={() => setSimBiometric(!simBiometric)}
                                className="accent-emerald-500 w-4 h-4"
                              />
                            </div>

                            <div className="border-t border-slate-800 pt-3 flex justify-between items-center">
                              <div>
                                <p className="font-bold">Realtime Push Alerts</p>
                                <p className="text-[10px] text-slate-400">Notify on CRM lead captures</p>
                              </div>
                              <input 
                                type="checkbox" 
                                checked={simNotifications}
                                onChange={() => setSimNotifications(!simNotifications)}
                                className="accent-emerald-500 w-4 h-4"
                              />
                            </div>
                          </div>

                          <button 
                            onClick={() => setIsLogged(false)}
                            className="w-full bg-slate-900 border border-red-800/40 text-red-400 font-bold text-xs py-2 rounded-xl"
                          >
                            Logout Session
                          </button>
                        </div>
                      )}

                    </div>

                    {/* Bottom App Navigation Tabs */}
                    <div className="bg-slate-900 border-t border-slate-800 h-14 flex items-center justify-around text-slate-500">
                      <button onClick={() => setSimTab('dashboard')} className={`flex flex-col items-center ${simTab === 'dashboard' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
                        <span className="text-base">📊</span>
                        <span className="text-[8px] font-bold mt-0.5">Home</span>
                      </button>
                      <button onClick={() => setSimTab('crm')} className={`flex flex-col items-center ${simTab === 'crm' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
                        <span className="text-base">👥</span>
                        <span className="text-[8px] font-bold mt-0.5">CRM</span>
                      </button>
                      <button onClick={() => setSimTab('voice')} className={`flex flex-col items-center ${simTab === 'voice' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
                        <span className="text-base">📞</span>
                        <span className="text-[8px] font-bold mt-0.5">Voice</span>
                      </button>
                      <button onClick={() => setSimTab('scanner')} className={`flex flex-col items-center ${simTab === 'scanner' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
                        <span className="text-base">📷</span>
                        <span className="text-[8px] font-bold mt-0.5">Scan</span>
                      </button>
                      <button onClick={() => setSimTab('settings')} className={`flex flex-col items-center ${simTab === 'settings' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
                        <span className="text-base">⚙️</span>
                        <span className="text-[8px] font-bold mt-0.5">Settings</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>

              {/* iPhone Home Indicator bar */}
              <div className="bg-slate-900 h-5 flex items-center justify-center z-40">
                <div className="w-28 h-1 bg-white/40 rounded-full" />
              </div>

            </div>
          </div>

        </div>
      )}

      {activeWorkspaceTab === 'code' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* File selector list (Left column - 1 col) */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">Expo File Hierarchy</h3>
            {Object.keys(fileContents).map(fileName => (
              <button
                key={fileName}
                onClick={() => setSelectedFile(fileName)}
                className={`w-full text-left p-3 rounded-xl border transition text-xs font-mono flex items-center gap-2 ${selectedFile === fileName ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              >
                <FileText className="w-4 h-4 text-emerald-500" />
                <span>/mobile/{fileName}</span>
              </button>
            ))}
          </div>

          {/* Code Viewer pane (Right column - 3 cols) */}
          <div className="lg:col-span-3 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col">
            <div className="bg-slate-950 px-6 py-3 flex justify-between items-center border-b border-slate-800">
              <span className="text-xs font-mono text-emerald-400">/mobile/src/{selectedFile}</span>
              <button 
                onClick={() => copyToClipboard(fileContents[selectedFile], selectedFile)}
                className="text-slate-400 hover:text-white transition flex items-center gap-1 text-xs"
              >
                {copiedFile === selectedFile ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFile === selectedFile ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="p-6 overflow-x-auto text-slate-300 font-mono text-xs leading-relaxed max-h-[500px]">
              <code>{fileContents[selectedFile]}</code>
            </pre>
          </div>

        </div>
      )}

      {activeWorkspaceTab === 'docs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Doc sub navigation side drawer (Left column - 3 cols) */}
          <div className="lg:col-span-3 space-y-2">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">Release & Build Manuals</h3>
            
            <button
              onClick={() => setActiveDocSection('architecture')}
              className={`w-full text-left p-3 rounded-xl border transition text-xs font-semibold flex items-center gap-2.5 ${activeDocSection === 'architecture' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
            >
              <Cpu className="w-4 h-4" />
              <span>Mobile Architecture</span>
            </button>

            <button
              onClick={() => setActiveDocSection('api')}
              className={`w-full text-left p-3 rounded-xl border transition text-xs font-semibold flex items-center gap-2.5 ${activeDocSection === 'api' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
            >
              <Terminal className="w-4 h-4" />
              <span>API Integration Blueprint</span>
            </button>

            <button
              onClick={() => setActiveDocSection('build')}
              className={`w-full text-left p-3 rounded-xl border transition text-xs font-semibold flex items-center gap-2.5 ${activeDocSection === 'build' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
            >
              <Code className="w-4 h-4" />
              <span>Expo CLI Build Guides</span>
            </button>

            <button
              onClick={() => setActiveDocSection('stores')}
              className={`w-full text-left p-3 rounded-xl border transition text-xs font-semibold flex items-center gap-2.5 ${activeDocSection === 'stores' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>App Store Upload Checklists</span>
            </button>
          </div>

          {/* Doc Content panel (Right column - 9 cols) */}
          <div className="lg:col-span-9 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            
            {activeDocSection === 'architecture' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900">Mobile Client System Architecture</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  The SalesPilot React Native Client is structured using Expo SDK 51, providing a solid platform that runs on both iOS and Android with single-codebase parity.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <h4 className="font-bold text-slate-800 text-xs">Offline-First Caching (AsyncStorage)</h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                      All CRM records and appointments are loaded from local cache first to allow uninterrupted work in areas of poor network coverage.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <h4 className="font-bold text-slate-800 text-xs">Offline Synced outbox Queue</h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                      Transactions executed offline are stored in a transaction FIFO queue and dispatched automatically upon reconnection.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <h4 className="font-bold text-slate-800 text-xs">Secure Token Management</h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                      SDR session JWT authentication tokens are written to secure iOS Keychain and Android Keystore vaults.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <h4 className="font-bold text-slate-800 text-xs">Push Notification Handshakes</h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                      Hooks for Firebase Cloud Messaging (FCM) handle instant reminders for meetings, new leads, and workflow statuses.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeDocSection === 'api' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900">REST API Integration Blueprint</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  The mobile client communicates directly with the primary SalesPilot Web backend endpoints.
                </p>

                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                      <th className="pb-3">ENDPOINT</th>
                      <th className="pb-3">METHOD</th>
                      <th className="pb-3">DESCRIPTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100 text-slate-700">
                      <td className="py-3 font-mono">/api/v1/auth/login</td>
                      <td className="py-3 text-blue-600 font-bold">POST</td>
                      <td className="py-3 text-slate-500">JWT Token session handshake</td>
                    </tr>
                    <tr className="border-b border-slate-100 text-slate-700">
                      <td className="py-3 font-mono">/api/v1/leads</td>
                      <td className="py-3 text-emerald-600 font-bold">GET / POST</td>
                      <td className="py-3 text-slate-500">Retrieve/create CRM leads and card uploads</td>
                    </tr>
                    <tr className="border-b border-slate-100 text-slate-700">
                      <td className="py-3 font-mono">/api/v1/appointments</td>
                      <td className="py-3 text-emerald-600 font-bold">GET / POST</td>
                      <td className="py-3 text-slate-500">Google Calendar meeting synchronization</td>
                    </tr>
                    <tr className="text-slate-700">
                      <td className="py-3 font-mono">/api/v1/voice/calls</td>
                      <td className="py-3 text-amber-600 font-bold">POST</td>
                      <td className="py-3 text-slate-500">Dispatches WebRTC session to Voice platform</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeDocSection === 'build' && (
              <div className="space-y-6 font-mono text-xs">
                <h3 className="text-sm font-bold text-slate-900 font-sans">Expo EAS Compilation Commands</h3>
                <p className="text-slate-500 text-xs leading-relaxed font-sans">
                  Use the following sequence of terminal directives inside the <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">/mobile</code> directory to build local binaries.
                </p>

                <div className="bg-slate-950 p-4 rounded-xl text-slate-300 space-y-3 border border-slate-800">
                  <p className="text-slate-500"># 1. Install EAS global CLI</p>
                  <p className="text-emerald-400">npm install -g eas-cli</p>
                  
                  <p className="text-slate-500"># 2. Authenticate to Expo server accounts</p>
                  <p className="text-emerald-400">eas login</p>
                  
                  <p className="text-slate-500"># 3. Configure EAS Build profiles</p>
                  <p className="text-emerald-400">eas build:configure</p>
                  
                  <p className="text-slate-500"># 4. Trigger production Android AAB / APK</p>
                  <p className="text-emerald-400">eas build --platform android --profile production</p>
                  
                  <p className="text-slate-500"># 5. Trigger production iOS App Store archive</p>
                  <p className="text-emerald-400">eas build --platform ios --profile production</p>
                </div>
              </div>
            )}

            {activeDocSection === 'stores' && (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span>🤖</span> Google Play Store Checklist
                  </h4>
                  <ul className="text-xs text-slate-500 space-y-2 list-disc pl-4">
                    <li>Compile optimized Android App Bundle (.aab) package format.</li>
                    <li>Verify secure 1024-bit app signing key in Play Console.</li>
                    <li>Add Biometric hardware permissions in <code className="bg-slate-100 px-1 py-0.5 rounded">AndroidManifest.xml</code>.</li>
                    <li>Complete content rating and Google privacy questionnaires.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span>🍏</span> Apple App Store Checklist
                  </h4>
                  <ul className="text-xs text-slate-500 space-y-2 list-disc pl-4">
                    <li>Generate valid iOS distribution provisioning certificates.</li>
                    <li>Add FaceID description strings in <code className="bg-slate-100 px-1 py-0.5 rounded">info.plist</code> privacy block.</li>
                    <li>Submit screenshot sets for both 6.5-inch and 5.5-inch display profiles.</li>
                    <li>Configure user-auth demo credentials for review team bypass.</li>
                  </ul>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

function TextLabel({ text }: { text: string }) {
  return (
    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
      {text}
    </span>
  );
}

function AlertUser(message: string) {
  alert(message);
}
