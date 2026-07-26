import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fineractApi } from '@/lib/fineract';
import { ArrowLeft, Loader2, CheckCircle, DollarSign, XCircle, RotateCcw, Calendar, StickyNote, Ban, FileText, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import StatusBadge from '@/components/fineract/StatusBadge';
import DataTable from '@/components/fineract/DataTable';
import AuditHistoryTab from '@/components/fineract/audit/AuditHistoryTab';
import LoanActions from '@/components/fineract/loan/LoanActions';
import { useToast } from '@/components/ui/use-toast';

export default function LoanDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [repayment, setRepayment] = useState({
    amount: '', date: new Date().toISOString().split('T')[0],
    paymentTypeId: '', accountNumber: '', note: '',
  });

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : null;

  const load = async () => {
    setLoading(true);
    try {
      const l = await fineractApi(`/loans/${id}?associations=repaymentSchedule,transactions,charges`);
      setLoan(l);
      // Pre-fill repayment amount from next installment
      const nextInstallment = (l.repaymentSchedule?.periods || []).find(p => !p.complete);
      if (nextInstallment?.totalOriginalInstallmentAmount) {
        setRepayment(p => ({ ...p, amount: String(nextInstallment.totalOriginalInstallmentAmount) }));
      }
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    fineractApi('/paymenttypes').then(setPaymentTypes).catch(() => {});
    fineractApi(`/loans/${id}/notes`).then(r => setNotes(Array.isArray(r) ? r : [])).catch(() => {});
  }, [id]);

  const handleAction = async (cmd, extraBody = {}) => {
    setSaving(true);
    try {
      const today = fmtDate(new Date());
      const payload = { locale: 'en', dateFormat: 'dd MMMM yyyy', ...extraBody };

      if (cmd === 'repayment') {
        payload.transactionDate = fmtDate(repayment.date);
        payload.transactionAmount = parseFloat(repayment.amount);
        if (repayment.paymentTypeId) payload.paymentTypeId = parseInt(repayment.paymentTypeId);
        if (repayment.accountNumber.trim()) payload.accountNumber = repayment.accountNumber.trim();
        if (repayment.note.trim()) payload.note = repayment.note.trim();
        await fineractApi(`/loans/${id}/transactions?command=repayment`, { method: 'POST', body: payload });
      } else if (cmd === 'writeoff') {
        payload.transactionDate = today;
        await fineractApi(`/loans/${id}/transactions?command=writeoff`, { method: 'POST', body: payload });
      }

      toast({ title: `Loan ${cmd} successful` });
      setActionDialog(null);
      load();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      await fineractApi(`/loans/${id}/notes`, { method: 'POST', body: { note: newNote.trim() } });
      setNewNote('');
      const res = await fineractApi(`/loans/${id}/notes`);
      setNotes(Array.isArray(res) ? res : []);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>;
  }
  if (!loan) {
    return <div className="p-8 text-center text-slate-500">Loan not found</div>;
  }

  const statusVal = loan.status?.value?.toLowerCase() || '';
  const Field = ({ label, value }) => (
    <div><dt className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</dt><dd className="text-sm text-white mt-1">{value ?? '—'}</dd></div>
  );

  const scheduleColumns = [
    { key: 'period', label: 'Period' },
    { key: 'dueDate', label: 'Due Date', render: (v) => v ? v.join('-') : '—' },
    { key: 'principalOriginal', label: 'Principal', render: (v) => v?.toLocaleString() || '—' },
    { key: 'interestOriginal', label: 'Interest', render: (v) => v?.toLocaleString() || '—' },
    { key: 'totalOriginalInstallmentAmount', label: 'Total', render: (v) => v?.toLocaleString() || '—' },
    { key: 'principalLoanBalanceOutstanding', label: 'Balance', render: (v) => v?.toLocaleString() || '—' },
    { key: 'complete', label: 'Status', render: (v) => v ? <span className="text-emerald-400 text-xs">Paid</span> : <span className="text-amber-400 text-xs">Pending</span> },
  ];

  const txColumns = [
    { key: 'date', label: 'Date', render: (v) => v ? v.join('-') : '—' },
    { key: 'type', label: 'Type', render: (v) => v?.value || '—' },
    { key: 'amount', label: 'Amount', render: (v) => v?.toLocaleString() || '—' },
    { key: 'outstandingLoanBalance', label: 'Outstanding', render: (v) => v?.toLocaleString() || '—' },
  ];

  const chargeColumns = [
    { key: 'name', label: 'Charge Name' },
    { key: 'chargeCalculationType', label: 'Calc Type', render: v => v?.value || '—' },
    { key: 'amount', label: 'Amount', render: v => v?.toLocaleString() || '—' },
    { key: 'amountPaid', label: 'Paid', render: v => v?.toLocaleString() || '—' },
    { key: 'amountOutstanding', label: 'Outstanding', render: v => v?.toLocaleString() || '—' },
    { key: 'dueDate', label: 'Due Date', render: v => v ? v.join('-') : '—' },
  ];

  const inputCls = 'mt-1 bg-slate-800 border-slate-700 text-white';
  const selectCls = 'mt-1 w-full h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm';

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <Link to="/loans" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Loans
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{loan.loanProductName}</h1>
          <p className="text-sm text-slate-400 mt-1">#{loan.accountNo} · {loan.clientName}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={loan.status} />
          <LoanActions loanId={id} status={loan.status} onAction={load} />
          {statusVal === 'active' && (
            <>
              <Button size="sm" onClick={() => setActionDialog('repayment')} className="bg-emerald-600 hover:bg-emerald-700">
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Repay
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleAction('writeoff')} disabled={saving} className="border-slate-600 text-slate-300">
                <XCircle className="w-3.5 h-3.5 mr-1" /> Write Off
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Principal" value={loan.principal?.toLocaleString()} icon={DollarSign} color="text-emerald-400" bg="bg-emerald-500/10" />
        <SummaryCard label="Total Expected" value={loan.summary?.totalExpectedRepayment?.toLocaleString()} icon={FileText} color="text-blue-400" bg="bg-blue-500/10" />
        <SummaryCard label="Total Paid" value={loan.summary?.totalRepayment?.toLocaleString()} icon={CheckCircle} color="text-purple-400" bg="bg-purple-500/10" />
        <SummaryCard label="Outstanding" value={loan.summary?.totalOutstanding?.toLocaleString()} icon={Receipt} color="text-amber-400" bg="bg-amber-500/10" />
      </div>

      <Tabs defaultValue="summary">
        <TabsList className="bg-slate-800/50 border border-slate-700/50">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="schedule">Repayment Schedule</TabsTrigger>
          <TabsTrigger value="charges">Charges</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="audit">Audit History</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Loan Details</h2>
              <dl className="grid grid-cols-2 gap-4">
                <Field label="Principal" value={loan.principal?.toLocaleString()} />
                <Field label="Interest Rate" value={`${loan.interestRatePerPeriod}%`} />
                <Field label="# Repayments" value={loan.numberOfRepayments} />
                <Field label="Term" value={`${loan.termFrequency} ${loan.termPeriodFrequencyType?.value || ''}`} />
                <Field label="Currency" value={loan.currency?.displayLabel} />
                <Field label="Disbursement Date" value={loan.timeline?.expectedDisbursementDate?.join('-')} />
              </dl>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Summary</h2>
              <dl className="grid grid-cols-2 gap-4">
                <Field label="Total Expected" value={loan.summary?.totalExpectedRepayment?.toLocaleString()} />
                <Field label="Total Paid" value={loan.summary?.totalRepayment?.toLocaleString()} />
                <Field label="Total Outstanding" value={loan.summary?.totalOutstanding?.toLocaleString()} />
                <Field label="Total Overdue" value={loan.summary?.totalOverdue?.toLocaleString()} />
                <Field label="In Arrears" value={loan.summary?.inArrears ? 'Yes' : 'No'} />
                <Field label="Total Waived" value={loan.summary?.totalWaived?.toLocaleString()} />
              </dl>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700/50">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Calendar className="w-4 h-4 text-emerald-400" /> Repayment Schedule</h2>
            </div>
            <DataTable columns={scheduleColumns} data={loan.repaymentSchedule?.periods || []} emptyMessage="No schedule available" />
          </div>
        </TabsContent>

        <TabsContent value="charges" className="mt-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700/50">
              <h2 className="text-sm font-semibold text-white">Charges</h2>
            </div>
            <DataTable columns={chargeColumns} data={loan.charges || []} emptyMessage="No charges" />
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700/50">
              <h2 className="text-sm font-semibold text-white">Transactions</h2>
            </div>
            <DataTable columns={txColumns} data={loan.transactions || []} emptyMessage="No transactions" />
          </div>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><StickyNote className="w-4 h-4 text-amber-400" /> Notes</h2>
            <div className="space-y-2 mb-4">
              {notes.length === 0 ? <p className="text-sm text-slate-500 py-4">No notes yet</p> :
                notes.map(n => (
                  <div key={n.id} className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-sm text-slate-300">{n.note}</p>
                    <p className="text-xs text-slate-500 mt-1">{n.createdByUsername} · {n.createdOn?.join?.('-') || n.createdOn}</p>
                  </div>
                ))
              }
            </div>
            <div className="space-y-2">
              <Textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a note…" className="bg-slate-800 border-slate-700 text-white" />
              <Button onClick={handleAddNote} disabled={!newNote.trim()} size="sm" className="bg-emerald-600 hover:bg-emerald-700">Add Note</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <AuditHistoryTab entityName="LOAN" resourceId={id} />
        </TabsContent>
      </Tabs>

      {/* Repayment Dialog */}
      <Dialog open={actionDialog === 'repayment'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader><DialogTitle>Make Repayment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300 text-xs">Repayment Amount *</Label>
              <Input type="number" value={repayment.amount} onChange={e => setRepayment(p => ({ ...p, amount: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Repayment Date *</Label>
              <Input type="date" value={repayment.date} onChange={e => setRepayment(p => ({ ...p, date: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Payment Type *</Label>
              <select value={repayment.paymentTypeId} onChange={e => setRepayment(p => ({ ...p, paymentTypeId: e.target.value }))} className={selectCls}>
                <option value="">Select payment type</option>
                {paymentTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Receipt Number</Label>
              <Input value={repayment.accountNumber} onChange={e => setRepayment(p => ({ ...p, accountNumber: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Notes</Label>
              <Textarea value={repayment.note} onChange={e => setRepayment(p => ({ ...p, note: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setActionDialog(null)} className="text-slate-400">Cancel</Button>
            <Button onClick={() => handleAction('repayment')} disabled={saving || !repayment.amount || !repayment.paymentTypeId} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Submit Repayment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-bold text-white">{value ?? '—'}</div>
          <div className="text-xs text-slate-500 mt-0.5">{label}</div>
        </div>
        <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
    </div>
  );
}