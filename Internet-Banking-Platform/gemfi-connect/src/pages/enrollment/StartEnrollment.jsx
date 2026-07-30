import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { startEnrollment } from '@/api/enrollment.api';
import EnrollmentProgress from '@/components/EnrollmentProgress';
import Logo from '@/components/Logo';
import bgImg from '@/assets/bg-img.jpg';
import { useBranding } from '@/lib/branding';

export default function StartEnrollment() {
  const navigate = useNavigate();
  const branding = useBranding();
  const [form, setForm] = useState({ accountNumber: '', email: '', phoneNumber: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next = {};
    if (!/^\d{10}$/.test(form.accountNumber)) next.accountNumber = 'Account number must be exactly 10 digits.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (form.phoneNumber.length < 10 || form.phoneNumber.length > 15) next.phoneNumber = 'Phone number must be 10–15 characters.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await startEnrollment(form);
      sessionStorage.setItem('gemfi_enrollment', JSON.stringify({ enrollmentId: result.data.enrollmentId, expiresAt: result.data.expiresAt }));
      navigate('/register/verify');
    } catch (err) {
      setApiError(err.body?.message || err.message || 'Unable to start enrollment.');
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
          <div>
            <h1 className="text-4xl font-bold">Activate Internet Banking</h1>
            <p className="mt-5 text-slate-300 max-w-md">Existing customers can self-enroll in a few simple steps and start banking online today.</p>
          </div>
          <p className="text-xs text-slate-500">{branding.companyName} Microfinance Bank</p>
        </div>
      </section>
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Logo className="lg:hidden text-2xl mb-8"/>
          <EnrollmentProgress current={0}/>
          <span className="w-11 h-11 rounded-xl bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] grid place-items-center"><ShieldCheck/></span>
          <h2 className="text-2xl font-bold mt-4">Verify your account</h2>
          <p className="text-slate-500 mt-1">Enter your account details to begin enrollment.</p>
          {apiError && <p className="mt-5 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{apiError}</p>}
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-medium">Account number
              <input inputMode="numeric" maxLength={10} value={form.accountNumber} onChange={e => setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, '') })} className="mt-2 w-full border rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[hsl(var(--primary))]" placeholder="10-digit account number"/>
              {errors.accountNumber && <span className="text-xs text-red-600 mt-1 block">{errors.accountNumber}</span>}
            </label>
            <label className="block text-sm font-medium">Email address
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-2 w-full border rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[hsl(var(--primary))]" placeholder="you@email.com"/>
              {errors.email && <span className="text-xs text-red-600 mt-1 block">{errors.email}</span>}
            </label>
            <label className="block text-sm font-medium">Phone number
              <input inputMode="tel" value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} className="mt-2 w-full border rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[hsl(var(--primary))]" placeholder="08012345678"/>
              {errors.phoneNumber && <span className="text-xs text-red-600 mt-1 block">{errors.phoneNumber}</span>}
            </label>
            <button disabled={loading} className="w-full bg-[hsl(var(--brand-secondary))] text-white font-semibold rounded-xl py-3.5 disabled:opacity-60">{loading ? 'Sending OTPs…' : 'Continue'}</button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[hsl(var(--primary))] font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}