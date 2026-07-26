import React, { useState } from 'react';
import { fineractApi } from '@/lib/fineract';
import { CheckCircle, Ban, DollarSign, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : null;

export default function LoanActions({ loanId, status, onAction, size = 'sm' }) {
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
      const base = { locale: 'en', dateFormat: 'dd MMMM yyyy' };
      let endpoint, payload;

      if (dialog === 'approve') {
        payload = { ...base, approvedOnDate: fmtDate(form.date) };
        if (form.note.trim()) payload.note = form.note.trim();
        endpoint = `/loans/${loanId}?command=approve`;
      } else if (dialog === 'reject') {
        payload = { ...base, rejectedOnDate: fmtDate(form.date) };
        if (form.note.trim()) payload.note = form.note.trim();
        endpoint = `/loans/${loanId}?command=reject`;
      } else if (dialog === 'disburse') {
        payload = { ...base, actualDisbursementDate: fmtDate(form.date), transactionAmount: parseFloat(form.amount) };
        if (form.note.trim()) payload.note = form.note.trim();
        endpoint = `/loans/${loanId}?command=disburse`;
      } else if (dialog === 'undoDisburse') {
        payload = { ...base };
        if (form.note.trim()) payload.note = form.note.trim();
        endpoint = `/loans/${loanId}?command=undoDisbursal`;
      }

      await fineractApi(endpoint, { method: 'POST', body: payload });
      toast({ title: `Loan ${dialog === 'undoDisburse' ? 'disbursal undone' : dialog + 'd'} successfully` });
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
    reject: 'Reject Loan',
    disburse: 'Disburse Loan',
    undoDisburse: 'Undo Disbursement',
  }[dialog];

  const dateLabel = {
    approve: 'Approval Date',
    reject: 'Rejection Date',
    disburse: 'Disbursement Date',
  }[dialog];

  return (
    <>
      {statusVal === 'submitted and pending approval' && (
        <div className="flex gap-1.5">
          <Button size={size} onClick={() => setDialog('approve')} className="bg-blue-600 hover:bg-blue-700">
            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
          </Button>
          <Button size={size} variant="outline" onClick={() => setDialog('reject')} className="border-rose-600 text-rose-400">
            <Ban className="w-3.5 h-3.5 mr-1" /> Reject
          </Button>
        </div>
      )}
      {statusVal === 'approved' && (
        <Button size={size} onClick={() => setDialog('disburse')} className="bg-emerald-600 hover:bg-emerald-700">
          <DollarSign className="w-3.5 h-3.5 mr-1" /> Disburse
        </Button>
      )}
      {statusVal === 'active' && (
        <Button size={size} variant="outline" onClick={() => setDialog('undoDisburse')} className="border-amber-600 text-amber-400">
          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Undo Disburse
        </Button>
      )}

      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader><DialogTitle>{dialogTitle}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {dialog === 'disburse' && (
              <div>
                <Label className="text-slate-300 text-xs">Disbursement Amount *</Label>
                <Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} className={inputCls} />
              </div>
            )}
            {dialog !== 'undoDisburse' && (
              <div>
                <Label className="text-slate-300 text-xs">{dateLabel} *</Label>
                <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className={inputCls} />
              </div>
            )}
            <div>
              <Label className="text-slate-300 text-xs">{dialog === 'reject' ? 'Rejection Reason' : 'Note'}</Label>
              <Textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog(null)} className="text-slate-400">Cancel</Button>
            <Button onClick={submit} disabled={saving || (dialog === 'disburse' && !form.amount)} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}