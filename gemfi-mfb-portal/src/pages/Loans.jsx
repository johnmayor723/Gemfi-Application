import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fineractApi } from '@/lib/fineract';
import { Plus, Search, Loader2, Package, FileText, CheckCircle, DollarSign, XCircle, Clock, CreditCard, Ban, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import PageHeader from '@/components/fineract/PageHeader';
import DataTable from '@/components/fineract/DataTable';
import StatusBadge from '@/components/fineract/StatusBadge';
import { useToast } from '@/components/ui/use-toast';

const TABS = [
  { key: 'applications', label: 'Loan Applications', filter: () => true },
  { key: 'active', label: 'Active Loans', filter: (l) => l.status?.value?.toLowerCase() === 'active' },
  { key: 'pending', label: 'Pending Approval', filter: (l) => l.status?.value?.toLowerCase() === 'submitted and pending approval' },
  { key: 'approved', label: 'Approved Loans', filter: (l) => l.status?.value?.toLowerCase() === 'approved' },
  { key: 'disbursed', label: 'Disbursed Loans', filter: (l) => ['active', 'closed'].includes(l.status?.value?.toLowerCase()) },
  { key: 'closed', label: 'Closed Loans', filter: (l) => l.status?.value?.toLowerCase() === 'closed' },
  { key: 'repayments', label: 'Loan Repayments', filter: (l) => ['active', 'overpaid'].includes(l.status?.value?.toLowerCase()) },
];

export default function Loans() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('applications');

  const loadLoans = async () => {
    setLoading(true);
    try {
      const params = { limit: 200, orderBy: 'id', sortOrder: 'DESC' };
      if (search) params.sqlSearch = `l.account_no like '%${search}%'`;
      const res = await fineractApi('/loans', { params });
      setLoans(res.pageItems || []);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLoans(); }, []);

  const columns = [
    { key: 'accountNo', label: 'Account #' },
    { key: 'clientName', label: 'Client' },
    { key: 'loanProductName', label: 'Product' },
    { key: 'principal', label: 'Principal', render: (v) => v ? v.toLocaleString() : '—' },
    { key: 'loanBalance', label: 'Balance', render: (v) => v != null ? v.toLocaleString() : '—' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
  ];

  const stats = {
    total: loans.length,
    active: loans.filter(l => l.status?.value?.toLowerCase() === 'active').length,
    pending: loans.filter(l => l.status?.value?.toLowerCase() === 'submitted and pending approval').length,
    closed: loans.filter(l => l.status?.value?.toLowerCase() === 'closed').length,
  };

  const cards = [
    { label: 'Total Loans', value: stats.total, icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Active', value: stats.active, icon: CheckCircle, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Closed', value: stats.closed, icon: XCircle, color: 'text-slate-400', bg: 'bg-slate-500/10' },
  ];

  const activeTab = TABS.find(t => t.key === tab);
  const filteredLoans = loans.filter(activeTab.filter);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Loans"
        description="Manage loan products, applications, and repayments"
        action={
          <div className="flex gap-2">
            <Button onClick={() => navigate('/products/loan/create')} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
              <Package className="w-4 h-4 mr-2" /> Create Product
            </Button>
            <Button onClick={() => navigate('/products/loan')} className="bg-slate-700 hover:bg-slate-600">
              <FileText className="w-4 h-4 mr-2" /> Loan Products
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">{c.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{c.label}</div>
                </div>
                <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${c.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between gap-3 flex-wrap">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="bg-slate-900/50 border border-slate-700/50 flex-wrap h-auto">
              {TABS.map(t => <TabsTrigger key={t.key} value={t.key} className="text-xs">{t.label}</TabsTrigger>)}
            </TabsList>
          </Tabs>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadLoans()}
                placeholder="Search account #…" className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 w-56" />
            </div>
            <Button onClick={loadLoans} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">Search</Button>
          </div>
        </div>
        <DataTable columns={columns} data={filteredLoans} loading={loading} emptyMessage={`No ${activeTab.label.toLowerCase()} found`}
          onRowClick={(row) => navigate(`/loans/${row.id}`)} />
      </div>
    </div>
  );
}