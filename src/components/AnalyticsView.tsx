import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, BarChart2, PieChart, Calendar, ChevronDown, Download, Filter, 
  ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle, Sparkles, CheckCircle2, 
  Loader2, Mail, Users, MessageSquare, Briefcase, Award, Cpu, FileText, FileSpreadsheet, 
  Printer, Coins, Zap, MapPin, DollarSign, CalendarCheck, HelpCircle, Activity, Play, Check, X,
  FileCode, Layers, ShieldAlert, BarChart3, TrendingDown, Sliders
} from 'lucide-react';

export function AnalyticsView() {
  // Date range and Filters
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [industryFilter, setIndustryFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'campaigns' | 'meetings' | 'team' | 'reports'>('overview');

  // Sub-metrics within Email Performance
  const [emailMetric, setEmailMetric] = useState<'open' | 'reply' | 'conversion'>('open');

  // Interactive Forecasting Sliders
  const [forecastConversion, setForecastConversion] = useState(22); // initial 22%
  const [forecastDealSize, setForecastDealSize] = useState(75000); // initial ₹75k INR

  // Copy Diagnostician Interactive state
  const [customSubjectLine, setCustomSubjectLine] = useState('');
  const [diagnosedResult, setDiagnosedResult] = useState<any | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  // PDF Preview Modal
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfReportMonth, setPdfReportMonth] = useState('July 2026');
  const [pdfIncludedModules, setPdfIncludedModules] = useState({
    revenue: true,
    campaigns: true,
    meetings: true,
    sources: true,
    team: true
  });

  // Report Compiler Simulator state
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileProgress, setCompileProgress] = useState(0);
  const [compileStepText, setCompileStepText] = useState('');
  const [readyReport, setReadyReport] = useState<any | null>(null);

  // Mock database
  const pipelineStats = {
    totalPipeline: 2450000,
    wonARR: 840000,
    averageDeal: 75000,
    meetingsCount: 38,
    activeLeads: 1259,
    openDeals: 18,
    teamAutonomyRatio: 84 // % of outreach automated
  };

  const campaignsData = [
    { name: 'SaaS Mid-Market Growth', type: 'Email', sent: 1420, openRate: 71.2, replyRate: 28.4, conversionRate: 9.4, revenue: 480000 },
    { name: 'FinTech Founders Pune', type: 'LinkedIn', sent: 840, openRate: 64.8, replyRate: 21.5, conversionRate: 7.2, revenue: 290000 },
    { name: 'Logistics Drip Sequence', type: 'Email', sent: 620, openRate: 58.2, replyRate: 18.1, conversionRate: 4.5, revenue: 110000 },
    { name: 'Marketing Agency Warm-up', type: 'Email', sent: 410, openRate: 78.5, replyRate: 31.0, conversionRate: 12.5, revenue: 340000 },
    { name: 'SaaS Recruiters Mumbai', type: 'LinkedIn', sent: 390, openRate: 61.2, replyRate: 14.8, conversionRate: 3.1, revenue: 75000 },
  ];

  const leadSources = [
    { source: 'LinkedIn Scraping', count: 432, share: 34, cac: 820, quality: 'High', color: 'bg-blue-500' },
    { source: 'Crunchbase Enrichment', count: 251, share: 20, cac: 1140, quality: 'High', color: 'bg-indigo-500' },
    { source: 'Warm Inbound Leads', count: 152, share: 12, cac: 450, quality: 'Premium', color: 'bg-emerald-500' },
    { source: 'Cold Drip Campaigns', count: 324, share: 26, cac: 980, quality: 'Medium', color: 'bg-amber-500' },
    { source: 'Partnership Channels', count: 98, share: 8, cac: 1450, quality: 'Premium', color: 'bg-purple-500' },
  ];

  const teamSdrPerformance = [
    { name: 'Rahul Sharma', role: 'Senior SDR', tasks: 310, closed: 12, revenue: 420000, speed: '12.4m', rating: '94%' },
    { name: 'Preeti Sen', role: 'Outreach Manager', tasks: 280, closed: 9, revenue: 310000, speed: '15.8m', rating: '91%' },
    { name: 'Amit Patel', role: 'Sales Specialist', tasks: 190, closed: 5, revenue: 180000, speed: '21.2m', rating: '88%' },
    { name: 'Astra Prospector', role: 'AI Scout', tasks: 4120, closed: 38, revenue: 1240000, speed: '1.4s', rating: '98%' },
    { name: 'Vinci Copywriter', role: 'AI Composer', tasks: 3890, closed: 32, revenue: 1040000, speed: '0.9s', rating: '92%' },
  ];

  const aiAgentPerformance = [
    { agent: 'Astra Prospector', task: 'Lead Sourcing', accuracy: '98.4%', costSaved: '₹14,500', tokens: '1.2M', status: 'ACTIVE' },
    { agent: 'Vesper Analyst', task: 'Stack Enrichment', accuracy: '94.2%', costSaved: '₹8,400', tokens: '4.5M', status: 'ACTIVE' },
    { agent: 'Vinci Copywriter', task: 'Copy Generation', accuracy: '91.5%', costSaved: '₹11,200', tokens: '2.1M', status: 'ACTIVE' },
    { agent: 'Hermes Postman', task: 'SMTP Scheduling', accuracy: '99.1%', costSaved: '₹4,800', tokens: '0.4M', status: 'ACTIVE' },
    { agent: 'Echo Persister', task: 'Follow-up Drips', accuracy: '95.8%', costSaved: '₹6,100', tokens: '1.8M', status: 'STANDBY' },
    { agent: 'Kratos Scheduler', task: 'Calendar Booking', accuracy: '97.6%', costSaved: '₹9,200', tokens: '0.9M', status: 'STANDBY' },
  ];

  const recentMeetings = [
    { client: 'Apex Solutions', date: '2026-07-07 15:00', host: 'Astra AI Scheduler', source: 'LinkedIn Scraping', status: 'CONFIRMED' },
    { client: 'StellarTech Labs', date: '2026-07-08 11:30', host: 'Rahul Sharma', source: 'Warm Inbound', status: 'COMPLETED' },
    { client: 'Zylker Systems', date: '2026-07-09 16:00', host: 'Preeti Sen', source: 'Cold Drip Campaigns', status: 'CONFIRMED' },
    { client: 'Sen Finance Ltd', date: '2026-07-10 14:00', host: 'Kratos Scheduler', source: 'LinkedIn Scraping', status: 'PENDING' },
    { client: 'Nexa Softwares', date: '2026-07-11 10:00', host: 'Amit Patel', source: 'Partnership Channels', status: 'CONFIRMED' },
  ];

  // Dynamic Forecasting calculations
  const forecastedData = useMemo(() => {
    const baseValue = pipelineStats.totalPipeline;
    const factor = forecastConversion / 100;
    const sizeFactor = forecastDealSize / 75000;
    
    return [
      { month: 'Jul 26', conservative: Math.round(baseValue * 0.15 * sizeFactor), expected: Math.round(baseValue * factor * sizeFactor), aggressive: Math.round(baseValue * factor * 1.35 * sizeFactor) },
      { month: 'Aug 26', conservative: Math.round(baseValue * 0.18 * sizeFactor), expected: Math.round(baseValue * factor * 1.15 * sizeFactor), aggressive: Math.round(baseValue * factor * 1.55 * sizeFactor) },
      { month: 'Sep 26', conservative: Math.round(baseValue * 0.22 * sizeFactor), expected: Math.round(baseValue * factor * 1.30 * sizeFactor), aggressive: Math.round(baseValue * factor * 1.80 * sizeFactor) },
      { month: 'Oct 26', conservative: Math.round(baseValue * 0.25 * sizeFactor), expected: Math.round(baseValue * factor * 1.45 * sizeFactor), aggressive: Math.round(baseValue * factor * 2.10 * sizeFactor) },
      { month: 'Nov 26', conservative: Math.round(baseValue * 0.28 * sizeFactor), expected: Math.round(baseValue * factor * 1.60 * sizeFactor), aggressive: Math.round(baseValue * factor * 2.45 * sizeFactor) },
      { month: 'Dec 26', conservative: Math.round(baseValue * 0.32 * sizeFactor), expected: Math.round(baseValue * factor * 1.85 * sizeFactor), aggressive: Math.round(baseValue * factor * 2.80 * sizeFactor) },
    ];
  }, [forecastConversion, forecastDealSize]);

  // Max value for scaling SVG graphs
  const maxForecastValue = useMemo(() => {
    return Math.max(...forecastedData.map(d => d.aggressive));
  }, [forecastedData]);

  // Subject line dynamic analyzer handler
  const handleDiagnoseSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSubjectLine.trim()) return;

    setIsDiagnosing(true);
    setTimeout(() => {
      const line = customSubjectLine.toLowerCase();
      let openProb = 65;
      let replyProb = 21;
      let verdict = 'Good';
      let tips = ['Keep character count under 45.', 'Maintain INR dynamic localization placeholders.'];

      if (line.includes('outsource') || line.includes('cheap') || line.includes('free')) {
        openProb = 38;
        replyProb = 8;
        verdict = 'Spam Risk';
        tips.unshift('REPLACE "outsource/free" to avoid corporate spam filters.');
      } else if (line.includes('quick question') || line.includes('deal') || line.includes('demo')) {
        openProb = 54;
        replyProb = 14;
        verdict = 'Mediocre';
        tips.unshift('Make subject line more personalized and value-oriented rather than asking for transactional slots immediately.');
      } else if (line.includes('automation') || line.includes('growth') || line.includes('fintech') || line.includes('mumbai') || line.includes('bangalore')) {
        openProb = 84;
        replyProb = 34;
        verdict = 'Excellent';
        tips.unshift('Leveraging local geo-modifiers increases open rate by +18%. Great copy.');
      }

      setDiagnosedResult({
        openProb,
        replyProb,
        verdict,
        tips
      });
      setIsDiagnosing(false);
    }, 1200);
  };

  // Compile Reports simulator
  const compileSteps = [
    'Initializing secure diagnostic pipeline socket...',
    'Aggregating pipeline database records from public.crm_pipeline...',
    'Evaluating multi-channel campaign CTR open & bounce parameters...',
    'Compiling INR currency localized metrics...',
    'Generating 6-month predictive forecasting regressions...',
    'Analyzing comparative SDR vs AI Agent efficiency charts...',
    'Encrypting document with SHA-256 secure workspace key...',
    'Publishing high-contrast binary report asset...'
  ];

  const handleTriggerCompilation = () => {
    setIsCompiling(true);
    setReadyReport(null);
    setCompileProgress(5);
    
    let step = 0;
    const interval = setInterval(() => {
      setCompileProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsCompiling(false);
          setReadyReport({
            id: `rep-${Date.now()}`,
            name: `SalesPilot_Enterprise_Metrics_${pdfReportMonth.replace(' ', '_')}`,
            date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
            checksum: 'sha256-f89a421bc0898fa3910b981f3b82fd56f3e82aa219c08d',
            organization: 'Horizon Media Group Ltd.',
            recipient: 'sohamkharat481@gmail.com'
          });
          return 100;
        }
        step = Math.min(Math.floor((prev / 100) * compileSteps.length), compileSteps.length - 1);
        setCompileStepText(compileSteps[step]);
        return prev + Math.floor(Math.random() * 12) + 6;
      });
    }, 450);
  };

  // CSV Spreadsheet Export Engine
  const triggerCsvExport = () => {
    let csvContent = `SalesPilot Enterprise Analytical Database Export - ${pdfReportMonth}\n`;
    csvContent += `Generated On: ${new Date().toLocaleString()}\n`;
    csvContent += `Organization: Horizon Media Group\n\n`;

    if (pdfIncludedModules.revenue) {
      csvContent += `--- REVENUE & PIPELINE TELEMETRY ---\n`;
      csvContent += `"Metric","Value","Target Indicator"\n`;
      csvContent += `"Active Outbound Pipeline","₹${pipelineStats.totalPipeline.toLocaleString('en-IN')}","Healthy"\n`;
      csvContent += `"Closed Won ARR","₹${pipelineStats.wonARR.toLocaleString('en-IN')}","On Track"\n`;
      csvContent += `"Average Deal Value","₹${pipelineStats.averageDeal.toLocaleString('en-IN')}","Stable"\n`;
      csvContent += `"AI Autonomy Ratio","${pipelineStats.teamAutonomyRatio}%","Optimized"\n\n`;
    }

    if (pdfIncludedModules.campaigns) {
      csvContent += `--- ACTIVE CAMPAIGNS ---\n`;
      csvContent += `"Campaign Name","Channel","Sent","Open Rate","Reply Rate","Conversion Rate","Revenue Value"\n`;
      campaignsData.forEach(c => {
        csvContent += `"${c.name}","${c.type}","${c.sent}","${c.openRate}%","${c.replyRate}%","${c.conversionRate}%","₹${c.revenue.toLocaleString('en-IN')}"\n`;
      });
      csvContent += `\n`;
    }

    if (pdfIncludedModules.meetings) {
      csvContent += `--- BOOKED MEETINGS & APPOINTMENTS ---\n`;
      csvContent += `"Prospect Company","Meeting Slot","Assigned Host","Lead Source","Status"\n`;
      recentMeetings.forEach(m => {
        csvContent += `"${m.client}","${m.date}","${m.host}","${m.source}","${m.status}"\n`;
      });
      csvContent += `\n`;
    }

    if (pdfIncludedModules.sources) {
      csvContent += `--- LEAD SOURCE COMPARISON ---\n`;
      csvContent += `"Lead Source","Total Count","Percent Share","Acquisition Cost (CAC INR)","Quality Rating"\n`;
      leadSources.forEach(s => {
        csvContent += `"${s.source}","${s.count}","${s.share}%","₹${s.cac.toLocaleString('en-IN')}","${s.quality}"\n`;
      });
      csvContent += `\n`;
    }

    if (pdfIncludedModules.team) {
      csvContent += `--- SALES FORCE EFFICIENCY (HUMANS VS AI FLEET) ---\n`;
      csvContent += `"Name","Role","Tasks Handled","Closed Won Deals","Attributed Revenue","Response Velocity","Accuracy Rating"\n`;
      teamSdrPerformance.forEach(t => {
        csvContent += `"${t.name}","${t.role}","${t.tasks}","${t.closed}","₹${t.revenue.toLocaleString('en-IN')}","${t.speed}","${t.rating}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SalesPilot_Enterprise_Analytics_${pdfReportMonth.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Printing Mode Trigger
  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div id="enterprise_analytics_dashboard" className="space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" /> Enterprise Intelligence Suite
            <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-md border border-indigo-200 dark:border-indigo-900">ENTERPRISE GATEWAY</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time pipeline telemetry, interactive forecasting, and autonomous CRM diagnostics.
          </p>
        </div>

        {/* Global Control Bar */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700/60 text-[11px] font-mono font-semibold">
            {(['7d', '30d', '90d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  dateRange === r 
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
                }`}
              >
                {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>

          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="ALL">All Sectors</option>
            <option value="AGENCY">Marketing Agencies</option>
            <option value="SAAS">SaaS Tech</option>
            <option value="FINTECH">FinTech Segment</option>
          </select>
        </div>
      </div>

      {/* 2. Sub-navigation tabs */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 gap-1">
        {[
          { id: 'overview', label: 'Overview Dashboard', icon: BarChart2 },
          { id: 'revenue', label: 'Revenue & Forecasting', icon: Coins },
          { id: 'campaigns', label: 'Email & Campaigns', icon: Mail },
          { id: 'meetings', label: 'Meetings & Sources', icon: CalendarCheck },
          { id: 'team', label: 'AI & SDR Performance', icon: Cpu },
          { id: 'reports', label: 'Monthly Exports Suite', icon: FileSpreadsheet },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2.5 font-medium text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                isActive 
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-slate-50/50 dark:bg-slate-850/30 font-semibold' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 3. Tab Contents */}

      {/* TABS OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Main KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Total Outbound Pipeline</span>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> +18.4%
                </span>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <h3 className="text-xl font-bold font-mono text-slate-950 dark:text-white">
                  ₹{(pipelineStats.totalPipeline).toLocaleString('en-IN')}
                </h3>
                <span className="text-[9px] text-slate-400 font-mono">Weighted Value</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: '75%' }} />
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">ARR Booked</span>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> +12.5%
                </span>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <h3 className="text-xl font-bold font-mono text-slate-950 dark:text-white">
                  ₹{(pipelineStats.wonARR).toLocaleString('en-IN')}
                </h3>
                <span className="text-[9px] text-slate-400 font-mono">Closed Won ARR</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '64%' }} />
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Response Rate (Reply)</span>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> +4.1%
                </span>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <h3 className="text-xl font-bold font-mono text-slate-950 dark:text-white">
                  24.20%
                </h3>
                <span className="text-[9px] text-slate-400 font-mono">Industry high</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '82%' }} />
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Fleet Automation Level</span>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.2 rounded">
                  Max Optimized
                </span>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <h3 className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                  {pipelineStats.teamAutonomyRatio}%
                </h3>
                <span className="text-[9px] text-slate-400 font-mono">Outbound Handsfree</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${pipelineStats.teamAutonomyRatio}%` }} />
              </div>
            </div>
          </div>

          {/* Quick overview layout block */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Lead channels share */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <PieChart className="w-4 h-4 text-indigo-500" /> Sourced Lead Quality
                </h3>
                <div className="space-y-4 my-6">
                  {leadSources.map((s, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-350 flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                          {s.source}
                        </span>
                        <span className="font-mono text-slate-500 dark:text-slate-400">{s.share}% ({s.count})</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.share}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 rounded-lg text-center text-[10px] font-mono text-slate-500 dark:text-slate-400">
                Warm Inbound Leads hold the lowest CAC at <strong className="text-emerald-600 dark:text-emerald-400">₹450/lead</strong>.
              </div>
            </div>

            {/* Outbound conversion steps */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-500 animate-pulse" /> Outbound Funnel Pipeline (INR Value attribution)
                </h3>
                <span className="text-[10px] font-mono text-slate-500">30 days aggregate</span>
              </div>

              {/* Conversion Pipeline Chart steps */}
              <div className="space-y-4">
                {[
                  { stage: 'Prospects Sourced', count: 1259, val: 2450000, pct: 100, color: 'bg-blue-600/90' },
                  { stage: 'Emails Reached', count: 984, val: 1950000, pct: 78, color: 'bg-indigo-600/85' },
                  { stage: 'Active Reply Leads', count: 238, val: 840000, pct: 19, color: 'bg-purple-600/80' },
                  { stage: 'Demos Booked', count: 38, val: 340000, pct: 3, color: 'bg-emerald-600/90' }
                ].map((st, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-350 w-32 shrink-0">{st.stage}</span>
                    <div className="flex-grow flex items-center gap-3">
                      <div className="flex-grow h-7 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-150 dark:border-slate-850 overflow-hidden relative flex items-center pr-3">
                        <div className={`h-full ${st.color} flex items-center pl-3 font-mono font-bold text-[10px] text-white transition-all`} style={{ width: `${st.pct}%` }}>
                          {st.pct}%
                        </div>
                        <div className="absolute right-3 font-mono text-[10px] text-slate-500 font-semibold">
                          ₹{st.val.toLocaleString('en-IN')} ({st.count})
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 items-center text-[10px] text-amber-600 dark:text-amber-400 p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  The CRM detected a <strong className="font-semibold">3.1% leakage</strong> in segment transition between "Active Reply Leads" and "Demos Booked" due to calendar booking lag. Enable Kratos Agent in high-priority mode to auto-claim bookings.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REVENUE & FORECASTING */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Forecast parameters config */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-6">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-blue-500" /> Scenario Forecaster Engine
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Slide parameters to predict ARR & MRR pipelines based on automated agent optimizations.
                </p>
              </div>

              {/* Slider 1: Expected conversion rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-350">Pipeline Conversion Rate</label>
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{forecastConversion}%</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="60" 
                  step="1"
                  value={forecastConversion}
                  onChange={(e) => setForecastConversion(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <span>5% (Min)</span>
                  <span>60% (Enterprise Peak)</span>
                </div>
              </div>

              {/* Slider 2: Average Order/Deal size */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-350">Average Deal Ticket Size</label>
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">₹{forecastDealSize.toLocaleString('en-IN')}</span>
                </div>
                <input 
                  type="range" 
                  min="20000" 
                  max="250000" 
                  step="5000"
                  value={forecastDealSize}
                  onChange={(e) => setForecastDealSize(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <span>₹20,000</span>
                  <span>₹2,50,000 (Big Enterprise)</span>
                </div>
              </div>

              {/* Numerical summary estimates */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-850 space-y-3">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">Calculated December 2026 Run Rate</span>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" /> Conservative
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                    ₹{forecastedData[5].conservative.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" /> Expected Estimate
                  </span>
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                    ₹{forecastedData[5].expected.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Aggressive Run
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{forecastedData[5].aggressive.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic Forecast graph line */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-blue-500" /> Dynamic Predictive Forecast Curve
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Predicting monthly revenue progression based on pipeline changes.
                    </p>
                  </div>

                  {/* Legend */}
                  <div className="flex gap-2 text-[9px] font-mono">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-slate-300 dark:bg-slate-700" /> Con.</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-600" /> Exp.</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500" /> Agg.</span>
                  </div>
                </div>

                {/* SVG Forecasting Curves */}
                <div className="relative w-full h-[220px] bg-slate-50 dark:bg-slate-950 rounded-lg p-4 border border-slate-150 dark:border-slate-900 mt-4">
                  <svg className="w-full h-[180px]" viewBox="0 0 500 180" preserveAspectRatio="none">
                    {/* Grid horizontal guidelines */}
                    <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeDasharray="3" className="dark:stroke-slate-900" />
                    <line x1="0" y1="90" x2="500" y2="90" stroke="#f1f5f9" strokeDasharray="3" className="dark:stroke-slate-900" />
                    <line x1="0" y1="150" x2="500" y2="150" stroke="#f1f5f9" strokeDasharray="3" className="dark:stroke-slate-900" />

                    {/* Conservative Estimate curve line (Slate) */}
                    <path 
                      d={`M ${forecastedData.map((d, i) => `${(i / 5) * 460 + 20},${160 - (d.conservative / maxForecastValue) * 130}`).join(' L ')}`} 
                      fill="none" 
                      stroke="#94a3b8" 
                      strokeWidth="2.5" 
                      strokeDasharray="4"
                      strokeLinecap="round"
                    />

                    {/* Expected Estimate curve line (Blue) */}
                    <path 
                      d={`M ${forecastedData.map((d, i) => `${(i / 5) * 460 + 20},${160 - (d.expected / maxForecastValue) * 130}`).join(' L ')}`} 
                      fill="none" 
                      stroke="#2563eb" 
                      strokeWidth="3.5" 
                      strokeLinecap="round"
                    />

                    {/* Aggressive Estimate curve line (Emerald) */}
                    <path 
                      d={`M ${forecastedData.map((d, i) => `${(i / 5) * 460 + 20},${160 - (d.aggressive / maxForecastValue) * 130}`).join(' L ')}`} 
                      fill="none" 
                      stroke="#10b981" 
                      strokeWidth="2.5" 
                      strokeLinecap="round"
                    />

                    {/* Circles on Expected points */}
                    {forecastedData.map((d, i) => {
                      const cx = (i / 5) * 460 + 20;
                      const cy = 160 - (d.expected / maxForecastValue) * 130;
                      return (
                        <circle 
                          key={i} 
                          cx={cx} 
                          cy={cy} 
                          r="4.5" 
                          fill="#ffffff" 
                          stroke="#2563eb" 
                          strokeWidth="2.5" 
                        />
                      );
                    })}
                  </svg>

                  {/* Labels under SVG */}
                  <div className="flex justify-between px-3 text-[9px] font-mono font-semibold text-slate-400 mt-2">
                    {forecastedData.map((d, i) => (
                      <span key={i}>{d.month}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 font-mono mt-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Forecasting incorporates seasonal coefficients and historic closing logs automatically.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL & CAMPAIGNS PERFORMANCE */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          
          {/* Subheader selections */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Campaigns metrics table list */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Active Campaign Conversions Matrix</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 font-mono text-[9px] uppercase text-slate-500 pb-2">
                      <th className="pb-2">Campaign Name</th>
                      <th className="pb-2">Channel</th>
                      <th className="pb-2 text-right">Sent</th>
                      <th className="pb-2 text-right">Open Rate</th>
                      <th className="pb-2 text-right">Reply Rate</th>
                      <th className="pb-2 text-right">Conv. Rate</th>
                      <th className="pb-2 text-right">Deals Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {campaignsData.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-850/30 transition-colors">
                        <td className="py-3 font-semibold text-slate-900 dark:text-white">{c.name}</td>
                        <td className="py-3 font-mono text-[10px]">{c.type}</td>
                        <td className="py-3 text-right font-mono font-medium">{c.sent}</td>
                        <td className="py-3 text-right font-mono text-blue-600 dark:text-blue-400 font-semibold">{c.openRate}%</td>
                        <td className="py-3 text-right font-mono text-purple-600 dark:text-purple-400 font-semibold">{c.replyRate}%</td>
                        <td className="py-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{c.conversionRate}%</td>
                        <td className="py-3 text-right font-mono text-slate-900 dark:text-slate-150">₹{c.revenue.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Email Performance diagnostics (Open Rate, Reply Rate, Conversions radial meters) */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-blue-500" /> Channel Metrics Diagnostic
                </h3>

                <div className="flex items-center justify-around my-4">
                  {/* Radial 1 */}
                  <div className="text-center">
                    <svg className="w-16 h-16" viewBox="0 0 36 36">
                      <path className="text-slate-100 dark:text-slate-800" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="text-blue-600" strokeDasharray="68, 100" strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <text x="18" y="21" className="text-[8px] font-mono font-bold fill-slate-800 dark:fill-slate-100" textAnchor="middle">68%</text>
                    </svg>
                    <span className="text-[10px] font-semibold text-slate-500 mt-1 block">Open Rate</span>
                  </div>

                  {/* Radial 2 */}
                  <div className="text-center">
                    <svg className="w-16 h-16" viewBox="0 0 36 36">
                      <path className="text-slate-100 dark:text-slate-800" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="text-purple-500" strokeDasharray="24, 100" strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <text x="18" y="21" className="text-[8px] font-mono font-bold fill-slate-800 dark:fill-slate-100" textAnchor="middle">24%</text>
                    </svg>
                    <span className="text-[10px] font-semibold text-slate-500 mt-1 block">Reply Rate</span>
                  </div>

                  {/* Radial 3 */}
                  <div className="text-center">
                    <svg className="w-16 h-16" viewBox="0 0 36 36">
                      <path className="text-slate-100 dark:text-slate-800" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="text-emerald-500" strokeDasharray="9, 100" strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <text x="18" y="21" className="text-[8px] font-mono font-bold fill-slate-800 dark:fill-slate-100" textAnchor="middle">8.9%</text>
                    </svg>
                    <span className="text-[10px] font-semibold text-slate-500 mt-1 block">Conversion</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 rounded-lg text-[10px] text-slate-500 dark:text-slate-400 space-y-1 mt-3">
                <span className="font-semibold block text-slate-700 dark:text-slate-300">Vesper Diagnostic Notes:</span>
                <p>Campaign open rates improved by <strong className="text-emerald-600">+14%</strong> after shifting to localized Indian-standard SMTP delivery clusters.</p>
              </div>
            </div>
          </div>

          {/* Interactive AI Subject Line Analyzer */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-500 animate-spin" /> Subject Line Evaluator & Copy Optimizer (Vinci AI Engine)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Type your draft subject line. Vinci Agent will run regression simulations to evaluate delivery success scoring.
              </p>
            </div>

            <form onSubmit={handleDiagnoseSubject} className="flex gap-2">
              <input 
                type="text" 
                value={customSubjectLine}
                onChange={(e) => setCustomSubjectLine(e.target.value)}
                placeholder="e.g. Quick question regarding Fintech CRM integration in Bangalore"
                className="flex-grow bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs px-3 py-2 rounded-lg font-medium text-slate-900 dark:text-white"
              />
              <button 
                type="submit"
                disabled={isDiagnosing || !customSubjectLine.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDiagnosing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                Analyze Copy
              </button>
            </form>

            {diagnosedResult && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl animate-fade-in">
                
                {/* Score indicators */}
                <div className="md:col-span-5 flex justify-around items-center border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 pb-3 md:pb-0 md:pr-4">
                  <div className="text-center">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Est. Open Prob</span>
                    <h4 className={`text-2xl font-bold font-mono mt-1 ${
                      diagnosedResult.openProb >= 75 ? 'text-emerald-500' : diagnosedResult.openProb >= 50 ? 'text-amber-500' : 'text-red-500'
                    }`}>{diagnosedResult.openProb}%</h4>
                  </div>

                  <div className="text-center">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Est. Reply Rate</span>
                    <h4 className={`text-2xl font-bold font-mono mt-1 ${
                      diagnosedResult.replyProb >= 25 ? 'text-emerald-500' : diagnosedResult.replyProb >= 15 ? 'text-amber-500' : 'text-red-500'
                    }`}>{diagnosedResult.replyProb}%</h4>
                  </div>

                  <div className="text-center">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Spam Rating</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold block mt-2 ${
                      diagnosedResult.verdict === 'Excellent' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950' : 
                      diagnosedResult.verdict === 'Mediocre' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950' : 'bg-red-50 text-red-600 dark:bg-red-950'
                    }`}>
                      {diagnosedResult.verdict}
                    </span>
                  </div>
                </div>

                {/* Optimizations tips */}
                <div className="md:col-span-7 flex flex-col justify-center pl-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-350">
                  <span className="font-bold font-mono text-[10px] text-indigo-500 uppercase tracking-wide">Vinci AI Optimization Tips:</span>
                  <ul className="list-disc list-inside space-y-1">
                    {diagnosedResult.tips.map((t: string, i: number) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MEETINGS & LEAD SOURCES */}
      {activeTab === 'meetings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Sourced Lead channels */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-blue-500" /> Lead Generation Sources Summary
            </h3>

            <div className="space-y-4">
              {leadSources.map((s, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                      {s.source}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Sourced Leads: {s.count} ({s.share}%)</span>
                  </div>

                  <div className="text-right space-y-0.5">
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">CAC: ₹{s.cac.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">{s.quality} Quality</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Booked meetings log */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Scheduled Google Meet & Demo Logs</h3>
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-600 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
                94.7% Show Rate
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 font-mono text-[9px] uppercase text-slate-500 pb-2">
                    <th className="pb-2">Client Company</th>
                    <th className="pb-2">Scheduled Slot (INR Time)</th>
                    <th className="pb-2">Assigned Host</th>
                    <th className="pb-2">Lead Source Channel</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {recentMeetings.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-850/30 transition-colors">
                      <td className="py-3 font-semibold text-slate-900 dark:text-white">{m.client}</td>
                      <td className="py-3 font-mono text-slate-500 dark:text-slate-300">{m.date}</td>
                      <td className="py-3 font-medium text-slate-700 dark:text-slate-200">{m.host}</td>
                      <td className="py-3 font-mono text-[10px] text-slate-400">{m.source}</td>
                      <td className="py-3 text-right">
                        <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full ${
                          m.status === 'CONFIRMED' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950' : 
                          m.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950' : 'bg-amber-50 text-amber-600 dark:bg-amber-950'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* AI & SDR PERFORMANCE */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          
          {/* Comparative analysis panels */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Outbound reps (SDRs) lists */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Team Outbound Efficiency Leaderboard</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 font-mono text-[9px] uppercase text-slate-500 pb-2">
                      <th className="pb-2">Outbound Rep</th>
                      <th className="pb-2 text-right">Tasks Handled</th>
                      <th className="pb-2 text-right">Closed Deals</th>
                      <th className="pb-2 text-right">Attributed Sales</th>
                      <th className="pb-2 text-right">Avg Response Velocity</th>
                      <th className="pb-2 text-right">Quality Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {teamSdrPerformance.map((t, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-850/30 transition-colors">
                        <td className="py-3 flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${t.role.includes('AI') ? 'bg-indigo-500 animate-pulse' : 'bg-slate-400'}`} />
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white block">{t.name}</span>
                            <span className="text-[9px] font-mono text-slate-400 uppercase">{t.role}</span>
                          </div>
                        </td>
                        <td className="py-3 text-right font-mono font-semibold">{t.tasks.toLocaleString()}</td>
                        <td className="py-3 text-right font-mono text-slate-900 dark:text-white font-bold">{t.closed}</td>
                        <td className="py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{t.revenue.toLocaleString('en-IN')}</td>
                        <td className="py-3 text-right font-mono text-slate-500 dark:text-slate-400">{t.speed}</td>
                        <td className="py-3 text-right font-mono text-indigo-600 dark:text-indigo-400 font-bold">{t.rating}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Fleet statistics */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-blue-500 animate-spin" /> Autonomous AI Agents Metrics
              </h3>

              <div className="space-y-3.5">
                {aiAgentPerformance.map((ag, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
                        {ag.agent}
                        <span className="text-[8px] font-mono bg-blue-50 text-blue-600 dark:bg-blue-950 px-1 rounded">{ag.status}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono uppercase">{ag.task}</span>
                    </div>

                    <div className="text-right space-y-0.5 text-xs">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">Acc: <span className="text-emerald-600 dark:text-emerald-400">{ag.accuracy}</span></div>
                      <div className="text-[9px] font-mono text-indigo-600 dark:text-indigo-400">Saved: {ag.costSaved}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MONTHLY EXPORTS SUITE */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Configure Report compilation */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-6">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-blue-500" /> Report Packager Configuration
              </h3>
              <p className="text-[11px] text-slate-500">
                Choose months and select target modules to compile into an exportable analytical report.
              </p>
            </div>

            {/* Target month selection */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-350 block">Target Report Period</label>
              <select
                value={pdfReportMonth}
                onChange={(e) => setPdfReportMonth(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="July 2026">July 2026 (Active Period)</option>
                <option value="June 2026">June 2026 (Historical)</option>
                <option value="Q2 Consolidated">Q2 Consolidated Summary</option>
              </select>
            </div>

            {/* Choose components */}
            <div className="space-y-3">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-350 block">Modules to include</label>
              
              <div className="space-y-2.5 text-xs font-medium text-slate-800 dark:text-slate-200">
                {[
                  { id: 'revenue', label: 'Revenue & Forecasting estimates' },
                  { id: 'campaigns', label: 'Campaign metrics & CTR channels' },
                  { id: 'meetings', label: 'Meetings logs & attendance checks' },
                  { id: 'sources', label: 'Lead Source breakdown' },
                  { id: 'team', label: 'AI Fleet vs SDR performance metrics' },
                ].map((m) => (
                  <label key={m.id} className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-850/40 border border-slate-150 dark:border-slate-850 rounded-lg cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={pdfIncludedModules[m.id as keyof typeof pdfIncludedModules]}
                      onChange={() => setPdfIncludedModules(prev => ({ ...prev, [m.id]: !prev[m.id as keyof typeof pdfIncludedModules] }))}
                      className="rounded border-slate-300 dark:border-slate-700 text-blue-600 w-4 h-4 cursor-pointer"
                    />
                    <span>{m.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Simulation compiler step */}
            {isCompiling && (
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2 animate-pulse">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="font-bold text-blue-600 flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Compiling Report Period...
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{compileProgress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${compileProgress}%` }} />
                </div>
                <div className="text-[9px] font-mono text-slate-500 dark:text-slate-400 truncate">{compileStepText}</div>
              </div>
            )}

            {/* Action compilation launch button */}
            <button 
              onClick={handleTriggerCompilation}
              disabled={isCompiling}
              className="w-full bg-slate-950 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs py-2.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isCompiling ? 'animate-spin' : ''}`} /> Run Diagnostic Packager compiler
            </button>
          </div>

          {/* Results exports & compiled resources */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Compiled Analytics & Exporters
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Verifiably secured (SHA-256)</span>
              </div>

              {readyReport ? (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl space-y-3 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-950 dark:text-white">Enterprise Report Compiled Successfully</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">SHA256: <code className="font-mono font-bold">{readyReport.checksum.slice(0, 24)}...</code></p>
                      <ul className="text-[10px] font-mono text-slate-500 mt-2 list-disc list-inside">
                        <li>Month: {pdfReportMonth}</li>
                        <li>Compiled Date: {readyReport.date}</li>
                        <li>System Owner: {readyReport.recipient}</li>
                      </ul>
                    </div>
                  </div>

                  {/* Actions to Export PDF and Excel */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-emerald-100 dark:border-emerald-900">
                    <button 
                      onClick={() => setShowPdfModal(true)}
                      className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Export Premium PDF
                    </button>

                    <button 
                      onClick={triggerCsvExport}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Export Excel Spreadsheet
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl font-medium text-xs flex flex-col items-center justify-center gap-3">
                  <FileCode className="w-8 h-8 text-slate-300 animate-pulse" />
                  No packaged report compiled in this turn. Customize parameters on the left and run diagnostic compilation to construct your PDF and Excel structures.
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-850 text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>Report packaging uses atomic client security constraints. System access matches user session: {pdfReportMonth}</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. PREMIUM PRINT-PREVIEW PDF MODAL OVERLAY */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-center items-start overflow-y-auto p-4 animate-fade-in print:bg-white print:p-0">
          <div className="bg-white text-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-150 overflow-hidden flex flex-col justify-between my-8 print:my-0 print:border-0 print:shadow-none print:w-full print:h-full print:rounded-none">
            
            {/* Modal header (HIDDEN on print) */}
            <div className="flex justify-between items-center bg-slate-50 border-b border-slate-150 px-6 py-4 print:hidden">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Printer className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> Enterprise Print & PDF Engine
                </span>
                <h3 className="text-sm font-bold text-slate-950">Pre-compiled Printable Layout Preview</h3>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrintPdf}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg cursor-pointer transition-all flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save PDF
                </button>

                <button 
                  onClick={() => setShowPdfModal(false)}
                  className="p-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-600 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* PRE-PRINT PREVIEW CANVAS (Renders clean white high-contrast paper layout) */}
            <div id="printable-report-canvas" className="p-10 font-sans space-y-8 bg-white text-slate-900 print:p-0">
              
              {/* Report Title block */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">SalesPilot Outbound Enterprise Intelligence</div>
                  <h1 className="text-2xl font-black text-slate-950 tracking-tight">Analytical Briefing: {pdfReportMonth}</h1>
                  <span className="text-[10px] font-mono text-slate-500 block">Sha256 Checksum Verification: <code className="font-bold">sha256-f89a421bc0898fa3910b981f3b82fd56f3e82aa219c08d</code></span>
                </div>

                <div className="text-right text-xs space-y-1">
                  <div className="font-bold uppercase text-slate-950">Horizon Media Group</div>
                  <div className="font-mono text-[10px] text-slate-500">Target User: sohamkharat481@gmail.com</div>
                  <div className="font-mono text-[10px] text-slate-500">Date Compiled: {new Date().toLocaleDateString('en-IN')}</div>
                </div>
              </div>

              {/* SECTION: SUMMARY INTRO */}
              <div className="space-y-3">
                <h2 className="text-sm font-bold font-mono tracking-widest uppercase text-slate-400 border-b border-slate-200 pb-1.5">1. Executive Overview Summary</h2>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  This executive document contains verifiably aggregated multi-channel marketing campaigns and pipeline statistics compiled for Horizon Media Group in {pdfReportMonth}. In this period, outbound performance benchmarks succeeded in meeting targets, driven by autonomous SMTP scheduling optimizations and advanced lead discovery engines.
                </p>
              </div>

              {/* SECTION: REVENUE */}
              {pdfIncludedModules.revenue && (
                <div className="space-y-3">
                  <h2 className="text-sm font-bold font-mono tracking-widest uppercase text-slate-400 border-b border-slate-200 pb-1.5">2. Revenue Telemetry & Outbound Pipeline</h2>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[9px] font-mono text-slate-500 block uppercase">Total Weighted Pipeline</span>
                      <strong className="text-base font-bold font-mono text-slate-950">₹{pipelineStats.totalPipeline.toLocaleString('en-IN')}</strong>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[9px] font-mono text-slate-500 block uppercase">Closed Won ARR</span>
                      <strong className="text-base font-bold font-mono text-slate-950">₹{pipelineStats.wonARR.toLocaleString('en-IN')}</strong>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[9px] font-mono text-slate-500 block uppercase">Average Ticket Value</span>
                      <strong className="text-base font-bold font-mono text-slate-950">₹{pipelineStats.averageDeal.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: CAMPAIGNS */}
              {pdfIncludedModules.campaigns && (
                <div className="space-y-3 page-break-before">
                  <h2 className="text-sm font-bold font-mono tracking-widest uppercase text-slate-400 border-b border-slate-200 pb-1.5">3. Outbound Email & LinkedIn Campaigns</h2>
                  
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-950 font-mono text-[9px] uppercase text-slate-600">
                        <th className="pb-1 text-left">Campaign Name</th>
                        <th className="pb-1 text-left">Channel</th>
                        <th className="pb-1 text-right">Sent Count</th>
                        <th className="pb-1 text-right">Open Rate</th>
                        <th className="pb-1 text-right">Reply Rate</th>
                        <th className="pb-1 text-right">Conversion Rate</th>
                        <th className="pb-1 text-right">Revenue attribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {campaignsData.map((c, i) => (
                        <tr key={i}>
                          <td className="py-2 text-left font-semibold text-slate-950">{c.name}</td>
                          <td className="py-2 text-left font-mono">{c.type}</td>
                          <td className="py-2 text-right font-mono">{c.sent}</td>
                          <td className="py-2 text-right font-mono text-slate-950 font-semibold">{c.openRate}%</td>
                          <td className="py-2 text-right font-mono text-slate-950 font-semibold">{c.replyRate}%</td>
                          <td className="py-2 text-right font-mono text-slate-950 font-semibold">{c.conversionRate}%</td>
                          <td className="py-2 text-right font-mono text-slate-950">₹{c.revenue.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SECTION: MEETINGS */}
              {pdfIncludedModules.meetings && (
                <div className="space-y-3">
                  <h2 className="text-sm font-bold font-mono tracking-widest uppercase text-slate-400 border-b border-slate-200 pb-1.5">4. Scheduled Demo Appointments Log</h2>
                  
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-950 font-mono text-[9px] uppercase text-slate-600">
                        <th className="pb-1 text-left">Client Account</th>
                        <th className="pb-1 text-left">Scheduled Slot (INR)</th>
                        <th className="pb-1 text-left">SDR Host</th>
                        <th className="pb-1 text-left">Lead Source Channel</th>
                        <th className="pb-1 text-right">Current Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {recentMeetings.map((m, i) => (
                        <tr key={i}>
                          <td className="py-2 text-left font-semibold text-slate-950">{m.client}</td>
                          <td className="py-2 text-left font-mono">{m.date}</td>
                          <td className="py-2 text-left font-medium">{m.host}</td>
                          <td className="py-2 text-left font-mono text-slate-500">{m.source}</td>
                          <td className="py-2 text-right font-mono text-slate-950 font-bold">{m.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SECTION: SOURCES */}
              {pdfIncludedModules.sources && (
                <div className="space-y-3 page-break-before">
                  <h2 className="text-sm font-bold font-mono tracking-widest uppercase text-slate-400 border-b border-slate-200 pb-1.5">5. Lead Generation Sources Breakdown</h2>
                  
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-950 font-mono text-[9px] uppercase text-slate-600">
                        <th className="pb-1 text-left">Channel Identifier</th>
                        <th className="pb-1 text-right">Lead Count</th>
                        <th className="pb-1 text-right">Percent Share</th>
                        <th className="pb-1 text-right">Acquisition CAC</th>
                        <th className="pb-1 text-right">Average Quality</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {leadSources.map((s, i) => (
                        <tr key={i}>
                          <td className="py-2 text-left font-semibold text-slate-950">{s.source}</td>
                          <td className="py-2 text-right font-mono">{s.count}</td>
                          <td className="py-2 text-right font-mono">{s.share}%</td>
                          <td className="py-2 text-right font-mono">₹{s.cac.toLocaleString('en-IN')}</td>
                          <td className="py-2 text-right font-bold text-slate-950">{s.quality}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SECTION: TEAM */}
              {pdfIncludedModules.team && (
                <div className="space-y-3">
                  <h2 className="text-sm font-bold font-mono tracking-widest uppercase text-slate-400 border-b border-slate-200 pb-1.5">6. Sales force Comparative performance</h2>
                  
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-950 font-mono text-[9px] uppercase text-slate-600">
                        <th className="pb-1 text-left">SDR/AI Agent Identifier</th>
                        <th className="pb-1 text-left">Role Class</th>
                        <th className="pb-1 text-right">Tasks Sourced</th>
                        <th className="pb-1 text-right">Closed Deals</th>
                        <th className="pb-1 text-right">Attributed Pipeline</th>
                        <th className="pb-1 text-right">Response Speed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {teamSdrPerformance.map((t, i) => (
                        <tr key={i}>
                          <td className="py-2 text-left font-semibold text-slate-950">{t.name}</td>
                          <td className="py-2 text-left font-mono">{t.role}</td>
                          <td className="py-2 text-right font-mono">{t.tasks.toLocaleString()}</td>
                          <td className="py-2 text-right font-mono font-bold text-slate-950">{t.closed}</td>
                          <td className="py-2 text-right font-mono font-bold text-slate-950">₹{t.revenue.toLocaleString('en-IN')}</td>
                          <td className="py-2 text-right font-mono">{t.speed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Verification & Footnotes */}
              <div className="pt-8 border-t border-slate-300 flex justify-between items-center text-[10px] font-mono text-slate-500">
                <span>Verifiably Authenticated By SalesPilot System Owner</span>
                <span>Page 1 of 1</span>
              </div>
            </div>

            {/* Modal footer (HIDDEN on print) */}
            <div className="flex justify-end bg-slate-50 border-t border-slate-150 px-6 py-4 gap-2 print:hidden">
              <button 
                onClick={() => setShowPdfModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-150 font-semibold text-xs rounded-lg cursor-pointer transition-all"
              >
                Close Preview
              </button>

              <button 
                onClick={handlePrintPdf}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg cursor-pointer transition-all flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                Trigger print layout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
