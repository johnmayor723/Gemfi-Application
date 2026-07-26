import React, { useState } from 'react';
import { fineractApi } from '@/lib/fineract';
import {
  CheckCircle, DollarSign, RotateCcw, Loader2, Eye,
  RotateCw, Percent, XCircle, Archive, CalendarClock,
  RefreshCw, SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : null;

// Loan servicing transactions (implemented)
const SERVICING_ACTIONS = [
  { key: 'repayment', label: 'Repayment', icon: RotateCw, color: 'border-emerald-600 text-emerald-400 hover:bg-emerald-500/10' },
  { key: 'waiveInterest', label: 'Waive Interest', icon: Percent, color: 'border-amber-600 text-amber-400 hover:bg-amber-500/10' },
  { key: 'writeOff', label: 'Write Off', icon: XCircle, color: 'border-rose-600 text-rose-400 hover:bg-rose-500/10' },
];

// Actions not yet implemented — shown disabled with "Coming Soon" label
const COMING_SOON_ACTIONS = [
  { key: 'closeLoan', label: 'Close Loan', icon: Archive },
  { key: 'reschedule', label: 'Reschedule Loan', icon: CalendarClock },
  { key: 'refunds', label: 'Refunds', icon: RefreshCw },
  { key: 'chargeAdjustments', label: 'Charge Adjustments', icon: SlidersHorizontal },
];

export default function LoanWorkflowActions({ loanId, status, loan, onAction, size = 'sm' }) {
  const { toast } = useToast();
  const [dialog, setDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    note: '',
    amount: '',
  });

  const statusVal = status?.value?.toLowerCase() || '';

  const submit = async () => {
    setSaving(true);
    try {
      let endpoint, payload;

      if (dialog === 'approve') {
        // POST /loans/{loanId}?command=approve
        payload = {
          approvedOnDate: fmtDate(form.date),
          dateFormat: 'dd MMMM yyyy',
          locale: 'en',
        };
        endpoint = `/loans/${loanId}?command=approve`;
      } else if (dialog === 'disburse') {
        // POST /loans/{loanId}?command=disburse
        payload = {
          actualDisbursementDate: fmtDate(form.date),
          transactionAmount: parseFloat(form.amount),
          dateFormat: 'dd MMMM yyyy',
          locale: 'en',
        };
        endpoint = `/loans/${loanId}?command=disburse`;
      } else if (dialog === 'reverseDisbursement') {
        // POST /loans/{loanId}?command=undodisbursal
        payload = { note: form.note.trim() || 'Undo disbursement' };
        endpoint = `/loans/${loanId}?command=undodisbursal`;
      } else if (dialog === 'repayment') {
        // POST /loans/{loanId}/transactions?command=repayment
        payload = {
          transactionDate: fmtDate(form.date),
          transactionAmount: parseFloat(form.amount),
          dateFormat: 'dd MMMM yyyy',
          locale: 'en',
        };
        endpoint = `/loans/${loanId}/transactions?command=repayment`;
      } else if (dialog === 'waiveInterest') {
        // POST /loans/{loanId}/transactions?command=waiveinterest
        payload = {
          transactionDate: fmtDate(form.date),
          transactionAmount: parseFloat(form.amount),
          dateFormat: 'dd MMMM yyyy',
          locale: 'en',
        };
        endpoint = `/loans/${loanId}/transactions?command=waiveinterest`;
      } else if (dialog === 'writeOff') {
        // POST /loans/{loanId}/transactions?command=writeoff
        payload = {
          transactionDate: fmtDate(form.date),
          dateFormat: 'dd MMMM yyyy',
          locale: 'en',
        };
        endpoint = `/loans/${loanId}/transactions?command=writeoff`;
      }

      await fineractApi(endpoint, { method: 'POST', body: payload });
      const verbMap = {
        reverseDisbursement: 'disbursement reversed',
        repayment: 'repayment recorded',
        waiveInterest: 'interest waived',
        writeOff: 'loan written off',
      };
      const verb = verbMap[dialog] || dialog + 'd';
      toast({ title: `Loan ${verb} successfully` });
      setDialog(null);
      setForm({ date: new Date().toISOString().split('T')[0], note: '', amount: '' });
      if (onAction) onAction();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'mt-1 bg-slate-800 border-slate-700 text-white';

  const dialogTitle = {
    approve: 'Approve Loan',
    disburse: 'Disburse Loan',
    reverseDisbursement: 'Reverse Disbursement',
    repayment: 'Loan Repayment',
    waiveInterest: 'Waive Interest',
    writeOff: 'Write Off Loan',
  }[dialog];

  const dateLabel = {
    approve: 'Approval Date',
    disburse: 'Disbursement Date',
    repayment: 'Transaction Date',
    waiveInterest: 'Transaction Date',
    writeOff: 'Transaction Date',
  }[dialog];

  // Dialogs that require an amount input
  const needsAmount = ['disburse', 'repayment', 'waiveInterest'].includes(dialog);
  // Dialogs that require a date input
  const needsDate = ['approve', 'disburse', 'repayment', 'waiveInterest', 'writeOff'].includes(dialog);
  const amountLabel = {
    disburse: 'Disbursement Amount *',
    repayment: 'Repayment Amount *',
    waiveInterest: 'Interest Amount to Waive *',
  }[dialog];

  // Pre-fill disbursement amount with the loan principal
  const openDialog = (d) => {
    if (d === 'disburse' && loan?.principal) {
      setForm(p => ({ ...p, amount: String(loan.principal) }));
    } else if (d !== 'disburse') {
      setForm(p => ({ ...p, amount: '' }));
    }
    setDialog(d);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* View is always available — handled by parent panel */}
        {statusVal === 'submitted and pending approval' && (
          <Button size={size} onClick={() => openDialog('approve')} className="bg-blue-600 hover:bg-blue-700">
            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
          </Button>
        )}
        {statusVal === 'approved' && (
          <Button size={size} onClick={() => openDialog('disburse')} className="bg-emerald-600 hover:bg-emerald-700">
            <DollarSign className="w-3.5 h-3.5 mr-1" /> Disburse
          </Button>
        )}
        {statusVal === 'active' && (
          <Button size={size} variant="outline" onClick={() => openDialog('reverseDisbursement')} className="border-amber-600 text-amber-400 hover:bg-amber-500/10">
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reverse Disbursement
          </Button>
        )}

        {/* Servicing transactions — available for active loans */}
        {statusVal === 'active' && SERVICING_ACTIONS.map(a => {
          const Icon = a.icon;
          return (
            <Button
              key={a.key}
              size={size}
              variant="outline"
              onClick={() => openDialog(a.key)}
              className={a.color}
            >
              <Icon className="w-3.5 h-3.5 mr-1" /> {a.label}
            </Button>
          );
        })}

        {/* Coming Soon — disabled actions */}
        {statusVal === 'active' && COMING_SOON_ACTIONS.map(a => {
          const Icon = a.icon;
          return (
            <Button
              key={a.key}
              size={size}
              variant="outline"
              disabled
              title="Coming Soon"
              className="border-slate-700 text-slate-600 cursor-not-allowed opacity-60"
            >
              <Icon className="w-3.5 h-3.5 mr-1" /> {a.label}
              <span className="ml-1 text-[9px] uppercase tracking-wider bg-slate-800 px-1 py-0.5 rounded">Soon</span>
            </Button>
          );
        })}
      </div>

      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader><DialogTitle>{dialogTitle}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {needsAmount && (
              <div>
                <Label className="text-slate-300 text-xs">{amountLabel}</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} className={inputCls} />
              </div>
            )}
            {needsDate && (
              <div>
                <Label className="text-slate-300 text-xs">{dateLabel} *</Label>
                <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className={inputCls} />
              </div>
            )}
            <div>
              <Label className="text-slate-300 text-xs">Note</Label>
              <Textarea
                value={form.note}
                onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                placeholder={dialog === 'reverseDisbursement' ? 'Undo disbursement' : 'Optional note…'}
                className={inputCls}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog(null)} className="text-slate-400">Cancel</Button>
            <Button
              onClick={submit}
              disabled={saving || (needsAmount && !form.amount)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}