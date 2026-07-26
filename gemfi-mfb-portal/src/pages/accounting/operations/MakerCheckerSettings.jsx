import React, { useState, useEffect, useMemo } from 'react';
import { fineractApi } from '@/lib/fineract';
import { Loader2, Search, ShieldCheck, Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/fineract/PageHeader';
import { useToast } from '@/components/ui/use-toast';

const inputCls = 'h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-600';

/** Permission codes most relevant to this module — every Accounting Operations
 * screen posts through one of these two commands, so enabling maker-checker
 * on just these two is enough to require approval for all of them. */
const SUGGESTED_CODES = ['CREATE_JOURNALENTRY', 'REVERSE_JOURNALENTRY', 'UPDATE_JOURNALENTRY'];

export default function MakerCheckerSettings() {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [togglingCode, setTogglingCode] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fineractApi('/permissions', { params: { makerCheckerable: true } });
      setPermissions(Array.isArray(res) ? res : []);
    } catch (err) {
      toast({ title: 'Error loading permissions', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const suggested = useMemo(
    () => permissions.filter(p => SUGGESTED_CODES.includes(p.code)),
    [permissions],
  );

  const filtered = useMemo(() => {
    if (!showAll) return [];
    const q = search.trim().toLowerCase();
    if (!q) return permissions;
    return permissions.filter(p =>
      [p.code, p.entityName, p.actionName, p.grouping].some(v => String(v || '').toLowerCase().includes(q)));
  }, [permissions, search, showAll]);

  const toggle = async (permission) => {
    setTogglingCode(permission.code);
    try {
      await fineractApi('/permissions', {
        method: 'PUT',
        body: { permissions: { [permission.code]: !permission.isMakerChecker } },
      });
      toast({ title: `Maker-checker ${!permission.isMakerChecker ? 'enabled' : 'disabled'} for ${permission.code}` });
      await load();
    } catch (err) {
      toast({ title: 'Error updating permission', description: err.message, variant: 'destructive' });
    } finally {
      setTogglingCode(null);
    }
  };

  const Row = ({ p }) => (
    <tr>
      <td className="px-4 py-2.5 font-mono text-xs text-emerald-400">{p.code}</td>
      <td className="px-4 py-2.5 text-slate-300 text-xs">{p.entityName || '—'}</td>
      <td className="px-4 py-2.5 text-slate-400 text-xs">{p.actionName || '—'}</td>
      <td className="px-4 py-2.5 text-slate-500 text-xs">{p.grouping || '—'}</td>
      <td className="px-4 py-2.5 text-right">
        <button
          onClick={() => toggle(p)}
          disabled={togglingCode === p.code}
          className={`relative w-10 h-5 rounded-full transition-colors ${p.isMakerChecker ? 'bg-emerald-600' : 'bg-slate-700'} disabled:opacity-50`}
        >
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${p.isMakerChecker ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </td>
    </tr>
  );

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Maker-Checker Settings"
        description="Require a second user's approval before an accounting command actually posts"
      />

      <div className="mb-5">
        <Link to="/accounting/operations/checker-inbox" className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 hover:bg-slate-800 hover:border-emerald-600/30 transition-colors group w-fit">
          <div className="p-2 rounded-lg bg-slate-700/50 group-hover:bg-emerald-600/10 group-hover:text-emerald-400 text-slate-400 transition-colors">
            <Inbox className="w-4 h-4" />
          </div>
          <span className="text-sm text-slate-300 group-hover:text-white">Go to Checker Inbox</span>
        </Link>
      </div>

      <div className="bg-emerald-600/5 border border-emerald-600/20 rounded-xl p-4 mb-6 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed">
          This turns on Fineract's own four-eyes approval, not a bespoke approval flow — when enabled for a command,
          Fineract holds it as "Awaiting Approval" instead of executing it, and it only posts once approved from the
          Checker Inbox. Whether toggling this actually changes behavior depends on your Fineract instance supporting
          maker-checker; if the inbox stays empty after enabling this and posting a transaction, that instance likely
          doesn't have the feature active.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>
      ) : (
        <>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Accounting Operations Commands
          </h3>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden mb-8">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Code</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Entity</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Action</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Grouping</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Requires Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {suggested.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-slate-500 text-sm">
                    None of the expected journal entry commands were found on this instance — check "All permissions" below.
                  </td></tr>
                ) : suggested.map(p => <Row key={p.code} p={p} />)}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">All Permissions</h3>
            <button onClick={() => setShowAll(v => !v)} className="text-xs text-emerald-400 hover:text-emerald-300">
              {showAll ? 'Hide' : 'Show'}
            </button>
          </div>

          {showAll && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
              <div className="p-3 border-b border-slate-700/50">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter by code, entity, action…" className={`${inputCls} w-full pl-9`} />
                </div>
              </div>
              <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-900/50 sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Code</th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Entity</th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Action</th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Grouping</th>
                      <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Requires Approval</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {filtered.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-8 text-slate-500 text-sm">No permissions match</td></tr>
                    ) : filtered.map(p => <Row key={p.code} p={p} />)}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
