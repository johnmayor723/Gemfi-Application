import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { REGULATORY_ASSUMPTIONS_NOTE } from '@/lib/regulatoryConstants';

export default function RegulatoryDisclosureBanner() {
  return (
    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 mb-5">
      <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-amber-200/80 leading-relaxed">{REGULATORY_ASSUMPTIONS_NOTE}</p>
    </div>
  );
}
