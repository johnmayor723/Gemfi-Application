import React from 'react';

export default function ProductFormSection({ title, children }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-white mb-4">{title}</h2>
      <div className="grid grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}