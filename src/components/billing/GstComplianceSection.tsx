import React, { useState } from 'react';
import { ShieldCheck, Info, FileText, Check } from 'lucide-react';

interface GstComplianceSectionProps {
  gstin: string;
  setGstin: (val: string) => void;
  gstState: string;
  setGstState: (val: string) => void;
  onLogMessage: (text: string, type: 'info' | 'success' | 'warn') => void;
}

export const INDIAN_STATES = [
  { code: '27', name: 'Maharashtra' },
  { code: '07', name: 'Delhi' },
  { code: '29', name: 'Karnataka' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '36', name: 'Telangana' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '19', name: 'West Bengal' },
  { code: '24', name: 'Gujarat' },
  { code: '18', name: 'Assam' },
  { code: '03', name: 'Punjab' }
];

export function GstComplianceSection({
  gstin,
  setGstin,
  gstState,
  setGstState,
  onLogMessage
}: GstComplianceSectionProps) {
  const [localGstin, setLocalGstin] = useState(gstin);
  const [gstSaved, setGstSaved] = useState(false);

  const handleSaveGst = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple 15 character alphanumeric GSTIN validator
    const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    const upperGstin = localGstin.toUpperCase().trim();
    
    if (upperGstin && !regex.test(upperGstin)) {
      onLogMessage("Invalid Indian GSTIN Format. Format must correspond to standard 15-character structure (e.g., 27AAPCS1429M1Z5).", "warn");
      return;
    }

    setGstin(upperGstin);
    setGstSaved(true);
    onLogMessage(`GST Information updated. GSTIN: ${upperGstin || 'None'} (${gstState}).`, "success");
    setTimeout(() => setGstSaved(false), 2000);
  };

  const isIntraState = gstState === 'Maharashtra';

  return (
    <div id="gst_compliance_section" className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-6">
      
      {/* Title */}
      <div>
        <h3 className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4.5 h-4.5 text-blue-600" /> Indian GST (Goods & Services Tax) Compliance
        </h3>
        <p className="text-xs text-slate-500 mt-1">Provide your corporate billing credentials to claim 18% Input Tax Credits (ITC) on all invoices.</p>
      </div>

      <form onSubmit={handleSaveGst} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        
        {/* GSTIN Field */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-mono text-slate-450 dark:text-slate-500 uppercase">GSTIN (15-digit)</label>
          <input 
            type="text" 
            value={localGstin}
            onChange={(e) => setLocalGstin(e.target.value)}
            placeholder="e.g. 27AAPCS1429M1Z5"
            maxLength={15}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs px-3 py-2 rounded-lg font-medium text-slate-900 dark:text-white uppercase placeholder:normal-case focus:outline-none focus:bg-white"
          />
        </div>

        {/* State Selection */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-mono text-slate-450 dark:text-slate-500 uppercase">State Domicile</label>
          <select
            value={gstState}
            onChange={(e) => setGstState(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs px-3 py-2 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            {INDIAN_STATES.map((s) => (
              <option key={s.code} value={s.name}>{s.name} ({s.code})</option>
            ))}
          </select>
        </div>

        {/* Action Button */}
        <button
          id="btn_save_gst_info"
          type="submit"
          className="w-full py-2 bg-slate-950 dark:bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-900 dark:hover:bg-slate-700 transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          {gstSaved ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" /> GST Information Saved
            </>
          ) : (
            <>Apply GST Credentials</>
          )}
        </button>

      </form>

      {/* Tax Breakdown Preview */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-3">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-indigo-500" /> Auto Tax Breakdown Rule
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-500">
          <div className="space-y-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">GST Domicile Mode</span>
            <p className="leading-relaxed">
              SalesPilot is domiciled in <strong className="text-slate-800 dark:text-slate-250">Maharashtra</strong>. 
              Billing state is matched against your chosen State Domicile to identify CGST/SGST or IGST automatically.
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg flex flex-col justify-center space-y-1.5">
            <div className="flex justify-between items-center text-[11px]">
              <span>Active Tax Channel:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{isIntraState ? 'CGST + SGST (Intra-state)' : 'IGST (Inter-state)'}</span>
            </div>
            
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-450 dark:text-slate-500">
              {isIntraState ? (
                <>
                  <span>CGST (9.0%) + SGST (9.0%)</span>
                  <span>18.00%</span>
                </>
              ) : (
                <>
                  <span>IGST (18.0%)</span>
                  <span>18.00%</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
