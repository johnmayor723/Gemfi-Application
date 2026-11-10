import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fineractApi } from '@/lib/fineract';
import { registerAccount, isAccountServiceConfigured } from '@/lib/accountApi';
import { Plus, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import PageHeader from '@/components/fineract/PageHeader';
import DataTable from '@/components/fineract/DataTable';
import StatusBadge from '@/components/fineract/StatusBadge';
import { useToast } from '@/components/ui/use-toast';
import { useTerminology } from '@/lib/terminology';

export default function Savings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const t = useTerminology();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ clientId: '', productId: '' });

  const urlParams = new URLSearchParams(window.location.search);
  const urlClientId = urlParams.get('clientId');
  useEffect(() => {
    if (urlParams.get('action') === 'create') setShowCreate(true);
    if (urlClientId) setForm(p => ({ ...p, clientId: urlClientId }));
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const params = { limit: 100, orderBy: 'id', sortOrder: 'DESC' };
      if (search) params.sqlSearch = `sa.account_no like '%${search}%'`;
      const res = await fineractApi('/savingsaccounts', { params });
      setAccounts(res.pageItems || []);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
    fineractApi('/savingsproducts').then(setProducts).catch(() => {});
    fineractApi('/clients', { params: { limit: 200 } }).then(r => setClients(r.pageItems || [])).catch(() => {});
  }, []);

  const handleCreate = async () => {
    setSaving(true);
    try {
      const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
      const created = await fineractApi('/savingsaccounts', {
        method: 'POST',
        body: {
          clientId: parseInt(form.clientId),
          productId: parseInt(form.productId),
          locale: 'en',
          dateFormat: 'dd MMMM yyyy',
          submittedOnDate: today,
        }
      });
      toast({ title: `${t.savingsAccounts.replace(/s$/, '')} created` });
      setShowCreate(false);
      loadAccounts();

      // Apache Fineract succeeded - now provision the customer-facing
      // Account Number. A failure here must never look like the savings
      // account itself failed; it's surfaced as a separate warning and
      // can be retried later from the account's own page.
      const fineractAccountId = created?.savingsId ?? created?.resourceId;
      if (isAccountServiceConfigured() && fineractAccountId) {
        try {
          const client = await fineractApi(`/clients/${form.clientId}`);
          const accountNumber = await registerAccount({
            fineractAccountId,
            name: client.displayName,
            phoneNumber: client.mobileNo,
          });
          if (!accountNumber) throw new Error('Account Service did not return an account number.');
          toast({ title: 'Account Number generated', description: accountNumber });
        } catch (accErr) {
          toast({
            title: 'Account Number generation failed',
            description: `${t.savingsAccounts.replace(/s$/, '')} was created, but the Account Number could not be generated: ${accErr.message}. Open the account to retry.`,
            variant: 'destructive',
          });
        }
      }
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'accountNo', label: 'Account #' },
    { key: 'clientName', label: t.clientSingular },
    { key: 'savingsProductName', label: 'Product' },
    { key: 'accountBalance', label: 'Balance', render: (v) => v != null ? v.toLocaleString() : '—' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title={t.savingsAccounts}
        description={`Manage ${t.savingsAccounts.toLowerCase()}`}
        action={
          <Button onClick={() => setShowCreate(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" /> New {t.savings.replace(/s$/, '')}
          </Button>
        }
      />

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadAccounts()}
              placeholder="Search by account #…"
              className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-600" />
          </div>
          <Button onClick={loadAccounts} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">Search</Button>
        </div>
        <DataTable columns={columns} data={accounts} loading={loading} emptyMessage={`No ${t.savingsAccounts.toLowerCase()}`}
          onRowClick={(row) => navigate(`/savings/${row.id}`)} />
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader><DialogTitle>Create {t.savingsAccounts.replace(/s$/, '')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {urlClientId ? (
              <div>
                <Label className="text-slate-300 text-xs">{t.clientSingular}</Label>
                <div className="mt-1 h-10 px-3 flex items-center rounded-md bg-slate-800 border border-emerald-700/30 text-white text-sm">
                  <span className="text-emerald-400 text-xs mr-1.5">🔒</span>
                  {clients.find(c => String(c.id) === String(urlClientId))?.displayName || `${t.clientSingular} #${urlClientId}`}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{t.clientSingular} is locked to the profile being viewed.</p>
              </div>
            ) : (
              <div>
                <Label className="text-slate-300 text-xs">{t.clientSingular} *</Label>
                <select value={form.clientId} onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))}
                  className="mt-1 w-full h-10 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm">
                  <option value="">Select {t.clientSingular.toLowerCase()}</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                </select>
              </div>
            )}
            <div>
              <Label className="text-slate-300 text-xs">{t.savingsProducts.replace(/s$/, '')} *</Label>
              <select value={form.productId} onChange={e => setForm(p => ({ ...p, productId: e.target.value }))}
                className="mt-1 w-full h-10 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm">
                <option value="">Select product</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-slate-400">Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.clientId || !form.productId}
              className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}