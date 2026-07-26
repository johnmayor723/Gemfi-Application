import React, { useState, useEffect } from 'react';
import { fineractApi } from '@/lib/fineract';
import { fetchAudits, parseAuditResponse, fmtDateTime } from '@/lib/auditApi';
import { Loader2, Check, X, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/fineract/PageHeader';
import { useToast } from '@/components/ui/use-toast';

const PENDING_PATTERN = /awaiting|pending/i;

function isPending(a) {
  const text = typeof a.processingResult === 'string' ? a.processingResult : (a.processingResult?.value || a.status?.value || a.status || '');
  return PENDING_PATTERN.test(String(text));
}

/**
 * Lists commands held for maker-checker approval and lets a checker
 * approve or reject them. Fineract's dedicated collection for this is
 * `/makercheckers` (mirroring `/audits`, but scoped to pending entries) —
 * if that resource isn't present on this instance's Fineract version, this
 * falls back to `/audits` filtered client-side by processing status, since
 * every pending command is still an audit entry either way.
 */
export default function CheckerInbox() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fineractApi('/makercheckers', { params: { limit: 100 } });
      const { items: parsed } = parseAuditResponse(res);
      setItems(parsed);
      setUsingFallback(false);
    } catch {
      try {
        const res = await fetchAudits({ limit: 200 });
        const { items: parsed } = parseAuditResponse(res);
        setItems(parsed.filter(isPending));
        setUsingFallback(true);
      } catch (err) {
        toast({ title: 'Error loading checker inbox', description: err.message, variant: 'destructive' });
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const act = async (id, command) => {
    setActingId(id);
    try {
      await fineractApi(`/makercheckers/${id}?command=${command}`, { method: 'POST', body: {} });
      toast({ title: command === 'approve' ? 'Command approved and posted' : 'Command rejected' });
      load();
    } catch (err) {
      toast({ title: `Error ${command === 'approve' ? 'approving' : 'rejecting'} entry`, description: err.message, variant: 'destructive' });
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader title="Checker Inbox" description="Commands awaiting a second user's approval before they post" />

      {usingFallback && !loading && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-5 text-xs text-amber-200/80">
          The dedicated <code>/makercheckers</code> endpoint wasn't reachable on this instance — showing pending entries
          filtered out of the general audit log instead. Approve/reject still goes through the same command.
        </div>
      )}

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm flex flex-col items-center gap-2">
            <Inbox className="w-8 h-8 text-slate-700" />
            Nothing is waiting for approval right now.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Made By</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Date</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Action</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Entity</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Office</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {items.map(a => (
                <tr key={a.id}>
                  <td className="px-4 py-2.5 text-slate-200">{a.maker || a.makerId || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-400 text-xs">{a.madeOnDate ? fmtDateTime(a.madeOnDate) : '—'}</td>
                  <td className="px-4 py-2.5 text-slate-300 text-xs">{a.actionName || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-300 text-xs">{a.entityName || '—'}{a.resourceId ? ` #${a.resourceId}` : ''}</td>
                  <td className="px-4 py-2.5 text-slate-400 text-xs">{a.officeName || '—'}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" onClick={() => act(a.id, 'approve')} disabled={actingId === a.id} className="bg-emerald-600 hover:bg-emerald-700">
                        {actingId === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => act(a.id, 'reject')} disabled={actingId === a.id} className="border-rose-600/30 text-rose-400 hover:bg-rose-600/10">
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
