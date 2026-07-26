import React from 'react';

export default function ClientPlaceholderTab({ icon: Icon, title, description }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center">
      {Icon && <Icon className="w-8 h-8 text-slate-600 mx-auto mb-3" />}
      <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  );
}