import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, X, ShieldCheck, Rocket, PauseCircle, Ban } from 'lucide-react';
import { getRequest, updateRequest, approveRequest, rejectRequest, setRequestStatus } from '@/api/admin.api';
import { ENDPOINTS } from '@/api/endpoints';
import AppLayout from '@/components/AppLayout';
import { STATUS_META } from '@/lib/statusMeta';

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function Field({ label, children }) {
  return (
    <label className="block text-sm font-medium text-foreground">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function ReadOnlyRow({ label, value, mono }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm text-right ${mono ? 'font-mono' : 'font-medium'}`}>{value ?? '—'}</span>
    </div>
  );
}

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approveSeconds, setApproveSeconds] = useState(0);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    if (!approving) return;
    setApproveSeconds(0);
    const timer = setInterval(() => setApproveSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [approving]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getRequest(id);
      setRequest(data);
    } catch (err) {
      setError(err.body?.message || err.message || 'Unable to load this request.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const set = (field) => (e) => setRequest((r) => ({ ...r, [field]: e.target.value }));

  const save = async (patch) => {
    setSaving(true);
    setError('');
    try {
      const updated = await updateRequest(id, patch);
      setRequest(updated);
    } catch (err) {
      setError(err.body?.message || err.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const saveEditedFields = () => save({
    companyName: request.companyName,
    contactEmail: request.contactEmail,
    contactPhone: request.contactPhone,
    contactAddress: request.contactAddress,
    primaryColor: request.primaryColor,
    secondaryColor: request.secondaryColor,
  });

  const addRole = () => {
    const role = newRole.trim();
    if (!role || request.roles.includes(role)) return;
    setNewRole('');
    save({ roles: [...request.roles, role] });
  };

  const removeRole = (role) => {
    save({ roles: request.roles.filter((r) => r !== role) });
  };

  const toggleCoa = (e) => {
    save({ chartOfAccountsConfirmed: e.target.checked });
  };

  const doApprove = async () => {
    setApproving(true);
    setError('');
    try {
      const updated = await approveRequest(id);
      setRequest(updated);
    } catch (err) {
      setError(err.body?.message || err.message || 'Approval failed.');
    } finally {
      setApproving(false);
    }
  };

  const doReject = async () => {
    const reason = window.prompt('Reason for rejecting this application (optional):') || undefined;
    setSaving(true);
    setError('');
    try {
      const updated = await rejectRequest(id, reason);
      setRequest(updated);
    } catch (err) {
      setError(err.body?.message || err.message || 'Reject failed.');
    } finally {
      setSaving(false);
    }
  };

  const doSetStatus = async (status) => {
    setSaving(true);
    setError('');
    try {
      const updated = await setRequestStatus(id, status);
      setRequest(updated);
    } catch (err) {
      setError(err.body?.message || err.message || 'Status change failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!request) {
    return (
      <AppLayout>
        <p className="text-destructive">{error || 'Request not found.'}</p>
        <Link to="/" className="mt-4 inline-block text-sm text-primary hover:underline">Back to queue</Link>
      </AppLayout>
    );
  }

  const meta = STATUS_META[request.status];
  const Icon = meta?.icon;
  const isPending = request.status === 'pending';
  const isActive = request.status === 'active';
  const isDisabled = request.status === 'disabled';

  return (
    <AppLayout>
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to queue
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{request.companyName}</h1>
          <p className="text-muted-foreground font-mono text-sm mt-0.5">{request.subdomain}</p>
        </div>
        {meta && (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${meta.className}`}>
            <Icon className="h-4 w-4" />
            {meta.label}
          </span>
        )}
      </div>

      {error && <p className="mt-5 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>}

      <div className="mt-6 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border p-5">
            <h2 className="font-semibold">Institution details</h2>
            <div className="mt-4 space-y-4">
              {request.logo && (
                <img
                  src={ENDPOINTS.logo(request._id)}
                  alt="Logo"
                  className="h-14 w-14 object-contain rounded-lg border border-border p-1"
                />
              )}
              <Field label="Institution name">
                <input
                  disabled={!isPending}
                  value={request.companyName}
                  onChange={set('companyName')}
                  className="w-full border border-input rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-primary disabled:bg-muted disabled:text-muted-foreground"
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Contact email">
                  <input
                    disabled={!isPending}
                    value={request.contactEmail}
                    onChange={set('contactEmail')}
                    className="w-full border border-input rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-primary disabled:bg-muted disabled:text-muted-foreground"
                  />
                </Field>
                <Field label="Contact phone">
                  <input
                    disabled={!isPending}
                    value={request.contactPhone}
                    onChange={set('contactPhone')}
                    className="w-full border border-input rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-primary disabled:bg-muted disabled:text-muted-foreground"
                  />
                </Field>
              </div>
              <Field label="Business address">
                <input
                  disabled={!isPending}
                  value={request.contactAddress || ''}
                  onChange={set('contactAddress')}
                  className="w-full border border-input rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-primary disabled:bg-muted disabled:text-muted-foreground"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Primary color">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      disabled={!isPending}
                      value={HEX_COLOR.test(request.primaryColor) ? request.primaryColor : '#ffffff'}
                      onChange={(e) => setRequest((r) => ({ ...r, primaryColor: e.target.value.toUpperCase() }))}
                      className="h-11 w-11 shrink-0 rounded-lg border border-input cursor-pointer bg-transparent p-1 disabled:cursor-not-allowed"
                    />
                    <input
                      disabled={!isPending}
                      value={request.primaryColor}
                      onChange={set('primaryColor')}
                      className="flex-1 border border-input rounded-lg px-3 py-2.5 font-mono text-sm uppercase focus:ring-2 focus:ring-primary disabled:bg-muted disabled:text-muted-foreground"
                    />
                  </div>
                </Field>
                <Field label="Secondary color">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      disabled={!isPending}
                      value={HEX_COLOR.test(request.secondaryColor) ? request.secondaryColor : '#ffffff'}
                      onChange={(e) => setRequest((r) => ({ ...r, secondaryColor: e.target.value.toUpperCase() }))}
                      className="h-11 w-11 shrink-0 rounded-lg border border-input cursor-pointer bg-transparent p-1 disabled:cursor-not-allowed"
                    />
                    <input
                      disabled={!isPending}
                      value={request.secondaryColor}
                      onChange={set('secondaryColor')}
                      className="flex-1 border border-input rounded-lg px-3 py-2.5 font-mono text-sm uppercase focus:ring-2 focus:ring-primary disabled:bg-muted disabled:text-muted-foreground"
                    />
                  </div>
                </Field>
              </div>
              {isPending && (
                <button
                  onClick={saveEditedFields}
                  disabled={saving}
                  className="text-sm font-medium text-primary hover:underline disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border p-5">
            <h2 className="font-semibold">Roles</h2>
            <p className="text-sm text-muted-foreground mt-1">Seeded on this tenant's Fineract instance at approval.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {request.roles.map((role) => (
                <span key={role} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm">
                  {role}
                  {isPending && (
                    <button onClick={() => removeRole(role)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {isPending && (
              <div className="mt-3 flex gap-2">
                <input
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRole())}
                  placeholder="Add a role"
                  className="flex-1 border border-input rounded-lg px-3.5 py-2 text-sm focus:ring-2 focus:ring-primary"
                />
                <button onClick={addRole} className="shrink-0 border border-input rounded-lg px-3 hover:bg-muted">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {isPending && (
            <div className="rounded-xl border border-border p-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={request.chartOfAccountsConfirmed}
                  onChange={toggleCoa}
                  className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <span>
                  <span className="font-medium">Chart of accounts confirmed</span>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Required before approval. Approving seeds the standard chart of accounts and roles on a new Fineract tenant.
                  </p>
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border p-5">
            <h2 className="font-semibold">Tenant info</h2>
            <div className="mt-3">
              <ReadOnlyRow label="Fineract tenant" value={request.fineractTenantIdentifier} mono />
              <ReadOnlyRow label="Submitted by" value={request.submittedBy} />
              <ReadOnlyRow label="Reviewed by" value={request.reviewedBy} />
              <ReadOnlyRow label="Reviewed at" value={request.reviewedAt ? new Date(request.reviewedAt).toLocaleString() : null} />
              <ReadOnlyRow label="Submitted at" value={new Date(request.createdAt).toLocaleString()} />
            </div>
          </div>

          <div className="rounded-xl border border-border p-5 space-y-3">
            <h2 className="font-semibold">Actions</h2>

            {isPending && (
              <>
                <button
                  onClick={doApprove}
                  disabled={approving || !request.chartOfAccountsConfirmed}
                  className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-3 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  {approving ? `Provisioning tenant… ${approveSeconds}s elapsed` : 'Approve & provision'}
                </button>
                {approving && (
                  <p className="text-xs text-muted-foreground">
                    Creating the Fineract tenant, seeding its chart of accounts and roles - this normally takes 2-4 minutes. Stay on this page; it will update automatically when it's done.
                  </p>
                )}
                {!approving && !request.chartOfAccountsConfirmed && (
                  <p className="text-xs text-muted-foreground">Confirm the chart of accounts before approving.</p>
                )}
                <button
                  onClick={doReject}
                  disabled={saving || approving}
                  className="w-full border border-destructive/30 text-destructive font-semibold rounded-xl py-3 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <Ban className="h-4 w-4" />
                  Reject
                </button>
              </>
            )}

            {isActive && (
              <button
                onClick={() => doSetStatus('disabled')}
                disabled={saving}
                className="w-full border border-input font-semibold rounded-xl py-3 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <PauseCircle className="h-4 w-4" />
                Disable tenant
              </button>
            )}

            {isDisabled && (
              <button
                onClick={() => doSetStatus('active')}
                disabled={saving}
                className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-3 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <Rocket className="h-4 w-4" />
                Re-enable tenant
              </button>
            )}

            {request.status === 'rejected' && (
              <div>
                <p className="text-sm text-muted-foreground">Rejection reason</p>
                <p className="text-sm mt-1">{request.rejectionReason || '—'}</p>
              </div>
            )}

            {!isPending && !isActive && !isDisabled && request.status !== 'rejected' && (
              <p className="text-sm text-muted-foreground">No actions available for this status.</p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
