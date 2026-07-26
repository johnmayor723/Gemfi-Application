import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fineractApi } from '@/lib/fineract';
import { postJournalEntry, fetchActiveCurrencies } from '@/lib/accountingOperations';
import { Loader2, Check, Plus, Trash2, Save, FolderOpen, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/fineract/PageHeader';
import GlAccountSelect from '@/components/fineract/accounting/GlAccountSelect';
import { useToast } from '@/components/ui/use-toast';

const inputCls = 'mt-1 bg-slate-800 border-slate-700 text-white';
const today = () => new Date().toISOString().split('T')[0];
const DRAFT_KEY = 'manual_journal_entry_draft';

const newLine = () => ({ key: crypto.randomUUID(), glAccountId: '', amount: '' });

const emptyForm = () => ({
  officeId: '',
  transactionDate: today(),
  currencyCode: '',
  referenceNumber: '',
  narration: '',
  debitLines: [newLine()],
  creditLines: [newLine()],
});

const fmt = (v) => (v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function LineRows({ label, lines, glAccounts, onChange, onAdd, onRemove, tone }) {
  const total = lines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <h3 className={`text-sm font-semibold ${tone}`}>{label}</h3>
        <button onClick={onAdd} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white">
          <Plus className="w-3.5 h-3.5" /> Add line
        </button>
      </div>
      <div className="p-3 space-y-2">
        {lines.map((line, i) => (
          <div key={line.key} className="flex items-center gap-2">
            <div className="flex-1">
              <GlAccountSelect
                accounts={glAccounts}
                value={line.glAccountId}
                onChange={v => onChange(line.key, 'glAccountId', v)}
                placeholder="Select GL account…"
              />
            </div>
            <Input
              type="number" min="0.01" step="0.01" value={line.amount}
              onChange={e => onChange(line.key, 'amount', e.target.value)}
              placeholder="0.00" className="w-36 bg-slate-800 border-slate-700 text-white"
            />
            <button
              onClick={() => onRemove(line.key)}
              disabled={lines.length <= 1}
              className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <div className={`px-4 py-2.5 border-t border-slate-700/50 flex justify-between text-sm font-bold ${tone}`}>
        <span>Total</span>
        <span className="font-mono">{fmt(total)}</span>
      </div>
    </div>
  );
}

/**
 * Full multi-line Dr/Cr posting screen — replaces the single debit/single
 * credit dialog previously embedded in JournalEntries.jsx. Draft state is
 * kept in localStorage only: Fineract has no server-side concept of an
 * unposted journal entry, so "Save Draft" here means "don't lose my work
 * in this browser", not a pending record anywhere else.
 */
export default function ManualJournalEntry() {
  const { toast } = useToast();
  const [offices, setOffices] = useState([]);
  const [glAccounts, setGlAccounts] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    fineractApi('/offices').then(r => setOffices(Array.isArray(r) ? r : [])).catch(() => {});
    fineractApi('/glaccounts').then(r => setGlAccounts(Array.isArray(r) ? r : [])).catch(() => {});
    fetchActiveCurrencies().then(list => {
      setCurrencies(list);
      if (list.length === 1) setForm(p => ({ ...p, currencyCode: list[0].code }));
    }).catch(() => {});
    setHasDraft(!!localStorage.getItem(DRAFT_KEY));
  }, []);

  const update = (key, value) => setForm(p => ({ ...p, [key]: value }));

  const updateLine = (side) => (key, field, value) => {
    setForm(p => ({ ...p, [side]: p[side].map(l => l.key === key ? { ...l, [field]: value } : l) }));
  };
  const addLine = (side) => () => setForm(p => ({ ...p, [side]: [...p[side], newLine()] }));
  const removeLine = (side) => (key) => setForm(p => ({ ...p, [side]: p[side].filter(l => l.key !== key) }));

  const totalDebit = useMemo(() => form.debitLines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0), [form.debitLines]);
  const totalCredit = useMemo(() => form.creditLines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0), [form.creditLines]);
  const difference = totalDebit - totalCredit;
  const isBalanced = Math.abs(difference) < 0.005 && totalDebit > 0;

  const linesComplete = (lines) => lines.every(l => l.glAccountId && parseFloat(l.amount) > 0);
  const canPost = form.officeId && form.transactionDate && form.currencyCode && isBalanced
    && linesComplete(form.debitLines) && linesComplete(form.creditLines);

  const saveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    setHasDraft(true);
    toast({ title: 'Draft saved', description: 'Kept in this browser until you post or clear it.' });
  };
  const loadDraft = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(DRAFT_KEY));
      if (raw) setForm(raw);
    } catch { /* ignore corrupt draft */ }
  };
  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
  };

  const handlePost = async () => {
    setSaving(true);
    try {
      await postJournalEntry({
        officeId: form.officeId,
        currencyCode: form.currencyCode,
        transactionDate: form.transactionDate,
        debitLines: form.debitLines,
        creditLines: form.creditLines,
        referenceNumber: form.referenceNumber,
        narration: form.narration,
      });
      toast({ title: 'Journal entry posted', description: 'Every report now reflects this transaction.' });
      clearDraft();
      setForm(emptyForm());
    } catch (err) {
      toast({ title: 'Error posting entry', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Manual Journal Entry"
        description="Post a balanced multi-line double-entry directly to the General Ledger"
        action={
          <div className="flex gap-2">
            {hasDraft && (
              <Button variant="outline" onClick={loadDraft} className="border-slate-600 text-slate-300 hover:bg-slate-700">
                <FolderOpen className="w-4 h-4 mr-2" /> Load Draft
              </Button>
            )}
            <Button variant="outline" onClick={saveDraft} className="border-slate-600 text-slate-300 hover:bg-slate-700">
              <Save className="w-4 h-4 mr-2" /> Save Draft
            </Button>
          </div>
        }
      />

      <div className="mb-5">
        <Link to="/accounting/journal-entries" className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 hover:bg-slate-800 hover:border-emerald-600/30 transition-colors group w-fit">
          <div className="p-2 rounded-lg bg-slate-700/50 group-hover:bg-emerald-600/10 group-hover:text-emerald-400 text-slate-400 transition-colors">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-sm text-slate-300 group-hover:text-white">View posted journal entries</span>
        </Link>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-5 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label className="text-slate-300 text-xs">Office *</Label>
            <select value={form.officeId} onChange={e => update('officeId', e.target.value)} className="mt-1 w-full h-10 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm">
              <option value="">Select office</option>
              {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-slate-300 text-xs">Currency *</Label>
            <select value={form.currencyCode} onChange={e => update('currencyCode', e.target.value)} className="mt-1 w-full h-10 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm">
              <option value="">Select currency</option>
              {currencies.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-slate-300 text-xs">Transaction Date *</Label>
            <Input type="date" value={form.transactionDate} onChange={e => update('transactionDate', e.target.value)} className={inputCls} />
          </div>
          <div>
            <Label className="text-slate-300 text-xs">Reference Number</Label>
            <Input value={form.referenceNumber} onChange={e => update('referenceNumber', e.target.value)} className={inputCls} placeholder="Optional" />
          </div>
        </div>
        <div>
          <Label className="text-slate-300 text-xs">Narration</Label>
          <Textarea value={form.narration} onChange={e => update('narration', e.target.value)} className={inputCls} placeholder="Describe this transaction…" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <LineRows
          label="Debit Lines" lines={form.debitLines} glAccounts={glAccounts} tone="text-emerald-400"
          onChange={updateLine('debitLines')} onAdd={addLine('debitLines')} onRemove={removeLine('debitLines')}
        />
        <LineRows
          label="Credit Lines" lines={form.creditLines} glAccounts={glAccounts} tone="text-amber-400"
          onChange={updateLine('creditLines')} onAdd={addLine('creditLines')} onRemove={removeLine('creditLines')}
        />
      </div>

      <div className={`rounded-xl p-4 flex items-center gap-3 mb-5 ${isBalanced ? 'bg-emerald-600/10 border border-emerald-600/30' : 'bg-rose-600/10 border border-rose-600/30'}`}>
        {isBalanced ? <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />}
        <div className="text-sm">
          <span className="font-semibold text-white">Debit {fmt(totalDebit)}</span>
          <span className="text-slate-600 mx-2">·</span>
          <span className="font-semibold text-white">Credit {fmt(totalCredit)}</span>
          <span className="text-slate-600 mx-2">·</span>
          <span className={isBalanced ? 'text-emerald-400' : 'text-rose-400'}>
            {isBalanced ? 'Balanced' : totalDebit === 0 && totalCredit === 0 ? 'Enter amounts to continue' : `Out of balance by ${fmt(Math.abs(difference))}`}
          </span>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handlePost} disabled={!canPost || saving} className="bg-emerald-600 hover:bg-emerald-700">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />} Post Journal Entry
        </Button>
      </div>
    </div>
  );
}
