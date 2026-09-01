import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Inbox } from 'lucide-react';
import { listRequests } from '@/api/admin.api';
import AppLayout from '@/components/AppLayout';
import { STATUS_META, STATUS_FILTERS } from '@/lib/statusMeta';

const TIER_LABELS = { starter: 'Starter', professional: 'Professional', enterprise: 'Enterprise' };

export default function Queue() {
  const [status, setStatus] = useState('pending');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (targetStatus) => {
    setLoading(true);
    setError('');
    try {
      const data = await listRequests(targetStatus === 'all' ? undefined : targetStatus);
      setRequests(data);
    } catch (err) {
      setError(err.body?.message || err.message || 'Unable to load onboarding requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(status);
  }, [status, load]);

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold">Onboarding requests</h1>
      <p className="text-muted-foreground mt-1">Review, provision, and manage applications.</p>

      <div className="mt-6 flex gap-2 border-b border-border overflow-x-auto">
        {['all', ...STATUS_FILTERS].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatus(tab)}
            className={`px-3.5 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${
              status === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'all' ? 'All' : STATUS_META[tab].label}
          </button>
        ))}
      </div>

      {error && <p className="mt-5 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>}

      {loading ? (
        <div className="mt-12 flex justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="mt-16 text-center text-muted-foreground">
          <Inbox className="h-8 w-8 mx-auto" />
          <p className="mt-3">No requests in this view.</p>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-border divide-y divide-border overflow-hidden">
          {requests.map((req) => {
            const meta = STATUS_META[req.status];
            const Icon = meta?.icon;
            return (
              <Link
                key={req._id}
                to={`/requests/${req._id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{req.companyName}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">{req.subdomain}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs text-muted-foreground hidden sm:inline">{req.submittedBy}</span>
                  <span className="text-xs font-medium text-muted-foreground border border-border rounded-full px-2.5 py-1 hidden sm:inline">
                    {TIER_LABELS[req.tier] || 'Starter'}
                  </span>
                  {meta && (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${meta.className}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {meta.label}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
