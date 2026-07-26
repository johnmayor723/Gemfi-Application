import React from 'react';

const GL_TYPE_LABEL = { 1: 'Asset', 2: 'Liability', 3: 'Equity', 4: 'Income', 5: 'Expense' };

/**
 * GL account picker scoped to one account type (Asset/Liability/Equity/
 * Income/Expense) — used across the Accounting Operations entry screens so
 * a user can only pick, say, an Expense account where an Expense account is
 * expected. Detail-usage accounts only — confirmed directly against a live
 * Fineract instance's /glaccounts response: usage.id === 1 is "DETAIL",
 * usage.id === 2 is "HEADER" (the opposite of what this file originally
 * assumed, matching the same organizing-account convention documented on
 * GLAccounts.jsx). Header accounts are chart-of-accounts groupings, not
 * postable lines.
 */
export default function GlAccountSelect({ accounts, typeId, value, onChange, placeholder, className = '' }) {
  const options = (accounts || []).filter(a => (typeId == null || a.type?.id === typeId) && a.usage?.id === 1 && a.disabled !== true);

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`w-full h-10 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm ${className}`}
    >
      <option value="">{placeholder || `Select ${GL_TYPE_LABEL[typeId] || 'account'}…`}</option>
      {options.map(a => (
        <option key={a.id} value={a.id}>{a.glCode} — {a.name}</option>
      ))}
    </select>
  );
}
