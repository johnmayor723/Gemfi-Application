import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fineractApi } from '@/lib/fineract';
import { Plus, Search, Eye, Edit, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/fineract/PageHeader';
import DataTable from '@/components/fineract/DataTable';
import { useToast } from '@/components/ui/use-toast';

export default function LoanProducts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fineractApi('/loanproducts');
      let items = Array.isArray(res) ? res : [];
      if (search) {
        const s = search.toLowerCase();
        items = items.filter(p => p.name?.toLowerCase().includes(s) || p.shortName?.toLowerCase().includes(s));
      }
      setProducts(items);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const columns = [
    { key: 'name', label: 'Product Name', render: (v) => <span className="text-white font-medium">{v}</span> },
    { key: 'currency', label: 'Currency', render: (v) => v?.displayLabel || '—' },
    { key: 'principal', label: 'Principal Range', render: (v, row) => {
      const min = row.minPrincipal != null ? row.minPrincipal.toLocaleString() : '';
      const max = row.maxPrincipal != null ? row.maxPrincipal.toLocaleString() : '';
      if (min && max) return `${min} – ${max}`;
      return v?.toLocaleString() || '—';
    }},
    { key: 'interestRatePerPeriod', label: 'Interest Rate', render: (v) => v != null ? `${v}%` : '—' },
    { key: 'repaymentEvery', label: 'Repayment Freq.', render: (v, row) => `${v || '—'} ${row.repaymentFrequencyType?.value || ''}` },
    { key: 'accountingRule', label: 'Accounting', render: (v) => {
      const rule = typeof v === 'object' ? v?.value : { 1: 'None', 2: 'Cash', 3: 'Accrual' }[v];
      if (!rule) return '—';
      const cls = String(rule).toLowerCase().includes('cash') ? 'text-emerald-400'
        : String(rule).toLowerCase().includes('accrual') ? 'text-blue-400' : 'text-slate-500';
      return <span className={`text-xs font-medium ${cls}`}>{rule}</span>;
    }},
    { key: 'status', label: 'Status', render: (v, row) => row.closeDate ? <span className="text-rose-400 text-xs">Closed</span> : <span className="text-emerald-400 text-xs">Active</span> },
    { key: 'actions', label: 'Actions', render: (_, row) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/products/loan/${row.id}`); }} className="text-slate-300 hover:text-white h-7 px-2 text-xs">
          <Eye className="w-3 h-3 mr-1" /> View
        </Button>
        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/products/loan/${row.id}/edit`); }} className="text-amber-400 hover:text-amber-300 h-7 px-2 text-xs">
          <Edit className="w-3 h-3 mr-1" /> Edit
        </Button>
        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/clients?action=apply&productId=${row.id}`); }} className="text-emerald-400 hover:text-emerald-300 h-7 px-2 text-xs">
          Use for Loan <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
    )},
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Loan Products" description="View, create, and manage loan product configurations"
        action={<Button onClick={() => navigate('/products/loan/create')} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" /> Create Loan Product</Button>} />

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()}
              placeholder="Search products…" className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-600" />
          </div>
          <Button onClick={load} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">Search</Button>
        </div>
        <DataTable columns={columns} data={products} loading={loading} emptyMessage="No loan products" onRowClick={(row) => navigate(`/products/loan/${row.id}`)} />
      </div>
    </div>
  );
}