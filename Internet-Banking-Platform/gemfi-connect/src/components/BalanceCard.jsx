import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
export default function BalanceCard({ title='Available balance', availableBalance, ledgerBalance, currency='NGN' }) {
  const [hidden, setHidden] = useState(false);
  return <section className="rounded-2xl bg-[hsl(var(--primary))] text-white p-6 shadow-sm"><div className="flex justify-between"><p className="text-sm text-white/75">{title}</p><button onClick={() => setHidden(h => !h)} aria-label={hidden ? 'Show balance' : 'Hide balance'} className="text-white/70 hover:text-white">{hidden ? <EyeOff size={19}/> : <Eye size={19}/>}</button></div><p className="mt-4 text-3xl font-bold tracking-tight">{hidden ? '••••••' : (availableBalance ?? '—')} <span className="text-sm font-medium text-white/70">{currency}</span></p><p className="mt-2 text-xs text-white/70">Ledger balance: {hidden ? '••••••' : (ledgerBalance ?? '—')} {currency}</p><p className="mt-6 text-xs text-white/60">Balances are provided by your account service</p></section>;
}
