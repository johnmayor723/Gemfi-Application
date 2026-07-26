import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fineractApi } from '@/lib/fineract';
import { Plus, Search, Eye, Edit, Copy, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import PageHeader from '@/components/fineract/PageHeader';
import DataTable from '@/components/fineract/DataTable';
import { useToast } from '@/components/ui/use-toast';

export default function SavingsProducts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fineractApi('/savingsproducts');
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fineractApi(`/savingsproducts/${deleteTarget.id}`, { method: 'DELETE' });
      toast({ title: 'Product deleted' });
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicate = (product) => {
    navigate('/products/savings/create', { state: { duplicateId: product.id } });
  };

  const columns = [
    { key: 'name', label: 'Product Name', render: (v) => <span className="text-white font-medium">{v}</span> },
    { key: 'shortName', label: 'Short Name' },
    { key: 'currency', label: 'Currency', render: (v) => v?.displayLabel || '—' },
    { key: 'nominalAnnualInterestRate', label: 'Interest Rate', render: (v) => v != null ? `${v}%` : '—' },
    { key: 'accountingRule', label: 'Accounting Rule', render: (v) => v?.value || '—' },
    { key: 'status', label: 'Status', render: (v, row) => row.dormancyTrackingActive ? <span className="text-amber-400 text-xs">Dormancy Tracked</span> : <span className="text-emerald-400 text-xs">Active</span> },
    { key: 'actions', label: 'Actions', render: (_, row) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/products/savings/${row.id}/edit`); }} className="text-slate-300 hover:text-white h-7 px-2 text-xs">
          <Eye className="w-3 h-3 mr-1" /> View
        </Button>
        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/products/savings/${row.id}/edit`); }} className="text-amber-400 hover:text-amber-300 h-7 px-2 text-xs">
          <Edit className="w-3 h-3 mr-1" /> Edit
        </Button>
        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDuplicate(row); }} className="text-blue-400 hover:text-blue-300 h-7 px-2 text-xs">
          <Copy className="w-3 h-3 mr-1" /> Duplicate
        </Button>
        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }} className="text-rose-400 hover:text-rose-300 h-7 px-2 text-xs">
          <Trash2 className="w-3 h-3 mr-1" /> Delete
        </Button>
      </div>
    )},
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Savings Products" description="View, create, and manage savings product configurations"
        action={<Button onClick={() => navigate('/products/savings/create')} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" /> Create Savings Product</Button>} />

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()}
              placeholder="Search products…" className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-600" />
          </div>
          <Button onClick={load} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">Search</Button>
        </div>
        <DataTable columns={columns} data={products} loading={loading} emptyMessage="No savings products"
          onRowClick={(row) => navigate(`/products/savings/${row.id}/edit`)} />
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader><DialogTitle>Delete Savings Product</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-300">Are you sure you want to delete <span className="text-white font-medium">{deleteTarget?.name}</span>? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} className="text-slate-400">Cancel</Button>
            <Button onClick={handleDelete} disabled={deleting} className="bg-rose-600 hover:bg-rose-700">
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}