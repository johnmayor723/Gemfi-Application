import React from 'react';
import { Label } from '@/components/ui/label';

export default function ProductField({ label, required, hint, full, children }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <Label className="text-slate-300 text-xs">
        {label} {required && <span className="text-rose-400">*</span>}
        {hint && <span className="text-slate-500 ml-1">({hint})</span>}
      </Label>
      {children}
    </div>
  );
}