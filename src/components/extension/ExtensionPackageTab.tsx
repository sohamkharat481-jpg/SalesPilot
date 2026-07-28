import React from 'react';
import { Key, Copy, FileText } from 'lucide-react';
import { MANIFEST_JSON, CONTENT_JS } from './extensionManifest';

interface ExtensionPackageTabProps {
  extensionApiKey: string;
  copyToClipboard: (text: string, label: string) => void;
}

export function ExtensionPackageTab({
  extensionApiKey,
  copyToClipboard
}: ExtensionPackageTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
      {/* API KEY & AUTH SETUP */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Key className="w-5 h-5 text-indigo-400" />
          <h3 className="text-xs font-bold text-white uppercase">Extension Security Token</h3>
        </div>

        <p className="text-xs text-slate-400">
          Your extension pairs directly with SalesPilot via this authenticated API key.
        </p>

        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 block">Workspace API Key</label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={extensionApiKey}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-indigo-400"
            />
            <button
              onClick={() => copyToClipboard(extensionApiKey, 'API Key')}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <span className="font-bold text-white block">Chrome Installation Instructions:</span>
          <ol className="list-decimal list-inside space-y-1 text-slate-400">
            <li>Copy the manifest files or download source bundle below.</li>
            <li>Open <code className="text-indigo-400">chrome://extensions</code> in Google Chrome.</li>
            <li>Enable <strong className="text-white">Developer mode</strong> (top-right toggle).</li>
            <li>Click <strong className="text-white">Load unpacked</strong> and select the extension folder.</li>
          </ol>
        </div>
      </div>

      {/* CODE FILES MANIFEST VIEWER */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase">Source Bundle Manifest Files</h3>
          </div>

          <button
            onClick={() => copyToClipboard(MANIFEST_JSON, 'manifest.json')}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" /> Copy manifest.json
          </button>
        </div>

        {/* MANIFEST JSON CODE BLOCK */}
        <div className="space-y-2">
          <span className="text-[10px] text-slate-400 font-bold block uppercase">manifest.json</span>
          <div className="p-3 bg-slate-950 text-emerald-400 rounded-xl text-xs overflow-x-auto max-h-40 border border-slate-800">
            <pre>{MANIFEST_JSON}</pre>
          </div>
        </div>

        {/* CONTENT JS CODE BLOCK */}
        <div className="space-y-2">
          <span className="text-[10px] text-slate-400 font-bold block uppercase">content.js (LinkedIn Scraper)</span>
          <div className="p-3 bg-slate-950 text-indigo-300 rounded-xl text-xs overflow-x-auto max-h-40 border border-slate-800">
            <pre>{CONTENT_JS}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
