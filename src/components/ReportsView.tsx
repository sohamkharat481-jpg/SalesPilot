import React, { useState, useEffect } from 'react';
import { 
  FileText, Calendar, ShieldCheck, Download, Trash2, CheckCircle2, 
  Loader2, Filter, Settings, FileSpreadsheet, RefreshCw, Layers
} from 'lucide-react';

interface HistoricReport {
  id: string;
  name: string;
  format: 'PDF' | 'CSV' | 'JSON';
  date: string;
  size: string;
  modulesIncluded: string[];
}

export function ReportsView() {
  const [includeLeads, setIncludeLeads] = useState(true);
  const [includeCampaigns, setIncludeCampaigns] = useState(true);
  const [includeDeals, setIncludeDeals] = useState(true);
  const [includeMeetings, setIncludeMeetings] = useState(false);
  
  const [reportFormat, setReportFormat] = useState<'PDF' | 'CSV' | 'JSON'>('PDF');
  const [reportScope, setReportScope] = useState('ALL');

  const [isCompiling, setIsCompiling] = useState(false);
  const [compileProgress, setCompileProgress] = useState(0);
  const [compileStepText, setCompileStepText] = useState('');
  const [newlyCreatedReport, setNewlyCreatedReport] = useState<HistoricReport | null>(null);

  const [reports, setReports] = useState<HistoricReport[]>([
    { id: 'rep-01', name: 'SalesPilot_Q2_Outbound_Summary', format: 'PDF', date: '2026-06-28 14:32', size: '2.4 MB', modulesIncluded: ['Leads', 'Campaigns', 'Deals'] },
    { id: 'rep-02', name: 'Active_Prospects_Export_July', format: 'CSV', date: '2026-07-02 09:15', size: '840 KB', modulesIncluded: ['Leads'] },
    { id: 'rep-03', name: 'CRM_Pipeline_Forecast_Metrics', format: 'PDF', date: '2026-07-04 11:40', size: '1.8 MB', modulesIncluded: ['Deals', 'Appointments'] }
  ]);

  const compileSteps = [
    'Parsing active leads database records...',
    'Evaluating campaign sequences click-through data...',
    'Compiling CRM pipeline weighted forecast metrics...',
    'Performing Indian currency localized formatting...',
    'Structuring charts vector layout definitions...',
    'Encrypting document with workspace SHA-256 signatures...',
    'Publishing binary resource object...'
  ];

  // Compile Progress Timer Simulation
  useEffect(() => {
    let timer: any;
    if (isCompiling) {
      timer = setInterval(() => {
        setCompileProgress(prev => {
          const next = prev + Math.floor(Math.random() * 15) + 5;
          
          // Switch step description text periodically
          const stepIndex = Math.min(
            Math.floor((next / 100) * compileSteps.length),
            compileSteps.length - 1
          );
          setCompileStepText(compileSteps[stepIndex]);

          if (next >= 100) {
            clearInterval(timer);
            setIsCompiling(false);
            
            // Create final report
            const newRep: HistoricReport = {
              id: `rep-${Date.now()}`,
              name: `SalesPilot_Custom_Report_${new Date().toISOString().slice(0, 10)}`,
              format: reportFormat,
              date: new Date().toISOString().replace('T', ' ').slice(0, 16),
              size: reportFormat === 'PDF' ? '1.5 MB' : reportFormat === 'CSV' ? '450 KB' : '120 KB',
              modulesIncluded: [
                ...(includeLeads ? ['Leads'] : []),
                ...(includeCampaigns ? ['Campaigns'] : []),
                ...(includeDeals ? ['Deals'] : []),
                ...(includeMeetings ? ['Appointments'] : [])
              ]
            };

            setReports(prev => [newRep, ...prev]);
            setNewlyCreatedReport(newRep);
            return 100;
          }
          return next;
        });
      }, 500);
    }
    return () => clearInterval(timer);
  }, [isCompiling]);

  const handleTriggerCompilation = () => {
    setCompileProgress(0);
    setNewlyCreatedReport(null);
    setIsCompiling(true);
  };

  const handleDeleteReport = (id: string) => {
    setReports(reports.filter(r => r.id !== id));
    if (newlyCreatedReport?.id === id) {
      setNewlyCreatedReport(null);
    }
  };

  const handleDownloadTrigger = (report: HistoricReport) => {
    // Generate simple mock text content
    const content = `SalesPilot Enterprise Workspace Report\nDate: ${report.date}\nFormat: ${report.format}\nModules: ${report.modulesIncluded.join(', ')}\nOrganization: Horizon Media\nStatus: Verified Secured`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.name}.${report.format.toLowerCase()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="reports_view" className="space-y-8 animate-fade-in">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm">
        <div>
          <h2 className="text-xl font-display font-semibold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
            Enterprise Report Suite <span className="text-xs font-mono px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-md border border-indigo-200 dark:border-indigo-900/50">SECURED</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure, generate, and export deep-level metrics from your workspace campaigns and CRM.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Report Customizer Panel */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-display font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4 text-blue-600" /> Report Configuration
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Select telemetry modules to aggregate into your report document.</p>

            <div className="space-y-5">
              {/* Modules selector checks */}
              <div className="space-y-3">
                <label className="block text-[10px] font-mono uppercase text-slate-500 mb-2">Include Modules</label>
                
                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={includeLeads} 
                    onChange={() => setIncludeLeads(!includeLeads)}
                    className="rounded border-slate-300 dark:border-slate-700 text-blue-600 w-4 h-4"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">Leads Database Summary</div>
                    <div className="text-[10px] text-slate-500">Demographics, industry share, and source metrics</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={includeCampaigns} 
                    onChange={() => setIncludeCampaigns(!includeCampaigns)}
                    className="rounded border-slate-300 dark:border-slate-700 text-blue-600 w-4 h-4"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">Campaign Sequence Analytics</div>
                    <div className="text-[10px] text-slate-500">Open rates, replies, CTR, and channel parameters</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={includeDeals} 
                    onChange={() => setIncludeDeals(!includeDeals)}
                    className="rounded border-slate-300 dark:border-slate-700 text-blue-600 w-4 h-4"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">CRM Pipeline weighted values</div>
                    <div className="text-[10px] text-slate-500">Weighted conversions, forecasts, and lost/won parameters</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={includeMeetings} 
                    onChange={() => setIncludeMeetings(!includeMeetings)}
                    className="rounded border-slate-300 dark:border-slate-700 text-blue-600 w-4 h-4"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">Scheduler appointments log</div>
                    <div className="text-[10px] text-slate-500">Scheduled slots, attendee parameters, and meet records</div>
                  </div>
                </label>
              </div>

              {/* Format Select */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Output Format</label>
                  <select 
                    value={reportFormat} 
                    onChange={(e: any) => setReportFormat(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-medium cursor-pointer"
                  >
                    <option value="PDF">Secured PDF Document</option>
                    <option value="CSV">Data-Export spreadsheet (CSV)</option>
                    <option value="JSON">Structured JSON Schema</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Date Range Scope</label>
                  <select 
                    value={reportScope} 
                    onChange={(e: any) => setReportScope(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-medium cursor-pointer"
                  >
                    <option value="ALL">All historic time</option>
                    <option value="MONTH">This current month</option>
                    <option value="WEEK">This past calendar week</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-850 space-y-4">
            {/* Compile Progress Overlay */}
            {isCompiling && (
              <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-900">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Compiling Report...
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{compileProgress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${compileProgress}%` }} />
                </div>
                <div className="text-[9px] font-mono text-slate-500 dark:text-slate-400 truncate">{compileStepText}</div>
              </div>
            )}

            {/* Generated success state */}
            {newlyCreatedReport && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-50">Report compiled successfully!</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Secure SHA256 checksum generated.</p>
                  <button 
                    onClick={() => handleDownloadTrigger(newlyCreatedReport)}
                    className="mt-2.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Download className="w-3 h-3" /> Download Compiled file
                  </button>
                </div>
              </div>
            )}

            <button 
              onClick={handleTriggerCompilation}
              disabled={isCompiling || (!includeLeads && !includeCampaigns && !includeDeals && !includeMeetings)}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isCompiling ? 'animate-spin' : ''}`} /> Generate Enterprise Report
            </button>
          </div>
        </div>

        {/* Archives & Historic Downloads Table */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-display font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> Compiled Archives Log
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Past generated documents and direct download links.</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
              {reports.length} records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-850 text-slate-500 font-mono text-[10px] uppercase">
                  <th className="pb-3 font-semibold">Report Name</th>
                  <th className="pb-3 font-semibold">Format</th>
                  <th className="pb-3 font-semibold">Compiled On</th>
                  <th className="pb-3 font-semibold">Size</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {reports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/20 transition-colors">
                    <td className="py-3.5 pr-2">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        {rep.format === 'PDF' ? <FileText className="w-4 h-4 text-rose-500 shrink-0" /> : <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />}
                        <span className="truncate max-w-[180px]" title={rep.name}>{rep.name}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {rep.modulesIncluded.map((m, idx) => (
                          <span key={idx} className="text-[8px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 px-1 rounded">
                            {m}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        rep.format === 'PDF' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20' :
                        rep.format === 'CSV' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {rep.format}
                      </span>
                    </td>
                    <td className="py-3.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">{rep.date}</td>
                    <td className="py-3.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">{rep.size}</td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => handleDownloadTrigger(rep)}
                          className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded transition cursor-pointer"
                          title="Download document file"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteReport(rep.id)}
                          className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded transition cursor-pointer"
                          title="Delete from log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
