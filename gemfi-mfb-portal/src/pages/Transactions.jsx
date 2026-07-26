import React, { useState, useEffect } from 'react';
import { fineractApi } from '@/lib/fineract';
import { Search, Loader2, ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/fineract/PageHeader';
import DataTable from '@/components/fineract/DataTable';
import { useToast } from '@/components/ui/use-toast';

export default function Transactions() {
  const { toast } = useToast();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = { limit: 100, orderBy: 'id', sortOrder: 'DESC' };
      if (search) params.sqlSearch = `transaction_id like '%${search}%'`;
      const res = await fineractApi('/journalentries', { params });
      setEntries(res.pageItems || []);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const columns = [
    { key: 'transactionId', label: 'Transaction ID' },
    { key: 'transactionDate', label: 'Date', render: v => v ? v.join('-') : '—' },
    { key: 'officeName', label: 'Office' },
    { key: 'glAccountName', label: 'GL Account' },
    { key: 'glAccountCode', label: 'Code' },
    { key: 'debit', label: 'Debit', render: v => v ? <span className="text-rose-400">{v.toLocaleString()}</span> : '—' },
    { key: 'credit', label: 'Credit', render: v => v ? <span className="text-emerald-400">{v.toLocaleString()}</span> : '—' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Transactions" description="Journal entries and account transfers" />
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load()}
              placeholder="Search by transaction ID..."
              className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-600" />
          </div>
          <Button onClick={load} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">Search</Button>
        </div>
        <DataTable columns={columns} data={entries} loading={loading} emptyMessage="No transactions found" />
      </div>
    </div>
  );
}