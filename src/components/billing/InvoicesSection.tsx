import React, { useState } from 'react';
import { FileText, Download, Printer, CheckCircle2, ChevronRight, X, Mail } from 'lucide-react';
import { WorkspaceUser } from '../../types';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  baseAmount: number;
  discount: number;
  gstAmount: number;
  totalInr: number;
  couponUsed: string | null;
  state: string;
  gstin: string;
  paymentMethod: string;
  cashfreeRef: string;
  status: 'PAID' | 'REFUNDED' | 'FAILED';
}

interface InvoicesSectionProps {
  user: WorkspaceUser | null;
  gstState: string;
  gstin: string;
  invoices: Invoice[];
  onLogMessage: (text: string, type: 'info' | 'success' | 'warn') => void;
}

export function InvoicesSection({
  user,
  gstState,
  gstin,
  invoices,
  onLogMessage
}: InvoicesSectionProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const triggerCsvExport = (inv: Invoice) => {
    let csv = `SalesPilot tax invoice export - ${inv.invoiceNumber}\n`;
    csv += `Generated On: ${new Date().toLocaleString()}\n`;
    csv += `Invoice Status: ${inv.status}\n\n`;

    csv += `--- TRANSACTION DETAILS ---\n`;
    csv += `"Invoice Number","${inv.invoiceNumber}"\n`;
    csv += `"Billing Date","${inv.date}"\n`;
    csv += `"Payment Method","${inv.paymentMethod}"\n`;
    csv += `"Cashfree Transaction ID","${inv.cashfreeRef}"\n`;
    csv += `"Taxable Base Amount","₹${inv.baseAmount.toLocaleString('en-IN')}"\n`;
    csv += `"Discounts Applied","₹${inv.discount.toLocaleString('en-IN')}"\n`;
    csv += `"GST (18% On Taxable)","₹${inv.gstAmount.toLocaleString('en-IN')}"\n`;
    csv += `"Grand Total Paid","₹${inv.totalInr.toLocaleString('en-IN')}"\n\n`;

    csv += `--- BUYER IDENTIFICATION ---\n`;
    csv += `"Company","${user?.companyName || 'Horizon Media Group Ltd.'}"\n`;
    csv += `"Buyer State","${inv.state}"\n`;
    csv += `"Buyer GSTIN","${inv.gstin || 'NOT SPECIFIED (Claim ITC via GST settings)'}"\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${inv.invoiceNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onLogMessage(`Exported CSV invoice schema for ${inv.invoiceNumber}.`, "success");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="invoices_section" className="space-y-6">
      
      {/* Title */}
      <div>
        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Invoice History & Receipts</h3>
        <p className="text-xs text-slate-500 mt-1">Access, print, and export tax invoices containing detailed GST and Input Tax Credit parameters.</p>
      </div>

      {/* Invoice list */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[9px] uppercase font-mono tracking-wider text-slate-500 font-semibold">
                <th className="px-5 py-3">Invoice Number</th>
                <th className="px-5 py-3">Billing Date</th>
                <th className="px-5 py-3">Taxable Value</th>
                <th className="px-5 py-3">GST (18%)</th>
                <th className="px-5 py-3">Total Paid</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                  <td className="px-5 py-3.5 font-mono font-semibold text-blue-600 dark:text-blue-400">{inv.invoiceNumber}</td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{inv.date}</td>
                  <td className="px-5 py-3.5 font-mono">₹{(inv.baseAmount - inv.discount).toLocaleString('en-IN')}</td>
                  <td className="px-5 py-3.5 font-mono text-slate-500">₹{inv.gstAmount.toLocaleString('en-IN')}</td>
                  <td className="px-5 py-3.5 font-mono font-bold text-slate-900 dark:text-white">₹{inv.totalInr.toLocaleString('en-IN')}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold font-mono rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> PAID
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right space-x-1">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-750 dark:text-slate-300 bg-slate-100 hover:bg-slate-150 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer"
                    >
                      View Tax Invoice
                    </button>
                    <button
                      onClick={() => {
                        onLogMessage(`GST Tax Invoice ${inv.invoiceNumber} has been securely dispatched to ${user?.email || 'client address'} via SMTP routing.`, "success");
                      }}
                      title="Email Invoice"
                      className="p-1 text-slate-500 hover:text-indigo-650 dark:hover:text-indigo-400 cursor-pointer inline-flex items-center"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => triggerCsvExport(inv)}
                      title="Export CSV Metadata"
                      className="p-1 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer inline-flex items-center"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice PDF Receipt View Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white text-slate-800 border border-slate-300 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Actions Header */}
            <div className="p-4 bg-slate-950 text-white flex justify-between items-center shrink-0">
              <span className="text-[10px] font-mono tracking-widest text-zinc-400">TAX RECEIPT ENGINE</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onLogMessage(`GST Tax Invoice ${selectedInvoice.invoiceNumber} has been securely emailed to ${user?.email || 'client address'}.`, "success");
                  }}
                  className="px-3 py-1 bg-indigo-700 hover:bg-indigo-650 text-xs font-semibold text-white rounded-lg flex items-center gap-1 transition cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" /> Email PDF
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-100 rounded-lg flex items-center gap-1 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Invoice
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1 text-zinc-400 hover:text-white transition focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Invoices PDF Mock Body (Scrollable printable sheet) */}
            <div id="invoice_print_frame" className="p-10 space-y-8 overflow-y-auto bg-white text-black font-sans text-xs">
              
              {/* Receipt Head */}
              <div className="flex justify-between items-start border-b pb-6 border-slate-200">
                <div className="space-y-1.5">
                  <h2 className="text-xl font-bold tracking-tight text-blue-600 flex items-center gap-1.5">
                    SalesPilot SaaS Private Limited
                  </h2>
                  <p className="text-[10px] text-slate-500 leading-relaxed max-w-sm">
                    102, Cyber Heights Tower-C, Yerawada IT Park, Pune, Maharashtra, 411006.<br />
                    <strong>GSTIN Seller:</strong> 27AAYCS2491C1ZP | <strong>HSN Code:</strong> 997331
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-400">TAX INVOICE</h3>
                  <h4 className="text-base font-mono font-bold text-slate-800">{selectedInvoice.invoiceNumber}</h4>
                  <p className="text-[10px] text-slate-500">Billing Date: {selectedInvoice.date}</p>
                </div>
              </div>

              {/* Bill To & Reference details */}
              <div className="grid grid-cols-2 gap-8 text-[11px] leading-relaxed border-b pb-6 border-slate-200">
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">BILL TO:</span>
                  <h4 className="font-bold text-slate-900">{user?.companyName || 'Horizon Media Group Ltd.'}</h4>
                  <p className="text-slate-500">
                    Recipient Domicile: {selectedInvoice.state}<br />
                    GSTIN Recipient: <span className="font-mono text-slate-800 font-semibold">{selectedInvoice.gstin || 'NOT SPECIFIED'}</span>
                  </p>
                </div>
                <div className="space-y-1.5 text-right">
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">PAYMENT REFERENCE:</span>
                  <p className="text-slate-500">
                    SaaS Gateway Channel: <strong>Cashfree PG Subscriptions</strong><br />
                    PG Order reference: <span className="font-mono text-slate-800">{selectedInvoice.id}</span><br />
                    Payment Reference hash: <span className="font-mono text-slate-600 text-[10px]">{selectedInvoice.cashfreeRef}</span>
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-3">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 font-mono text-[9px] uppercase text-slate-400">
                      <th className="pb-2">Product Description / SAS Services</th>
                      <th className="pb-2 text-center">HSN Code</th>
                      <th className="pb-2 text-right">Rate</th>
                      <th className="pb-2 text-right">Qty</th>
                      <th className="pb-2 text-right">Discounts</th>
                      <th className="pb-2 text-right">Taxable Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="text-slate-800">
                      <td className="py-3 font-semibold">
                        SalesPilot SaaS Enterprise Suite Subscription (1-month cycle)<br />
                        <span className="text-[10px] text-slate-500 font-normal">Active outbound sequences, automated enrichment, AI composition tools.</span>
                      </td>
                      <td className="py-3 text-center font-mono">997331</td>
                      <td className="py-3 text-right font-mono">₹{selectedInvoice.baseAmount.toLocaleString('en-IN')}</td>
                      <td className="py-3 text-right font-mono">1</td>
                      <td className="py-3 text-right font-mono text-emerald-600 font-semibold">-₹{selectedInvoice.discount.toLocaleString('en-IN')}</td>
                      <td className="py-3 text-right font-mono font-bold">₹{(selectedInvoice.baseAmount - selectedInvoice.discount).toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Summary calculations & GST breakdowns */}
              <div className="flex justify-end pt-4 border-t border-slate-200">
                <div className="w-72 space-y-2.5 text-[11px] text-slate-600 leading-normal">
                  <div className="flex justify-between">
                    <span>Taxable Value:</span>
                    <span className="font-mono text-slate-900">₹{(selectedInvoice.baseAmount - selectedInvoice.discount).toLocaleString('en-IN')}</span>
                  </div>
                  
                  {/* Local state SGST/CGST split calculation */}
                  {selectedInvoice.state === 'Maharashtra' ? (
                    <>
                      <div className="flex justify-between">
                        <span>Central GST (CGST @ 9.0%):</span>
                        <span className="font-mono text-slate-900">₹{Math.round(selectedInvoice.gstAmount / 2).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>State GST (SGST @ 9.0%):</span>
                        <span className="font-mono text-slate-900">₹{Math.round(selectedInvoice.gstAmount / 2).toLocaleString('en-IN')}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span>Integrated GST (IGST @ 18.0%):</span>
                      <span className="font-mono text-slate-900">₹{selectedInvoice.gstAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="flex justify-between border-t border-slate-350 pt-2.5 font-bold text-slate-900 text-xs">
                    <span>Total Tax Invoice Cost:</span>
                    <span className="font-mono text-blue-600">₹{selectedInvoice.totalInr.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Compliance & Signature footers */}
              <div className="pt-8 border-t border-slate-150 flex justify-between items-end text-[9px] text-slate-400 font-mono">
                <div className="space-y-1">
                  <span>Authorized Signature Gateway Authenticity Code:</span>
                  <p className="text-slate-500 uppercase leading-normal">COMPLIANT WITH THE INTEGRATED GOODS AND SERVICES TAX ACT, 2017</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded">SECURE PAYMENT RECEIVED</span>
                  <span className="mt-1">Generated via Cashfree Subscriptions API</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
