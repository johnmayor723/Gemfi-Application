import React, { useState, useEffect } from 'react';
import { fineractApi } from '@/lib/fineract';
import { Search, Loader2, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/fineract/PageHeader';
import DataTable from '@/components/fineract/DataTable';
import { useToast } from '@/components/ui/use-toast';

export default function Compliance() {
  const { toast } = useToast();
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = { limit: 100, orderBy: 'id', sortOrder: 'DESC' };
      if (search) params.sqlSearch = `resource like '%${search}%'`;
      const res = await fineractApi('/audits', { params });
      setAudits(res.pageItems || []);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'actionName', label: 'Action', render: v => <span className="text-emerald-400 font-medium">{v}</span> },
    { key: 'entityName', label: 'Entity' },
    { key: 'resourceId', label: 'Resource ID' },
    { key: 'madeBy', label: 'User' },
    { key: 'madeOnDate', label: 'Date', render: v => v ? v.join('-') : '—' },
    { key: 'checkedOnDate', label: 'Checked', render: v => v ? v.join('-') : '—' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Compliance" description="Audit trail and regulatory compliance" />
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load()}
              placeholder="Search audit trail..."
              className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-600" />
          </div>
          <Button onClick={load} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">Search</Button>
        </div>
        <DataTable columns={columns} data={audits} loading={loading} emptyMessage="No audit entries found" />
      </div>
    </div>
  );
}