import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fineractApi } from '@/lib/fineract';
import { ArrowLeft, Loader2, CheckCircle, ArrowDownCircle, ArrowUpCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import StatusBadge from '@/components/fineract/StatusBadge';
import DataTable from '@/components/fineract/DataTable';
import AuditHistoryTab from '@/components/fineract/audit/AuditHistoryTab';
import AccountIdentifiers from '@/components/fineract/savings/AccountIdentifiers';
import { useToast } from '@/components/ui/use-toast';

export default function SavingsDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [txDialog, setTxDialog] = useState(null);
  const [amount, setAmount] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [paymentTypeId, setPaymentTypeId] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const a = await fineractApi(`/savingsaccounts/${id}?associations=transactions`);
      setAccount(a);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    fineractApi('/paymenttypes').then(setPaymentTypes).catch(() => {});
    const action = new URLSearchParams(window.location.search).get('action');
    if (action === 'deposit' || action === 'withdrawal') {
      setTxDialog(action);
    }
  }, []);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : null;

  const handleCommand = async (cmd, body = {}) => {
    setSaving(true);
    try {
      const today = fmtDate(new Date());
      const payload = { locale: 'en', dateFormat: 'dd MMMM yyyy', ...body };

      if (cmd === 'approve') {
        payload.approvedOnDate = today;
        await fineractApi(`/savingsaccounts/${id}?command=approve`, { method: 'POST', body: payload });
      } else if (cmd === 'activate') {
        payload.activatedOnDate = today;
        await fineractApi(`/savingsaccounts/${id}?command=activate`, { method: 'POST', body: payload });
      } else if (cmd === 'deposit' || cmd === 'withdrawal') {
        payload.transactionDate = fmtDate(txDate);
        payload.transactionAmount = parseFloat(amount);
        payload.paymentTypeId = parseInt(paymentTypeId);
        await fineractApi(`/savingsaccounts/${id}/transactions?command=${cmd}`, { method: 'POST', body: payload });
      } else if (cmd === 'close') {
        payload.closedOnDate = today;
        await fineractApi(`/savingsaccounts/${id}?command=close`, { method: 'POST', body: payload });
      }

      toast({ title: `${cmd} successful` });
      setTxDialog(null);
      setAmount('');
      setPaymentTypeId('');
      setTxDate(new Date().toISOString().split('T')[0]);
      load();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>;
  }

  if (!account) {
    return <div className="p-8 text-center text-slate-500">Account not found</div>;
  }

  const statusVal = account.status?.value?.toLowerCase() || '';
  const Field = ({ label, value }) => (
    <div>
      <dt className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</dt>
      <dd className="text-sm text-white mt-1">{value ?? '—'}</dd>
    </div>
  );

  const txColumns = [
    { key: 'date', label: 'Date', render: (v) => v ? v.join('-') : '—' },
    { key: 'transactionType', label: 'Type', render: (v) => v?.value || '—' },
    { key: 'amount', label: 'Amount', render: (v) => v?.toLocaleString() || '—' },
    { key: 'runningBalance', label: 'Balance', render: (v) => v?.toLocaleString() || '—' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <Link to="/savings" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Savings
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{account.savingsProductName}</h1>
          <p className="text-sm text-slate-400 mt-1">#{account.accountNo} · {account.clientName}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={account.status} />
          {statusVal === 'submitted and pending approval' && (
            <Button size="sm" onClick={() => handleCommand('approve')} className="bg-blue-600 hover:bg-blue-700">
              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
            </Button>
          )}
          {statusVal === 'approved' && (
            <Button size="sm" onClick={() => handleCommand('activate')} className="bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Activate
            </Button>
          )}
          {statusVal === 'active' && (
            <>
              <Button size="sm" onClick={() => setTxDialog('deposit')} className="bg-emerald-600 hover:bg-emerald-700">
                <ArrowDownCircle className="w-3.5 h-3.5 mr-1" /> Deposit
              </Button>
              <Button size="sm" onClick={() => setTxDialog('withdrawal')} className="bg-amber-600 hover:bg-amber-700">
                <ArrowUpCircle className="w-3.5 h-3.5 mr-1" /> Withdraw
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleCommand('close')} className="border-slate-600 text-slate-300">
                <XCircle className="w-3.5 h-3.5 mr-1" /> Close
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-slate-800/50 border border-slate-700/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="audit">Audit History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Account Details</h2>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Field label="Balance" value={account.summary?.accountBalance?.toLocaleString()} />
              <Field label="Available Balance" value={account.summary?.availableBalance?.toLocaleString()} />
              <Field label="Total Deposits" value={account.summary?.totalDeposits?.toLocaleString()} />
              <Field label="Total Withdrawals" value={account.summary?.totalWithdrawals?.toLocaleString()} />
              <Field label="Interest Rate" value={`${account.nominalAnnualInterestRate}%`} />
              <Field label="Currency" value={account.currency?.displayLabel} />
              <Field label="Min Balance" value={account.minRequiredBalance?.toLocaleString()} />
              <Field label="Interest Compounding" value={account.interestCompoundingPeriodType?.value} />
            </dl>
          </div>
          <AccountIdentifiers fineractAccountId={id} clientId={account.clientId} clientName={account.clientName} />
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700/50">
              <h2 className="text-sm font-semibold text-white">Transactions</h2>
            </div>
            <DataTable columns={txColumns} data={account.transactions || []} emptyMessage="No transactions" />
          </div>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <AuditHistoryTab entityName="SAVINGS_ACCOUNT" resourceId={id} />
        </TabsContent>
      </Tabs>

      <Dialog open={!!txDialog} onOpenChange={() => setTxDialog(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader><DialogTitle>{txDialog === 'deposit' ? 'Make Deposit' : 'Make Withdrawal'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-slate-300 text-xs">Amount *</Label>
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                className="mt-1 bg-slate-800 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Transaction Date *</Label>
              <Input type="date" value={txDate} onChange={e => setTxDate(e.target.value)}
                className="mt-1 bg-slate-800 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Payment Type *</Label>
              <select value={paymentTypeId} onChange={e => setPaymentTypeId(e.target.value)}
                className="mt-1 w-full h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm">
                <option value="">Select payment type</option>
                {paymentTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTxDialog(null)} className="text-slate-400">Cancel</Button>
            <Button onClick={() => handleCommand(txDialog)} disabled={saving || !amount || !paymentTypeId}
              className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}