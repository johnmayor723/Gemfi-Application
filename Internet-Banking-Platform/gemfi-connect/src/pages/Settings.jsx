import React, { useEffect, useState } from 'react';
import { KeyRound, Monitor, LogOut } from 'lucide-react';
import { changePassword, getSessions, logoutAll } from '@/api/auth.api';
import { useBankAuth } from '@/auth/AuthProvider';
import PageHeader from '@/components/PageHeader';

export default function Settings() {
  const { signOut } = useBankAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [signingOutAll, setSigningOutAll] = useState(false);

  useEffect(() => {
    getSessions().then(r => setSessions(r.data || [])).catch(() => {}).finally(() => setSessionsLoading(false));
  }, []);

  const submitPassword = async (e) => {
    e.preventDefault();
    setPwError(''); setPwMessage('');
    if (form.newPassword !== form.confirmPassword) { setPwError('New passwords do not match.'); return; }
    setPwLoading(true);
    try {
      await changePassword(form);
      setPwMessage('Password changed successfully.');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwError(err.body?.message || err.message || 'Unable to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm('Sign out of all devices, including this one?')) return;
    setSigningOutAll(true);
    try { await logoutAll(); } catch { /* proceed to local sign-out regardless */ }
    signOut();
  };

  return (
    <>
      <PageHeader title="Security" description="Manage your password and active sessions." />
      <div className="grid lg:grid-cols-2 gap-5">
        <section className="bg-white border rounded-2xl p-5">
          <span className="w-11 h-11 rounded-xl bg-[#e7f4ef] text-[#006f51] grid place-items-center"><KeyRound size={19} /></span>
          <h2 className="font-bold mt-4">Change password</h2>
          <p className="text-sm text-slate-500 mt-1">Choose a strong password you don't use elsewhere.</p>
          <form onSubmit={submitPassword} className="mt-5 space-y-3">
            <input required type="password" autoComplete="current-password" placeholder="Current password" value={form.currentPassword} onChange={e => setForm({ ...form, currentPassword: e.target.value })} className="w-full border rounded-xl px-4 py-2.5 text-sm" />
            <input required type="password" autoComplete="new-password" placeholder="New password" value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} className="w-full border rounded-xl px-4 py-2.5 text-sm" />
            <input required type="password" autoComplete="new-password" placeholder="Confirm new password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} className="w-full border rounded-xl px-4 py-2.5 text-sm" />
            {pwError && <p className="text-sm text-red-600">{pwError}</p>}
            {pwMessage && <p className="text-sm text-emerald-700">{pwMessage}</p>}
            <button disabled={pwLoading} className="bg-[#006f51] text-white rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60">{pwLoading ? 'Saving…' : 'Update password'}</button>
          </form>
        </section>

        <section className="bg-white border rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="w-11 h-11 rounded-xl bg-[#e7f4ef] text-[#006f51] grid place-items-center"><Monitor size={19} /></span>
            <button onClick={handleLogoutAll} disabled={signingOutAll} className="flex items-center gap-1.5 text-sm font-semibold text-red-600 disabled:opacity-60"><LogOut size={15} />Sign out everywhere</button>
          </div>
          <h2 className="font-bold mt-4">Active sessions</h2>
          <p className="text-sm text-slate-500 mt-1">Devices currently signed in to your account.</p>
          <div className="mt-4 space-y-2">
            {sessionsLoading ? (
              <div className="h-16 bg-slate-100 animate-pulse rounded-xl" />
            ) : sessions.length ? sessions.map(s => (
              <div key={s.id} className="border rounded-xl p-3 text-sm">
                <p className="font-medium">{s.deviceName || 'Unknown device'}</p>
                <p className="text-xs text-slate-500 mt-1">{s.ipAddress || 'Unknown IP'} · Signed in {s.createdAt ? new Date(s.createdAt).toLocaleString() : ''}</p>
              </div>
            )) : <p className="text-sm text-slate-500">No active sessions found.</p>}
          </div>
        </section>
      </div>
    </>
  );
}
