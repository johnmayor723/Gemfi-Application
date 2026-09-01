import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CheckCircle2, ImagePlus, Loader2, X } from 'lucide-react';
import { submitOnboardingRequest } from '@/api/onboarding.api';
import Logo from '@/components/Logo';

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

// Matches the three tiers published on gemfitech.com/resources/offering.
const TIERS = [
  { value: 'starter', label: 'Starter', description: 'Shared platform, GemFi-managed users & roles.' },
  { value: 'professional', label: 'Professional', description: 'Everything in Starter, plus higher usage limits.' },
  { value: 'enterprise', label: 'Enterprise', description: 'Dedicated, isolated deployment, self-service users & roles.' },
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
          placeholder="#0D766E"
        />
      </div>
    </Field>
  );
}

function TierField({ value, onChange }) {
  return (
    <Field label="Plan">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {TIERS.map((tier) => (
          <button
            type="button"
            key={tier.value}
            onClick={() => onChange(tier.value)}
            className={`text-left rounded-lg border px-3.5 py-2.5 transition-colors ${
              value === tier.value
                ? 'border-primary ring-2 ring-primary bg-primary/5'
                : 'border-input hover:border-primary/50'
            }`}
          >
            <span className="block text-sm font-semibold">{tier.label}</span>
            <span className="block text-xs text-muted-foreground mt-0.5">{tier.description}</span>
          </button>
        ))}
      </div>
    </Field>
  );
}

export default function Apply() {
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(DEFAULTS);
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

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
      const response = await submitOnboardingRequest({ ...form, logo });
      setResult(response.data);
    } catch (err) {
      setApiError(err.body?.message || err.message || 'Unable to submit your application.');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h1 className="mt-6 text-2xl font-bold">Application submitted</h1>
          <p className="mt-2 text-muted-foreground">
            Thanks — our team will review {form.companyName}'s application shortly.
          </p>
          <div className="mt-6 rounded-xl border border-border bg-muted/50 p-4 text-left">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Your reference id</p>
            <p className="mt-1 font-mono text-sm break-all">{result.id}</p>
            <p className="mt-3 text-xs text-muted-foreground">Save this to check your application's status later.</p>
          </div>
          <Link
            to={`/status/${result.id}`}
            className="mt-6 inline-block w-full bg-primary text-primary-foreground font-semibold rounded-xl py-3.5 hover:opacity-90"
          >
            Check application status
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-background">
      <section className="hidden lg:flex relative overflow-hidden bg-[#0B2B27] text-white">
        <div className="relative z-10 flex flex-col justify-between p-14 w-full">
          <Logo light className="text-3xl" />
          <div>
            <h1 className="text-4xl font-bold text-balance">Bring your bank onto GEMFI</h1>
            <p className="mt-5 text-slate-300 max-w-md">
              Tell us about your institution and your brand — we'll provision your own core banking
              instance, complete with your colors and logo across the portal and internet banking app.
            </p>
          </div>
          <p className="text-xs text-slate-500">GEMFI — Core Banking Platform</p>
        </div>
      </section>
      <section className="flex items-center justify-center p-6 py-12">
        <div className="w-full max-w-md">
          <Logo className="lg:hidden text-2xl mb-8" />
          <span className="w-11 h-11 rounded-xl bg-primary/10 text-primary grid place-items-center">
            <Building2 className="h-5 w-5" />
          </span>
          <h2 className="text-2xl font-bold mt-4">Partner application</h2>
          <p className="text-muted-foreground mt-1">A GEMFI admin will review your details before your instance is provisioned.</p>
          {apiError && <p className="mt-5 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{apiError}</p>}
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Institution name" error={errors.companyName}>
              <input
                value={form.companyName}
                onChange={set('companyName')}
                className="w-full border border-input rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-primary"
                placeholder="Zenith Micro Bank"
              />
            </Field>
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
            <Field label="Business address (optional)">
              <input
                value={form.contactAddress}
                onChange={set('contactAddress')}
                className="w-full border border-input rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-primary"
                placeholder="Street, city, state"
              />
            </Field>

            <TierField value={form.tier} onChange={(v) => setForm((f) => ({ ...f, tier: v }))} />

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
              className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-3.5 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Submitting…' : 'Submit application'}
            </button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already applied?{' '}
            <Link to="/status" className="text-primary font-medium hover:underline">
              Check your status
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
