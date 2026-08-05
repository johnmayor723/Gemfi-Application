import { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Loader2, X } from 'lucide-react';
import { createRequest } from '@/api/admin.api';
import AppLayout from '@/components/AppLayout';

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const PHONE = /^[0-9+][0-9\s-]{6,20}$/;
const ALLOWED_LOGO_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/svg+xml', 'image/webp'];
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

const DEFAULTS = {
  companyName: '',
  contactEmail: '',
  contactPhone: '',
  contactAddress: '',
  primaryColor: '#0D766E',
  secondaryColor: '#FF832E',
  tier: 'starter',
};

const TIERS = [
  { value: 'starter', label: 'Starter' },
  { value: 'professional', label: 'Professional' },
  { value: 'enterprise', label: 'Enterprise' },
];

function Field({ label, error, children }) {
  return (
    <label className="block text-sm font-medium text-foreground">
      {label}
      <div className="mt-2">{children}</div>
      {error && <span className="text-xs text-destructive mt-1 block">{error}</span>}
    </label>
  );
}

function ColorField({ label, value, onChange, error }) {
  return (
    <Field label={label} error={error}>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={HEX_COLOR.test(value) ? value : '#ffffff'}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-11 w-11 shrink-0 rounded-lg border border-input cursor-pointer bg-transparent p-1"
          aria-label={`${label} picker`}
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={7}
          className="flex-1 border border-input rounded-lg px-3 py-2.5 font-mono text-sm uppercase focus:ring-2 focus:ring-primary"
        />
      </div>
    </Field>
  );
}

export default function NewRequest() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(DEFAULTS);
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const pickLogo = (file) => {
    if (!file) return;
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, logo: 'Logo must be a JPEG, PNG, SVG, or WEBP image.' }));
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setErrors((prev) => ({ ...prev, logo: 'Logo must be 2MB or smaller.' }));
      return;
    }
    setErrors((prev) => ({ ...prev, logo: undefined }));
    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const clearLogo = () => {
    setLogo(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = () => {
    const next = {};
    if (!form.companyName.trim()) next.companyName = 'Company name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) next.contactEmail = 'Enter a valid email address.';
    if (!PHONE.test(form.contactPhone)) next.contactPhone = 'Enter a valid phone number.';
    if (!HEX_COLOR.test(form.primaryColor)) next.primaryColor = 'Enter a 6-digit hex color, e.g. #0D766E.';
    if (!HEX_COLOR.test(form.secondaryColor)) next.secondaryColor = 'Enter a 6-digit hex color, e.g. #FF832E.';
    setErrors((prev) => ({ ...prev, ...next }));
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const created = await createRequest({ ...form, logo });
      navigate(`/requests/${created._id}`);
    } catch (err) {
      setApiError(err.body?.message || err.message || 'Unable to create this request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to queue
      </Link>

      <h1 className="mt-4 text-2xl font-bold">New onboarding request</h1>
      <p className="text-muted-foreground mt-1">
        Blank-start a tenant from phone/email contact — for prospects who didn't self-serve through the application form.
      </p>

      {apiError && <p className="mt-5 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{apiError}</p>}

      <form onSubmit={submit} className="mt-6 max-w-lg space-y-4">
        <Field label="Institution name" error={errors.companyName}>
          <input
            value={form.companyName}
            onChange={set('companyName')}
            className="w-full border border-input rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-primary"
            placeholder="Zenith Micro Bank"
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Contact email" error={errors.contactEmail}>
            <input
              type="email"
              value={form.contactEmail}
              onChange={set('contactEmail')}
              className="w-full border border-input rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-primary"
              placeholder="ops@yourbank.com"
            />
          </Field>
          <Field label="Contact phone" error={errors.contactPhone}>
            <input
              inputMode="tel"
              value={form.contactPhone}
              onChange={set('contactPhone')}
              className="w-full border border-input rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-primary"
              placeholder="+234 801 234 5678"
            />
          </Field>
        </div>
        <Field label="Business address (optional)">
          <input
            value={form.contactAddress}
            onChange={set('contactAddress')}
            className="w-full border border-input rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-primary"
            placeholder="Street, city, state"
          />
        </Field>

        <Field label="Tier">
          <select
            value={form.tier}
            onChange={set('tier')}
            className="w-full border border-input rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-primary"
          >
            {TIERS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <ColorField label="Primary color" value={form.primaryColor} onChange={(v) => setForm((f) => ({ ...f, primaryColor: v }))} error={errors.primaryColor} />
          <ColorField label="Secondary color" value={form.secondaryColor} onChange={(v) => setForm((f) => ({ ...f, secondaryColor: v }))} error={errors.secondaryColor} />
        </div>

        <Field label="Logo (optional)" error={errors.logo}>
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_LOGO_TYPES.join(',')}
            onChange={(e) => pickLogo(e.target.files?.[0])}
            className="hidden"
            id="logo-upload"
          />
          {logoPreview ? (
            <div className="flex items-center gap-3 border border-input rounded-lg px-3.5 py-2.5">
              <img src={logoPreview} alt="Logo preview" className="h-9 w-9 object-contain rounded" />
              <span className="text-sm text-muted-foreground truncate flex-1">{logo?.name}</span>
              <button type="button" onClick={clearLogo} className="text-muted-foreground hover:text-destructive">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="logo-upload"
              className="flex items-center gap-2 border border-dashed border-input rounded-lg px-3.5 py-2.5 text-sm text-muted-foreground cursor-pointer hover:border-primary hover:text-primary"
            >
              <ImagePlus className="h-4 w-4" />
              Upload a logo (JPEG, PNG, SVG, or WEBP, up to 2MB)
            </label>
          )}
        </Field>

        <button
          disabled={loading}
          className="bg-primary text-primary-foreground font-semibold rounded-xl px-6 py-3 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Creating…' : 'Create request'}
        </button>
      </form>
    </AppLayout>
  );
}
