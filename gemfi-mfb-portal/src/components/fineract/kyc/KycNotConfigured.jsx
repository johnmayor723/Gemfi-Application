import React from 'react';
import { ShieldCheck, ShieldX } from 'lucide-react';

export default function KycNotConfigured() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mb-4">
        <ShieldX className="w-7 h-7 text-slate-500" />
      </div>
      <h3 className="text-sm font-semibold text-white mb-1">KYC Service is not configured</h3>
      <p className="text-sm text-slate-500 max-w-md">
        Configure a KYC API endpoint to enable identity verification and compliance features.
      </p>
      <a href="/connection" className="mt-4 inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white">
        <ShieldCheck className="w-3.5 h-3.5" /> Configure KYC Service
      </a>
    </div>
  );
}