import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listAgents, isAgencyServiceConfigured } from '@/lib/agencyApi';
import { AlertTriangle, Loader2 } from 'lucide-react';
import PageHeader from '@/components/fineract/PageHeader';
import DataTable from '@/components/fineract/DataTable';
import StatusBadge from '@/components/fineract/StatusBadge';
import { useToast } from '@/components/ui/use-toast';

const STATUS_OPTIONS = ['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED', 'CLOSED'];

export default function Agents() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listAgents(status ? { status } : {});
      setAgents(data);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [status, toast]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { key: 'businessName', label: 'Business Name' },
    { key: 'agentType', label: 'Type', render: v => v === 'SUPER_AGENT' ? 'Super Agent' : 'Agent' },
    { key: 'registrationNumber', label: 'RC Number' },
    { key: 'contactPhone', label: 'Phone' },
    { key: 'floatVirtualAccountNumber', label: 'Float Account', render: v => v || '—' },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
  ];

  if (!isAgencyServiceConfigured()) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <PageHeader title="Agency Banking" description="Review and manage agent applications" />
        <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-800/50 border border-slate-700/50 rounded-xl">
          <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
          <p className="text-sm text-slate-400">Agency Service is not configured. Set VITE_ACCOUNT_SERVICE_API_URL to enable this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Agency Banking" description="Review and manage agent applications" />

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex gap-3 items-center">
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />}
        </div>
        <DataTable
          columns={columns}
          data={agents}
          loading={loading}
          emptyMessage="No agent applications found"
          onRowClick={(row) => navigate(`/agents/${row._id}`)}
        />
      </div>
    </div>
  );
}
