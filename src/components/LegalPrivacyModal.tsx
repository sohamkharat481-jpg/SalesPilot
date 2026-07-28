import React, { useState } from 'react';
import { Shield, FileText, Lock, X } from 'lucide-react';

interface LegalPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LegalPrivacyModal({ isOpen, onClose }: LegalPrivacyModalProps) {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>('privacy');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Legal & Governance Documents
              </h2>
              <p className="text-xs text-slate-500">SalesPilot Enterprise Terms of Service & Privacy Statement</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-semibold gap-4">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`pb-2 border-b-2 transition ${activeTab === 'privacy' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
          >
            Privacy Policy & GDPR Statement
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`pb-2 border-b-2 transition ${activeTab === 'terms' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
          >
            Master Terms of Service
          </button>
        </div>

        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-3 font-normal max-h-96 overflow-y-auto pr-2">
          {activeTab === 'privacy' ? (
            <>
              <h4 className="font-bold text-slate-900 dark:text-white">1. Data Collection & Processing</h4>
              <p>SalesPilot Inc. processes customer data exclusively to deliver autonomous SDR outreach, CRM intelligence, and workflow execution. All data at rest is encrypted using AES-256 and in transit via TLS 1.3.</p>

              <h4 className="font-bold text-slate-900 dark:text-white">2. AI & Machine Learning Isolation</h4>
              <p>Customer CRM records and proprietary email communications are never used to train generalized foundation models without explicit opt-in. AI memory stores are isolated strictly per tenant workspace.</p>

              <h4 className="font-bold text-slate-900 dark:text-white">3. European Union GDPR Compliance</h4>
              <p>Under GDPR Articles 15, 17, and 20, users retain full rights of access, data portability, and erasure ("Right to be Forgotten"). Data export packages can be downloaded on demand.</p>
            </>
          ) : (
            <>
              <h4 className="font-bold text-slate-900 dark:text-white">1. Enterprise Subscription Terms</h4>
              <p>SalesPilot provided under this Master Services Agreement grants non-exclusive, non-transferable access to the AI Sales Operating System based on chosen plan limits and credit tiers.</p>

              <h4 className="font-bold text-slate-900 dark:text-white">2. SLA & Uptime Guarantee</h4>
              <p>Enterprise tier customers receive a 99.95% uptime SLA guarantee with 24/7 dedicated engineering support and incident resolution.</p>

              <h4 className="font-bold text-slate-900 dark:text-white">3. Acceptable Use & Outbound Limits</h4>
              <p>Customers must strictly comply with CAN-SPAM, TCPA, and local anti-spam regulations when executing outbound prospecting campaigns.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
