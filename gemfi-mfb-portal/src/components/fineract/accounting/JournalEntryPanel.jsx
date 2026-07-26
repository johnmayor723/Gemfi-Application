import React, { useState, useEffect } from 'react';
import { X, Loader2, ArrowDownRight, ArrowUpRight, RotateCcw, AlertTriangle } from 'lucide-react';
import { fetchTransactionEntries } from '@/hooks/useJournalEntries';
import { fineractApi } from '@/lib/fineract';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

/**
 * Slide-out side panel showing the complete double-entry posting for a transaction.
 */
export default function JournalEntryPanel({ transactionId, onClose, onChanged }) {
  const { toast } = useToast();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reversing, setReversing] = useState(false);
  const [confirmReverse, setConfirmReverse] = useState(false);

  const load = () => {
    setLoading(true);
    fetchTransactionEntries(transactionId)
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!transactionId) return;
    load();
    setConfirmReverse(false);
  }, [transactionId]);

  if (!transactionId) return null;

  const alreadyReversed = entries.some(e => e.reversed);

  const handleReverse = async () => {
    setReversing(true);
    try {
      // Fineract's reversal endpoint takes the transaction ID in the path,
      // not the query string — POST /journalentries/{transactionId}?command=reverse.
      await fineractApi(`/journalentries/${encodeURIComponent(transactionId)}?command=reverse`, {
        method: 'POST',
        body: { officeId: entries[0]?.officeId, locale: 'en', dateFormat: 'dd MMMM yyyy' },
      });
      toast({ title: 'Journal entry reversed', description: 'A reversing entry has been posted; every report is now up to date.' });
      setConfirmReverse(false);
      load();
      if (onChanged) onChanged();
    } catch (err) {
      toast({ title: 'Error reversing entry', description: err.message, variant: 'destructive' });
    } finally {
      setReversing(false);
    }
  };

  const debits = entries.filter((e) => e.entryType?.value?.toLowerCase() === 'debit' || e.entryType?.id === 1);
  const credits = entries.filter((e) => e.entryType?.value?.toLowerCase() === 'credit' || e.entryType?.id === 2);
  const currency = entries[0]?.currency?.displaySymbol || entries[0]?.currency?.code || '';
  const totalDebit = debits.reduce((s, e) => s + (e.amount || 0), 0);
  const totalCredit = credits.reduce((s, e) => s + (e.amount || 0), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const fmt = (v) => (v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 z-50 h-full w-full sm:w-[480px] bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div>
            <h2 className="text-base font-bold text-white">Transaction Details</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{transactionId}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-20 text-slate-500 text-sm">No entries found for this transaction.</div>
          ) : (
            <>
              {/* Transaction meta */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <div className="text-slate-500">Office</div>
                  <div className="text-white font-medium mt-0.5">{entries[0]?.officeName || '—'}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <div className="text-slate-500">Date</div>
                  <div className="text-white font-medium mt-0.5">{entries[0]?.transactionDate ? formatDate(entries[0].transactionDate) : '—'}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <div className="text-slate-500">Created By</div>
                  <div className="text-white font-medium mt-0.5">{entries[0]?.createdByUserName || '—'}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <div className="text-slate-500">Currency</div>
                  <div className="text-white font-medium mt-0.5">{entries[0]?.currency?.code || '—'}</div>
                </div>
              </div>

              {/* Comments */}
              {entries[0]?.comments && (
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <div className="text-slate-500 text-xs mb-1">Notes</div>
                  <div className="text-sm text-slate-200">{entries[0].comments}</div>
                </div>
              )}

              {/* Debit side */}
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-400 mb-2">
                  <ArrowDownRight className="w-4 h-4" /> Debit Entries
                </h3>
                <div className="space-y-1.5">
                  {debits.map((e, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-800/30 rounded-lg px-3 py-2 border border-slate-700/30">
                      <div>
                        <div className="text-sm text-white font-medium">{e.glAccountName || e.accountName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{e.glAccountCode || e.glCode}</div>
                      </div>
                      <div className="text-sm text-emerald-400 font-mono font-medium">{currency} {fmt(e.amount)}</div>
                    </div>
                  ))}
                  {debits.length === 0 && <div className="text-xs text-slate-500 italic px-3">No debit entries</div>}
                </div>
                <div className="flex justify-between mt-2 px-3 text-sm font-bold text-emerald-400 border-t border-emerald-600/20 pt-2">
                  <span>Total Debit</span>
                  <span className="font-mono">{currency} {fmt(totalDebit)}</span>
                </div>
              </div>

              {/* Credit side */}
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-400 mb-2">
                  <ArrowUpRight className="w-4 h-4" /> Credit Entries
                </h3>
                <div className="space-y-1.5">
                  {credits.map((e, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-800/30 rounded-lg px-3 py-2 border border-slate-700/30">
                      <div>
                        <div className="text-sm text-white font-medium">{e.glAccountName || e.accountName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{e.glAccountCode || e.glCode}</div>
                      </div>
                      <div className="text-sm text-amber-400 font-mono font-medium">{currency} {fmt(e.amount)}</div>
                    </div>
                  ))}
                  {credits.length === 0 && <div className="text-xs text-slate-500 italic px-3">No credit entries</div>}
                </div>
                <div className="flex justify-between mt-2 px-3 text-sm font-bold text-amber-400 border-t border-amber-600/20 pt-2">
                  <span>Total Credit</span>
                  <span className="font-mono">{currency} {fmt(totalCredit)}</span>
                </div>
              </div>

              {/* Balance status */}
              <div className={`rounded-lg p-3 text-center text-sm font-medium ${balanced ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-600/20' : 'bg-rose-600/10 text-rose-400 border border-rose-600/20'}`}>
                {balanced ? '✓ Transaction Balanced' : `✗ Out of Balance by ${currency} ${fmt(Math.abs(totalDebit - totalCredit))}`}
              </div>

              {/* Reversal */}
              {alreadyReversed ? (
                <div className="rounded-lg p-3 text-center text-sm font-medium bg-slate-800/50 text-slate-400 border border-slate-700/50">
                  This transaction has already been reversed
                </div>
              ) : confirmReverse ? (
                <div className="rounded-lg p-3 bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <div className="flex items-start gap-2 text-xs text-amber-300">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    This posts a reversing entry — it does not delete this transaction, and both remain in the audit trail.
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setConfirmReverse(false)} className="text-slate-400 flex-1">Cancel</Button>
                    <Button size="sm" onClick={handleReverse} disabled={reversing} className="bg-rose-600 hover:bg-rose-700 flex-1">
                      {reversing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5 mr-1.5" />} Confirm Reverse
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setConfirmReverse(true)} className="w-full border-slate-700 text-slate-300 hover:bg-rose-600/10 hover:text-rose-400 hover:border-rose-600/30">
                  <RotateCcw className="w-4 h-4 mr-2" /> Reverse Transaction
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function formatDate(arr) {
  if (!Array.isArray(arr) || arr.length < 3) return '—';
  const [y, m, d] = arr;
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}