import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, X, ShieldCheck, Rocket, PauseCircle, Ban, UserPlus, Copy } from 'lucide-react';
import {
  getRequest, updateRequest, approveRequest, rejectRequest, setRequestStatus,
  listTenantUsers, listTenantRoles, createTenantUser,
} from '@/api/admin.api';
import { ENDPOINTS } from '@/api/endpoints';
import AppLayout from '@/components/AppLayout';
import { STATUS_META } from '@/lib/statusMeta';

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const TIERS = [
  { value: 'starter', label: 'Starter' },
  { value: 'professional', label: 'Professional' },
  { value: 'enterprise', label: 'Enterprise' },
];
const INSTITUTION_TYPES = [
  { value: 'bank', label: 'Bank / MFB' },
  { value: 'cooperative', label: 'Cooperative' },
  { value: 'loan_company', label: 'Loan company' },
];

function Field({ label, children }) {
  return (
    <label className="block text-sm font-medium text-foreground">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}

// Generates a password meeting Fineract's own policy (12-50 chars, upper
// + lower + digit + special, no immediately-repeating character) so the
// "Create user" form always submits a valid password on the first try
// instead of making the admin guess at the regex.
function generateCompliantPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%&*?';
  const all = upper + lower + digits + special;

  let password;
  do {
    const chars = [
      upper[Math.floor(Math.random() * upper.length)],
      lower[Math.floor(Math.random() * lower.length)],
      digits[Math.floor(Math.random() * digits.length)],
      special[Math.floor(Math.random() * special.length)],
    ];
    while (chars.length < 14) chars.push(all[Math.floor(Math.random() * all.length)]);
    // Shuffle so the required classes aren't always in the same positions.
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    password = chars.join('');
  } while (/(.)\1/.test(password)); // reject and retry on any repeated-adjacent char

  return password;
}

/**
 * Remote Fineract user/role management for an active tenant - this is
 * what "available on the GemFi admin console" means for tenants whose own
 * portal hides Users/Roles (anything below the Enterprise tier). GemFi
 * staff use this panel to create/view a tenant's staff logins on their
 * behalf.
 */
function TenantUsersPanel({ requestId }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createdCreds, setCreatedCreds] = useState(null);
  const [form, setForm] = useState({ username: '', firstname: '', lastname: '', email: '', roleId: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [usersRes, rolesRes] = await Promise.all([
        listTenantUsers(requestId),
        listTenantRoles(requestId),
      ]);
      setUsers(usersRes);
      setRoles(rolesRes.filter((r) => !r.disabled));
    } catch (err) {
      setError(err.body?.message || err.message || 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => { load(); }, [load]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const password = generateCompliantPassword();
    try {
      await createTenantUser(requestId, {
        username: form.username,
        firstname: form.firstname,
        lastname: form.lastname,
        email: form.email,
        officeId: 1, // every tenant currently has a single "Head Office"
        roles: [Number(form.roleId)],
        sendPasswordToEmail: false,
        password,
        repeatPassword: password,
      });
      setCreatedCreds({ username: form.username, password });
      setForm({ username: '', firstname: '', lastname: '', email: '', roleId: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.body?.message || err.message || 'Unable to create this user.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Organization users</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Managed here on the organization's behalf - only Enterprise-tier organizations get this in their own portal.
          </p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setCreatedCreds(null); }}
          className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <UserPlus className="h-4 w-4" /> New user
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>}

      {createdCreds && (
        <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
          <p className="font-medium">User created - share these credentials securely:</p>
          <div className="mt-2 flex items-center gap-2 font-mono">
            <span>{createdCreds.username} / {createdCreds.password}</span>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(`${createdCreds.username} / ${createdCreds.password}`)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">This won't be shown again - copy it now.</p>
        </div>
      )}

      {showForm && (
        <form onSubmit={submit} className="mt-4 space-y-3 border-t border-border pt-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <input required value={form.username} onChange={set('username')} placeholder="Username"
              className="border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary" />
            <select required value={form.roleId} onChange={set('roleId')}
              className="border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary">
              <option value="" disabled>Role</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <input required value={form.firstname} onChange={set('firstname')} placeholder="First name"
              className="border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary" />
            <input required value={form.lastname} onChange={set('lastname')} placeholder="Last name"
              className="border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary" />
            <input required type="email" value={form.email} onChange={set('email')} placeholder="Email"
              className="border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary sm:col-span-2" />
          </div>
          <button
            disabled={saving}
            className="bg-primary text-primary-foreground font-semibold rounded-lg px-4 py-2 text-sm disabled:opacity-60 flex items-center gap-2"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saving ? 'Creating…' : 'Create user'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="mt-4 flex justify-center text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : (
        <div className="mt-4 divide-y divide-border">
          {users.map((u) => (
            <div key={u.id} className="py-2.5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{u.firstname} {u.lastname} <span className="text-muted-foreground font-normal">({u.username})</span></p>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {u.selectedRoles?.map((r) => r.name).join(', ') || '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
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
    tier: request.tier,
    institutionType: request.institutionType,
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
              <Field label="Tier">
                <div className="flex items-center gap-2">
                  <select
                    value={request.tier || 'starter'}
                    onChange={set('tier')}
                    className="w-full border border-input rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-primary"
                  >
                    {TIERS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  {/* Pending requests save tier along with everything else
                      via the main "Save changes" button below. Once the
                      organization is live, only tier can still change - this
                      button covers that case with its own dedicated
                      tier-only update. */}
                  {!isPending && (
                    <button
                      type="button"
                      onClick={() => save({ tier: request.tier })}
                      disabled={saving}
                      className="shrink-0 text-sm font-medium text-primary hover:underline disabled:opacity-60"
                    >
                      Save
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Enterprise organizations get self-service Users &amp; Roles management in their own portal; Starter/Professional organizations have that done for them from here. Can be changed at any time, even after the organization is live.
                </p>
              </Field>
              <Field label="Institution type">
                <select
                  disabled={!isPending}
                  value={request.institutionType || 'bank'}
                  onChange={set('institutionType')}
                  className="w-full border border-input rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-primary disabled:bg-muted disabled:text-muted-foreground"
                >
                  {INSTITUTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Drives terminology only in the portal/connect app (e.g. "Members" and "Contributions" for a cooperative, not deposit-taking language). Does not change the GemFi Core product configuration.
                </p>
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
            <p className="text-sm text-muted-foreground mt-1">Seeded on this organization's GemFi Core instance at approval.</p>
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
                    Required before approval. Approving seeds the standard chart of accounts and roles on a new GemFi Core organization.
                  </p>
                </span>
              </label>
            </div>
          )}

          {isActive && <TenantUsersPanel requestId={request._id} />}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border p-5">
            <h2 className="font-semibold">Organization info</h2>
            <div className="mt-3">
              <ReadOnlyRow label="Tier" value={TIERS.find((t) => t.value === request.tier)?.label || request.tier} />
              <ReadOnlyRow label="Institution type" value={INSTITUTION_TYPES.find((t) => t.value === request.institutionType)?.label || request.institutionType} />
              <ReadOnlyRow label="GemFi Core ID" value={request.fineractTenantIdentifier} mono />
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
                  {approving ? `Provisioning organization… ${approveSeconds}s elapsed` : 'Approve & provision'}
                </button>
                {approving && (
                  <p className="text-xs text-muted-foreground">
                    Creating the GemFi Core organization, seeding its chart of accounts and roles - this normally takes 2-4 minutes. Stay on this page; it will update automatically when it's done.
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
                Disable organization
              </button>
            )}

            {isDisabled && (
              <button
                onClick={() => doSetStatus('active')}
                disabled={saving}
                className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-3 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <Rocket className="h-4 w-4" />
                Re-enable organization
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
