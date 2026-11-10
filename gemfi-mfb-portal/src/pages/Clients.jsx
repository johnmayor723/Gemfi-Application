import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fineractApi } from '@/lib/fineract';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/fineract/PageHeader';
import DataTable from '@/components/fineract/DataTable';
import StatusBadge from '@/components/fineract/StatusBadge';
import ClientWizard from '@/components/fineract/ClientWizard';
import { useToast } from '@/components/ui/use-toast';
import { useTerminology } from '@/lib/terminology';

export default function Clients() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const t = useTerminology();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [offices, setOffices] = useState([]);

  const urlParams = new URLSearchParams(window.location.search);

  useEffect(() => {
    if (urlParams.get('action') === 'create') setShowWizard(true);
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const params = { limit: 100, orderBy: 'id', sortOrder: 'DESC' };
      if (search) params.sqlSearch = `display_name like '%${search}%'`;
      const res = await fineractApi('/clients', { params });
      setClients(res.pageItems || []);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadOffices = async () => {
    try {
      const res = await fineractApi('/offices');
      setOffices(res || []);
    } catch {}
  };

  useEffect(() => { loadClients(); loadOffices(); }, []);

  const columns = [
    { key: 'accountNo', label: `${t.clientSingular} No.` },
    { key: 'displayName', label: 'Name' },
    { key: 'mobileNo', label: 'Phone', render: v => v || '—' },
    { key: 'externalId', label: 'BVN', render: v => v ? <span className="text-emerald-400 text-xs font-mono">{v}</span> : <span className="text-slate-600 text-xs">Not linked</span> },
    { key: 'officeName', label: 'Office' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title={t.clients}
        description={`Manage your ${t.clientSingular.toLowerCase()} portfolio`}
        action={
          <Button onClick={() => setShowWizard(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" /> New {t.clientSingular}
          </Button>
        }
      />

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadClients()}
              placeholder={`Search ${t.clients.toLowerCase()}…`}
              className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-600"
            />
          </div>
          <Button onClick={loadClients} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
            Search
          </Button>
        </div>
        <DataTable
          columns={columns}
          data={clients}
          loading={loading}
          emptyMessage={`No ${t.clients.toLowerCase()} found`}
          onRowClick={(row) => navigate(`/clients/${row.id}`)}
        />
      </div>

      {showWizard && (
        <ClientWizard
          offices={offices}
          onClose={() => { setShowWizard(false); navigate('/clients'); }}
          onCreated={(clientId) => { setShowWizard(false); navigate(`/clients/${clientId}`); }}
        />
      )}
    </div>
  );
}