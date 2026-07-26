import React, { useState, useEffect } from 'react';
import { fineractApi } from '@/lib/fineract';
import PageHeader from '@/components/fineract/PageHeader';
import DataTable from '@/components/fineract/DataTable';
import { useToast } from '@/components/ui/use-toast';

export default function Codes() {
  const { toast } = useToast();
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fineractApi('/codes');
        setCodes(Array.isArray(res) ? res : []);
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
    { key: 'name', label: 'Name' },
    { key: 'systemDefined', label: 'System Defined', render: (v) => v ? 'Yes' : 'No' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Codes" description="System and user-defined codes" />
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <DataTable columns={columns} data={codes} loading={loading} emptyMessage="No codes" />
      </div>
    </div>
  );
}