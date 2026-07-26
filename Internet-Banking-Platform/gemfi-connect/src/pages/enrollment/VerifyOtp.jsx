import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { verifyEnrollment } from '@/api/enrollment.api';
import EnrollmentProgress from '@/components/EnrollmentProgress';
import Logo from '@/components/Logo';
import bgImg from '@/assets/bg-img.jpg';

export default function VerifyOtp() {
  const navigate = useNavigate();
  const [enrollmentId, setEnrollmentId] = useState('');
  const [form, setForm] = useState({ emailOtp: '', smsOtp: '' });
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    const stored = JSON.parse(sessionStorage.getItem('gemfi_enrollment') || 'null');
    if (!stored) { navigate('/register'); return; }
    setEnrollmentId(stored.enrollmentId);
    const timer = setInterval(() => setSeconds(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!/^\d{6}$/.test(form.emailOtp) || !/^\d{6}$/.test(form.smsOtp)) { setApiError('Both OTPs must be exactly 6 digits.'); return; }
    setLoading(true);
    try {
      await verifyEnrollment({ enrollmentId, emailOtp: form.emailOtp, smsOtp: form.smsOtp });
      navigate('/register/complete');
    } catch (err) {
      setApiError(err.body?.message || err.message || 'OTP verification failed.');
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
          <div><h1 className="text-4xl font-bold">Verify your identity</h1><p className="mt-5 text-slate-300 max-w-md">We sent a code to your email and phone number.</p></div>
          <p className="text-xs text-slate-500">Gemfi Microfinance Bank</p>
        </div>
      </section>
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Logo className="lg:hidden text-2xl mb-8"/>
          <EnrollmentProgress current={1}/>
          <span className="w-11 h-11 rounded-xl bg-[#e7f4ef] text-[#006f51] grid place-items-center"><KeyRound/></span>
          <h2 className="text-2xl font-bold mt-4">Enter your OTPs</h2>
          <p className="text-slate-500 mt-1">Check your email and phone for the 6-digit codes.</p>
          {apiError && <p className="mt-5 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{apiError}</p>}
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-medium">Email OTP
              <input inputMode="numeric" maxLength={6} value={form.emailOtp} onChange={e => setForm({ ...form, emailOtp: e.target.value.replace(/\D/g, '') })} className="mt-2 w-full border rounded-xl px-4 py-3.5 tracking-[0.5em] text-center focus:ring-2 focus:ring-[#006f51]" placeholder="000000"/>
            </label>
            <label className="block text-sm font-medium">SMS OTP
              <input inputMode="numeric" maxLength={6} value={form.smsOtp} onChange={e => setForm({ ...form, smsOtp: e.target.value.replace(/\D/g, '') })} className="mt-2 w-full border rounded-xl px-4 py-3.5 tracking-[0.5em] text-center focus:ring-2 focus:ring-[#006f51]" placeholder="000000"/>
            </label>
            <button disabled={loading} className="w-full bg-[#ff832e] text-white font-semibold rounded-xl py-3.5 disabled:opacity-60">{loading ? 'Verifying…' : 'Verify OTP'}</button>
            <button type="button" disabled={seconds > 0} onClick={() => setSeconds(60)} className="w-full text-sm text-[#006f51] disabled:text-slate-400">{seconds > 0 ? `Resend OTP in ${seconds}s` : 'Resend OTP'}</button>
          </form>
        </div>
      </section>
    </main>
  );
}