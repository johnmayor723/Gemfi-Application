import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fineractApi } from '@/lib/fineract';
import { postSimpleJournalEntry, fetchActiveCurrencies } from '@/lib/accountingOperations';
import { Loader2, Check, BookOpen, Scale, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/fineract/PageHeader';
import GlAccountSelect from '@/components/fineract/accounting/GlAccountSelect';
import { useToast } from '@/components/ui/use-toast';

const inputCls = 'mt-1 bg-slate-800 border-slate-700 text-white';
const today = () => new Date().toISOString().split('T')[0];

const emptyForm = () => ({
  officeId: '',
  transactionDate: today(),
  currencyCode: '',
  expenseAccountId: '',
  cashBankAccountId: '',
  amount: '',
  referenceNumber: '',
  narration: '',
});

/** Debit the selected Expense account, Credit the paying Cash/Bank account. */
export default function ExpenseEntry() {
  const { toast } = useToast();
  const [offices, setOffices] = useState([]);
  const [glAccounts, setGlAccounts] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());

  useEffect(() => {
    fineractApi('/offices').then(r => setOffices(Array.isArray(r) ? r : [])).catch(() => {});
    fineractApi('/glaccounts').then(r => setGlAccounts(Array.isArray(r) ? r : [])).catch(() => {});
    fetchActiveCurrencies().then(list => {
      setCurrencies(list);
      if (list.length === 1) setForm(p => ({ ...p, currencyCode: list[0].code }));
    }).catch(() => {});
  }, []);

  const update = (key, value) => setForm(p => ({ ...p, [key]: value }));

  const isValid = form.officeId && form.transactionDate && form.currencyCode && form.expenseAccountId && form.cashBankAccountId
    && form.expenseAccountId !== form.cashBankAccountId && parseFloat(form.amount) > 0;

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await postSimpleJournalEntry({
        officeId: form.officeId,
        currencyCode: form.currencyCode,
        transactionDate: form.transactionDate,
        debitAccountId: form.expenseAccountId,
        creditAccountId: form.cashBankAccountId,
        amount: form.amount,
        referenceNumber: form.referenceNumber,
        narration: form.narration,
      });
      toast({ title: 'Expense posted', description: 'Profit & Loss, Trial Balance, and the Balance Sheet have been updated.' });
      setForm(emptyForm());
    } catch (err) {
      toast({ title: 'Error posting expense', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <PageHeader title="Expense Entry" description="Record an operating expense paid from Cash/Bank" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <QuickLink to="/accounting/journal-entries" icon={BookOpen} label="Journal Entries" />
        <QuickLink to="/accounting/general-ledger" icon={BookOpen} label="General Ledger" />
        <QuickLink to="/accounting/trial-balance" icon={Scale} label="Trial Balance" />
        <QuickLink to="/reports" icon={TrendingUp} label="Profit & Income Statement" />
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <Label className="text-slate-300 text-xs">Date *</Label>
            <Input type="date" value={form.transactionDate} onChange={e => update('transactionDate', e.target.value)} className={inputCls} />
          </div>
        </div>

        <div>
          <Label className="text-slate-300 text-xs">Amount *</Label>
          <Input type="number" min="0.01" step="0.01" value={form.amount} onChange={e => update('amount', e.target.value)} className={inputCls} placeholder="0.00" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-slate-300 text-xs">Expense Account *</Label>
            <GlAccountSelect accounts={glAccounts} typeId={5} value={form.expenseAccountId} onChange={v => update('expenseAccountId', v)} placeholder="Select Expense account…" className="mt-1" />
          </div>
          <div>
            <Label className="text-slate-300 text-xs">Cash/Bank Account *</Label>
            <GlAccountSelect accounts={glAccounts} typeId={1} value={form.cashBankAccountId} onChange={v => update('cashBankAccountId', v)} placeholder="Select Cash/Bank account…" className="mt-1" />
          </div>
        </div>

        <div>
          <Label className="text-slate-300 text-xs">Reference</Label>
          <Input value={form.referenceNumber} onChange={e => update('referenceNumber', e.target.value)} className={inputCls} placeholder="e.g. invoice #, receipt #…" />
        </div>

        <div>
          <Label className="text-slate-300 text-xs">Narration</Label>
          <Textarea value={form.narration} onChange={e => update('narration', e.target.value)} className={inputCls} placeholder="Describe the expense…" />
        </div>

        {form.expenseAccountId && form.cashBankAccountId && parseFloat(form.amount) > 0 && (
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 text-xs text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300 mb-1">Journal entry preview</div>
            <div>Debit — Expense: <span className="text-emerald-400 font-mono">{Number(form.amount).toLocaleString()}</span></div>
            <div>Credit — Cash/Bank: <span className="text-amber-400 font-mono">{Number(form.amount).toLocaleString()}</span></div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button onClick={handleSubmit} disabled={!isValid || saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />} Post Expense
          </Button>
        </div>
      </div>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label }) {
  return (
    <Link to={to} className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 hover:bg-slate-800 hover:border-emerald-600/30 transition-colors group">
      <div className="p-2 rounded-lg bg-slate-700/50 group-hover:bg-emerald-600/10 group-hover:text-emerald-400 text-slate-400 transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm text-slate-300 group-hover:text-white">{label}</span>
    </Link>
  );
}
