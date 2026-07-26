import React, { useState, useEffect } from 'react';
import { fineractApi } from '@/lib/fineract';
import PageHeader from '@/components/fineract/PageHeader';
import DataTable from '@/components/fineract/DataTable';
import { useToast } from '@/components/ui/use-toast';

export default function Currencies() {
  const { toast } = useToast();
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fineractApi('/currencies');
        setCurrencies(res.selectedCurrencyOptions || []);
      } catch (err) {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'displaySymbol', label: 'Symbol' },
    { key: 'decimalPlaces', label: 'Decimal Places' },
    { key: 'displayLabel', label: 'Display Label' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Currencies" description="Active currencies in the system" />
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <DataTable columns={columns} data={currencies} loading={loading} emptyMessage="No currencies configured" />
      </div>
    </div>
  );
}