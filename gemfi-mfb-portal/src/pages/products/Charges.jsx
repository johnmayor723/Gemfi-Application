import React, { useState, useEffect } from 'react';
import { fineractApi } from '@/lib/fineract';
import PageHeader from '@/components/fineract/PageHeader';
import DataTable from '@/components/fineract/DataTable';
import { useToast } from '@/components/ui/use-toast';

export default function Charges() {
  const { toast } = useToast();
  const [charges, setCharges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fineractApi('/charges');
        setCharges(Array.isArray(res) ? res : []);
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
    { key: 'chargeAppliesTo', label: 'Applies To', render: (v) => v?.value || '—' },
    { key: 'chargeTimeType', label: 'Time Type', render: (v) => v?.value || '—' },
    { key: 'chargeCalculationType', label: 'Calculation', render: (v) => v?.value || '—' },
    { key: 'amount', label: 'Amount', render: (v) => v?.toLocaleString() || '—' },
    { key: 'active', label: 'Active', render: (v) => v ? 'Yes' : 'No' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Charges" description="View fee and charge configurations" />
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <DataTable columns={columns} data={charges} loading={loading} emptyMessage="No charges found" />
      </div>
    </div>
  );
}