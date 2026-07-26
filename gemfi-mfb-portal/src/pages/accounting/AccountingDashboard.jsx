import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fineractApi } from '@/lib/fineract';
import { BookOpen, Scale, FileText, BarChart3, FolderOpen, DollarSign, TrendingUp, ArrowLeftRight, PieChart } from 'lucide-react';
import PageHeader from '@/components/fineract/PageHeader';

export default function AccountingDashboard() {
  const [stats, setStats] = useState({ glAccounts: 0, journalEntries: 0, offices: 0, closures: 0 });
  const [loading, setLoading] = useState(true);
  const [accountTypeBreakdown, setAccountTypeBreakdown] = useState([]);

  useEffect(() => {
    Promise.all([
      fineractApi('/glaccounts').catch(() => []),
      fineractApi('/journalentries', { params: { limit: 1 } }).catch(() => ({ totalFilteredRecords: 0 })),
      fineractApi('/offices').catch(() => []),
      fineractApi('/glclosures').catch(() => []),
    ]).then(([accounts, journals, offices, closures]) => {
      const accountList = Array.isArray(accounts) ? accounts : [];
      setStats({
        glAccounts: accountList.length,
        journalEntries: journals?.totalFilteredRecords || 0,
        offices: Array.isArray(offices) ? offices.length : 0,
        closures: Array.isArray(closures) ? closures.length : 0,
      });

      // Account type breakdown
      const types = {};
      accountList.forEach((a) => {
        const type = a.type?.value || 'Unknown';
        types[type] = (types[type] || 0) + 1;
      });
      setAccountTypeBreakdown(Object.entries(types).map(([type, count]) => ({ type, count })));
      setLoading(false);
    });
  }, []);

  const modules = [
    { title: 'Journal Entries', desc: 'View and create double-entry postings', path: '/accounting/journal-entries', icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-600/10' },
    { title: 'General Ledger', desc: 'Browse ledger entries with running balance', path: '/accounting/general-ledger', icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-600/10' },
    { title: 'Trial Balance', desc: 'Verify debit/credit balance across accounts', path: '/accounting/trial-balance', icon: Scale, color: 'text-amber-400', bg: 'bg-amber-600/10' },
    { title: 'Chart of Accounts', desc: 'Manage GL account structure', path: '/accounting/gl-accounts', icon: ArrowLeftRight, color: 'text-purple-400', bg: 'bg-purple-600/10' },
    { title: 'GL Closures', desc: 'Manage accounting period closures', path: '/accounting/closures', icon: FolderOpen, color: 'text-rose-400', bg: 'bg-rose-600/10' },
    { title: 'Financial Mappings', desc: 'Configure financial activity accounts', path: '/accounting/financial-mappings', icon: DollarSign, color: 'text-cyan-400', bg: 'bg-cyan-600/10' },
    { title: 'Financial Reports', desc: 'Balance Sheet, P&L, and regulatory reports', path: '/reports', icon: BarChart3, color: 'text-indigo-400', bg: 'bg-indigo-600/10' },
  ];

  const statCards = [
    { label: 'GL Accounts', value: stats.glAccounts, icon: BookOpen, color: 'text-emerald-400' },
    { label: 'Journal Entries', value: stats.journalEntries.toLocaleString(), icon: FileText, color: 'text-blue-400' },
    { label: 'Offices', value: stats.offices, icon: BuildingIcon, color: 'text-amber-400' },
    { label: 'GL Closures', value: stats.closures, icon: FolderOpen, color: 'text-rose-400' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Accounting Dashboard" description="Overview of the General Ledger and financial operations" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg bg-slate-700/50 ${s.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{loading ? '—' : s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Account type breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-400" /> Account Type Breakdown
          </h3>
          {loading ? (
            <div className="text-slate-500 text-sm">Loading...</div>
          ) : accountTypeBreakdown.length === 0 ? (
            <div className="text-slate-500 text-sm">No accounts found</div>
          ) : (
            <div className="space-y-3">
              {accountTypeBreakdown.map(({ type, count }) => {
                const max = Math.max(...accountTypeBreakdown.map((b) => b.count));
                const pct = (count / max) * 100;
                const colors = { Asset: 'bg-emerald-500', Liability: 'bg-amber-500', Equity: 'bg-blue-500', Income: 'bg-purple-500', Expense: 'bg-rose-500' };
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-300">{type}</span>
                      <span className="text-slate-400 font-mono">{count} accounts</span>
                    </div>
                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colors[type] || 'bg-slate-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> Quick Actions
          </h3>
          <div className="space-y-2">
            <Link to="/accounting/journal-entries?action=create" className="block w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-300 bg-slate-700/30 hover:bg-emerald-600/10 hover:text-emerald-400 transition-colors">
              + Create Journal Entry
            </Link>
            <Link to="/accounting/gl-accounts" className="block w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-300 bg-slate-700/30 hover:bg-emerald-600/10 hover:text-emerald-400 transition-colors">
              + Add GL Account
            </Link>
            <Link to="/accounting/trial-balance" className="block w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-300 bg-slate-700/30 hover:bg-emerald-600/10 hover:text-emerald-400 transition-colors">
              Generate Trial Balance
            </Link>
            <Link to="/accounting/general-ledger" className="block w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-300 bg-slate-700/30 hover:bg-emerald-600/10 hover:text-emerald-400 transition-colors">
              View General Ledger
            </Link>
          </div>
        </div>
      </div>

      {/* Module cards */}
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Accounting Modules</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.path}
              to={m.path}
              className="group bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:bg-slate-800 hover:border-slate-600 transition-all"
            >
              <div className={`inline-flex p-3 rounded-xl ${m.bg} ${m.color} mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">{m.title}</h4>
              <p className="text-xs text-slate-500 mt-1">{m.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function BuildingIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
    </svg>
  );
}