import React, { useState, useEffect } from 'react';
import { fineractApi } from '@/lib/fineract';
import { Search, Loader2, ArrowDownCircle, Check, ChevronRight, User, PiggyBank, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/fineract/PageHeader';
import StatusBadge from '@/components/fineract/StatusBadge';
import { useToast } from '@/components/ui/use-toast';

export default function Deposit() {
  const { toast } = useToast();
  const [step, setStep] = useState(0); // 0=select client, 1=select account, 2=deposit form, 3=success
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingClients, setLoadingClients] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [amount, setAmount] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentTypeId, setPaymentTypeId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fineractApi('/clients', { params: { limit: 200 } })
      .then(r => setClients(r.pageItems || []))
      .catch(err => toast({ title: 'Error', description: err.message, variant: 'destructive' }))
      .finally(() => setLoadingClients(false));
    fineractApi('/paymenttypes').then(setPaymentTypes).catch(() => {});
  }, []);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : null;

  const selectClient = async (client) => {
    setSelectedClient(client);
    setStep(1);
    setLoadingAccounts(true);
    setAccounts([]);
    try {
      const res = await fineractApi('/savingsaccounts', { params: { clientId: client.id } });
      setAccounts(res.pageItems || res || []);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoadingAccounts(false);
    }
  };

  const activeAccounts = accounts.filter(a => a.status?.value?.toLowerCase() === 'active');

  const submitDeposit = async () => {
    if (!amount || !paymentTypeId || !txDate) {
      toast({ title: 'Error', description: 'Amount, date, and payment type are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await fineractApi(`/savingsaccounts/${selectedAccount.id}/transactions?command=deposit`, {
        method: 'POST',
        body: {
          transactionDate: fmtDate(txDate),
          transactionAmount: parseFloat(amount),
          paymentTypeId: parseInt(paymentTypeId),
          locale: 'en',
          dateFormat: 'dd MMMM yyyy',
        }
      });
      toast({ title: 'Deposit successful' });
      // Reload the account to show updated balance
      const updated = await fineractApi(`/savingsaccounts/${selectedAccount.id}`);
      setAccounts(prev => prev.map(a => a.id === selectedAccount.id ? updated : a));
      setSelectedAccount(updated);
      setStep(3);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setStep(0);
    setSelectedClient(null);
    setSelectedAccount(null);
    setAccounts([]);
    setAmount('');
    setPaymentTypeId('');
    setTxDate(new Date().toISOString().split('T')[0]);
  };

  const filteredClients = clients.filter(c =>
    !search || c.displayName?.toLowerCase().includes(search.toLowerCase()) || c.accountNo?.includes(search)
  );

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader title="Deposit" description="Post a deposit to an active savings account" />

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-6 text-xs">
        <StepBadge num={1} label="Select Customer" active={step >= 0} done={step > 0} />
        <ChevronRight className="w-3 h-3 text-slate-600" />
        <StepBadge num={2} label="Select Account" active={step >= 1} done={step > 1} />
        <ChevronRight className="w-3 h-3 text-slate-600" />
        <StepBadge num={3} label="Deposit" active={step >= 2} done={step > 2} />
      </div>

      {/* Step 0: Select Customer */}
      {step === 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700/50 flex gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers…"
                className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-600" />
            </div>
          </div>
          {loadingClients ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {filteredClients.map(c => (
                <button key={c.id} onClick={() => selectClient(c)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm text-white font-medium">{c.displayName}</div>
                      <div className="text-xs text-slate-500">#{c.accountNo} · {c.mobileNo || 'No phone'}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              ))}
              {filteredClients.length === 0 && <div className="p-8 text-center text-slate-500 text-sm">No customers found</div>}
            </div>
          )}
        </div>
      )}

      {/* Step 1: Select Active Savings Account */}
      {step === 1 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setStep(0)} className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-300">Customer: <span className="text-white font-medium">{selectedClient?.displayName}</span></span>
          </div>
          {loadingAccounts ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>
          ) : activeAccounts.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center">
              <PiggyBank className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No active savings account found.</p>
              <p className="text-xs text-slate-500 mt-1">Create or activate a savings account before accepting deposits.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeAccounts.map(a => (
                <button key={a.id} onClick={() => { setSelectedAccount(a); setStep(2); }}
                  className="w-full flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <PiggyBank className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-sm text-white font-medium">{a.savingsProductName || a.productName}</div>
                      <div className="text-xs text-slate-500">#{a.accountNo}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm text-white font-medium">{a.accountBalance?.toLocaleString() ?? '—'}</div>
                      <div className="text-[10px] text-slate-500">Balance</div>
                    </div>
                    <StatusBadge status={a.status} />
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Deposit Form */}
      {step === 2 && selectedAccount && (
        <div className="max-w-md">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-300">Account: <span className="text-white font-medium">#{selectedAccount.accountNo}</span></span>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 space-y-4">
            <div className="bg-slate-900/50 rounded-lg p-3 flex justify-between">
              <span className="text-xs text-slate-500">Current Balance</span>
              <span className="text-sm text-white font-medium">{selectedAccount.accountBalance?.toLocaleString() ?? '—'}</span>
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Deposit Amount *</Label>
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                className="mt-1 bg-slate-900 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Transaction Date *</Label>
              <Input type="date" value={txDate} onChange={e => setTxDate(e.target.value)}
                className="mt-1 bg-slate-900 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Payment Type *</Label>
              <select value={paymentTypeId} onChange={e => setPaymentTypeId(e.target.value)}
                className="mt-1 w-full h-9 px-3 rounded-md bg-slate-900 border border-slate-700 text-white text-sm">
                <option value="">Select payment type</option>
                {paymentTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
              </select>
            </div>
            <Button onClick={submitDeposit} disabled={saving || !amount || !paymentTypeId}
              className="w-full bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowDownCircle className="w-4 h-4 mr-2" />}
              Submit Deposit
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && selectedAccount && (
        <div className="max-w-md">
          <div className="bg-slate-800/50 border border-emerald-500/30 rounded-xl p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">Deposit Successful</h2>
            <p className="text-sm text-slate-400 mb-4">Posted to account #{selectedAccount.accountNo}</p>
            <div className="bg-slate-900/50 rounded-lg p-4 space-y-2 text-left">
              <div className="flex justify-between"><span className="text-xs text-slate-500">New Balance</span><span className="text-sm text-white font-medium">{selectedAccount.summary?.accountBalance?.toLocaleString() ?? selectedAccount.accountBalance?.toLocaleString() ?? '—'}</span></div>
              <div className="flex justify-between"><span className="text-xs text-slate-500">Available Balance</span><span className="text-sm text-white">{selectedAccount.summary?.availableBalance?.toLocaleString() ?? '—'}</span></div>
              <div className="flex justify-between"><span className="text-xs text-slate-500">Total Deposits</span><span className="text-sm text-white">{selectedAccount.summary?.totalDeposits?.toLocaleString() ?? '—'}</span></div>
            </div>
            <div className="flex gap-2 mt-5">
              <Button onClick={reset} variant="outline" className="flex-1 border-slate-600 text-slate-300">New Deposit</Button>
              <Button onClick={() => window.location.href = `/savings/${selectedAccount.id}`} className="flex-1 bg-emerald-600 hover:bg-emerald-700">View Account</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepBadge({ num, label, active, done }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
        done ? 'bg-emerald-600 text-white' : active ? 'border-2 border-emerald-500 text-emerald-400' : 'border-2 border-slate-700 text-slate-600'
      }`}>{done ? <Check className="w-3 h-3" /> : num}</div>
      <span className={active ? 'text-slate-300' : 'text-slate-600'}>{label}</span>
    </div>
  );
}