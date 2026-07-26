import React, { useState, useEffect } from 'react';
import { fineractApi } from '@/lib/fineract';
import PageHeader from '@/components/fineract/PageHeader';
import DataTable from '@/components/fineract/DataTable';
import { useToast } from '@/components/ui/use-toast';

export default function DataTables() {
  const { toast } = useToast();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fineractApi('/datatables');
        setTables(Array.isArray(res) ? res : []);
      } catch (err) {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const columns = [
    { key: 'applicationTableName', label: 'Application Table' },
    { key: 'registeredTableName', label: 'Registered Table' },
    { key: 'columnHeaderData', label: 'Columns', render: (v) => (v || []).length },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Data Tables" description="Custom data tables" />
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <DataTable columns={columns} data={tables} loading={loading} emptyMessage="No data tables" />
      </div>
    </div>
  );
}