import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock3, CheckCircle2, XCircle, Rocket, PauseCircle, Search, Loader2 } from 'lucide-react';
import { getOnboardingStatus } from '@/api/onboarding.api';
import Logo from '@/components/Logo';

const STATUS_META = {
  pending: { label: 'Under review', icon: Clock3, className: 'bg-amber-50 text-amber-700' },
  approved: { label: 'Approved', icon: CheckCircle2, className: 'bg-sky-50 text-sky-700' },
  active: { label: 'Live', icon: Rocket, className: 'bg-success/10 text-success' },
  rejected: { label: 'Not approved', icon: XCircle, className: 'bg-destructive/10 text-destructive' },
  disabled: { label: 'Disabled', icon: PauseCircle, className: 'bg-muted text-muted-foreground' },
};

export default function CheckStatus() {
  const { id: idFromRoute } = useParams();
  const navigate = useNavigate();
  const [id, setId] = useState(idFromRoute || '');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchStatus = async (targetId) => {
    if (!targetId?.trim()) return;
    setLoading(true);
    setError('');
    setStatus(null);
    try {
      const response = await getOnboardingStatus(targetId.trim());
      setStatus(response.data);
    } catch (err) {
      setError(err.status === 404 ? 'No application found with that reference id.' : (err.body?.message || 'Unable to check status.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (idFromRoute) fetchStatus(idFromRoute);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idFromRoute]);

  const submit = (e) => {
    e.preventDefault();
    navigate(`/status/${id.trim()}`);
    fetchStatus(id);
  };

  const meta = status ? STATUS_META[status.status] : null;
  const Icon = meta?.icon;

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <Logo className="text-2xl mb-8 mx-auto" />
        <h1 className="text-2xl font-bold text-center">Check application status</h1>
        <p className="text-muted-foreground text-center mt-1">Enter the reference id you received when you applied.</p>

        <form onSubmit={submit} className="mt-6 flex gap-2">
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="Reference id"
            className="flex-1 border border-input rounded-lg px-3.5 py-2.5 font-mono text-sm focus:ring-2 focus:ring-primary"
          />
          <button
            disabled={loading || !id.trim()}
            className="shrink-0 bg-primary text-primary-foreground rounded-lg px-4 disabled:opacity-60 flex items-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </button>
        </form>

        {error && <p className="mt-5 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>}

        {status && (
          <div className="mt-6 rounded-xl border border-border p-5">
            <p className="font-semibold">{status.companyName}</p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{status.subdomain}</p>
            <span className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${meta.className}`}>
              <Icon className="h-4 w-4" />
              {meta.label}
            </span>
            {status.status === 'rejected' && status.rejectionReason && (
              <p className="mt-3 text-sm text-muted-foreground">{status.rejectionReason}</p>
            )}
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          Haven't applied yet?{' '}
          <Link to="/" className="text-primary font-medium hover:underline">
            Start an application
          </Link>
        </p>
      </div>
    </main>
  );
}
