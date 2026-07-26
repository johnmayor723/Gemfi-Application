import React, { useState, useEffect } from 'react';
import { fineractApi } from '@/lib/fineract';
import { Loader2 } from 'lucide-react';
import PageHeader from '@/components/fineract/PageHeader';
import DataTable from '@/components/fineract/DataTable';
import { useToast } from '@/components/ui/use-toast';

export default function FinancialMappings() {
  const { toast } = useToast();
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fineractApi('/financialactivityaccounts');
        setMappings(Array.isArray(res) ? res : []);
      } catch (err) {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'financialActivityData', label: 'Financial Activity', render: (v) => v?.name || '—' },
    { key: 'glAccountData', label: 'GL Account', render: (v) => v ? `${v.glCode} - ${v.name}` : '—' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Financial Activity Mappings" description="Map financial activities to GL accounts" />
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <DataTable columns={columns} data={mappings} loading={loading} emptyMessage="No mappings" />
      </div>
    </div>
  );
}