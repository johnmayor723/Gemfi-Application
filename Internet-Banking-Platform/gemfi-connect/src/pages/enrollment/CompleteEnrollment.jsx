import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound, Eye, EyeOff } from 'lucide-react';
import { completeEnrollment } from '@/api/enrollment.api';
import { useBankAuth } from '@/auth/AuthProvider';
import EnrollmentProgress from '@/components/EnrollmentProgress';
import Logo from '@/components/Logo';
import bgImg from '@/assets/bg-img.jpg';
import { useBranding } from '@/lib/branding';

const passwordRules = [
  { label: 'At least 8 characters', test: v => v.length >= 8 },
  { label: 'Uppercase letter', test: v => /[A-Z]/.test(v) },
  { label: 'Lowercase letter', test: v => /[a-z]/.test(v) },
  { label: 'Number', test: v => /\d/.test(v) },
  { label: 'Special character', test: v => /[^A-Za-z0-9]/.test(v) },
];

export default function CompleteEnrollment() {
  const navigate = useNavigate();
  const branding = useBranding();
  const { authenticateWith } = useBankAuth();
  const [enrollmentId, setEnrollmentId] = useState('');
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(sessionStorage.getItem('gemfi_enrollment') || 'null');
    if (!stored) { navigate('/register'); return; }
    setEnrollmentId(stored.enrollmentId);
  }, [navigate]);

  const validate = () => {
    const next = {};
    if (!/^[A-Za-z0-9_.]{4,30}$/.test(form.username)) next.username = '4–30 chars: letters, numbers, underscore, dot.';
    if (!passwordRules.every(r => r.test(form.password))) next.password = 'Password does not meet all requirements.';
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await completeEnrollment({ enrollmentId, username: form.username, password: form.password, confirmPassword: form.confirmPassword });
      sessionStorage.removeItem('gemfi_enrollment');
      authenticateWith(result.data);
      navigate('/', { replace: true });
    } catch (err) {
      setApiError(err.body?.message || err.message || 'Unable to complete enrollment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-white">
      <section className="hidden lg:flex relative overflow-hidden bg-[#252323] text-white">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgImg})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/85" />
        <div className="relative z-10 flex flex-col justify-between p-14 w-full">
          <Logo light className="text-3xl"/>
          <div><h1 className="text-4xl font-bold">Create your credentials</h1><p className="mt-5 text-slate-300 max-w-md">Choose a username and a strong password for your internet banking access.</p></div>
          <p className="text-xs text-slate-500">{branding.companyName} Microfinance Bank</p>
        </div>
      </section>
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Logo className="lg:hidden text-2xl mb-8"/>
          <EnrollmentProgress current={2}/>
          <span className="w-11 h-11 rounded-xl bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] grid place-items-center"><UserRound/></span>
          <h2 className="text-2xl font-bold mt-4">Create login credentials</h2>
          <p className="text-slate-500 mt-1">You're almost done. Set your username and password.</p>
          {apiError && <p className="mt-5 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{apiError}</p>}
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-medium">Username
              <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="mt-2 w-full border rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[hsl(var(--primary))]" placeholder="janedoe"/>
              {errors.username && <span className="text-xs text-red-600 mt-1 block">{errors.username}</span>}
            </label>
            <label className="block text-sm font-medium">Password
              <div className="relative mt-2">
                <input type={show ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full border rounded-xl px-4 py-3.5 pr-12 focus:ring-2 focus:ring-[hsl(var(--primary))]"/>
                <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-3.5 text-slate-500">{show ? <EyeOff size={20}/> : <Eye size={20}/>}</button>
              </div>
              <ul className="mt-2 space-y-1">{passwordRules.map(r => <li key={r.label} className={`text-xs flex items-center gap-1.5 ${r.test(form.password) ? 'text-emerald-600' : 'text-slate-400'}`}>{r.test(form.password) ? '✓' : '•'} {r.label}</li>)}</ul>
            </label>
            <label className="block text-sm font-medium">Confirm password
              <input type={show ? 'text' : 'password'} value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} className="mt-2 w-full border rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[hsl(var(--primary))]"/>
              {errors.confirmPassword && <span className="text-xs text-red-600 mt-1 block">{errors.confirmPassword}</span>}
            </label>
            <button disabled={loading} className="w-full bg-[hsl(var(--brand-secondary))] text-white font-semibold rounded-xl py-3.5 disabled:opacity-60">{loading ? 'Activating…' : 'Activate Internet Banking'}</button>
          </form>
        </div>
      </section>
    </main>
  );
}