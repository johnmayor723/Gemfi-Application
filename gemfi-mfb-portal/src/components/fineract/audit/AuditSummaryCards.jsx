import React, { useState, useEffect } from 'react';
import { Database, Calendar, CreditCard, Users, PiggyBank, Settings } from 'lucide-react';
import { fetchAudits, toFineractDate } from '@/lib/auditApi';
import { useTerminology } from '@/lib/terminology';

export default function AuditSummaryCards() {
  const t = useTerminology();
  const [counts, setCounts] = useState({ total: 0, today: 0, loan: 0, client: 0, savings: 0, config: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      const today = toFineractDate(new Date().toISOString().split('T')[0]);
      const calls = [
        fetchAudits({ offset: 0, limit: 1 }),
        fetchAudits({ offset: 0, limit: 1, startDate: today, endDate: today }),
        fetchAudits({ offset: 0, limit: 1, entityName: 'LOAN' }),
        fetchAudits({ offset: 0, limit: 1, entityName: 'CLIENT' }),
        fetchAudits({ offset: 0, limit: 1, entityName: 'SAVINGS_ACCOUNT' }),
      ];
      try {
        const results = await Promise.all(calls.map(c => c.catch(() => null)));
        const get = r => (Array.isArray(r) ? r.length : r?.totalFilteredRecords || 0);
        const total = get(results[0]);
        const loan = get(results[2]);
        const client = get(results[3]);
        const savings = get(results[4]);
        setCounts({
          total,
          today: get(results[1]),
          loan,
          client,
          savings,
          config: Math.max(0, total - loan - client - savings),
        });
      } catch { /* noop */ }
      setLoading(false);
    };
    fetchCounts();
  }, []);

  const cards = [
    { label: 'Total Events', value: counts.total, icon: Database, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: "Today's Events", value: counts.today, icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Loan Activities', value: counts.loan, icon: CreditCard, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: `${t.clientSingular} Activities`, value: counts.client, icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    t.showSavings && { label: `${t.savings} Activities`, value: counts.savings, icon: PiggyBank, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Config Changes', value: counts.config, icon: Settings, color: 'text-slate-400', bg: 'bg-slate-500/10' },
  ].filter(Boolean);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {cards.map(c => (
        <div key={c.label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-bold text-white">{loading ? '—' : c.value.toLocaleString()}</div>
              <div className="text-xs text-slate-500 mt-0.5">{c.label}</div>
            </div>
            <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center`}>
              <c.icon className={`w-4 h-4 ${c.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}