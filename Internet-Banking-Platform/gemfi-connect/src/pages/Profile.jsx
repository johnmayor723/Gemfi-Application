import React, { useEffect, useState } from 'react';
import { getProfile, updateProfile } from '@/api/customer.api';
import { getKycMe, linkBvn, linkNin } from '@/api/kyc.api';
import PageHeader from '@/components/PageHeader';

export default function Profile() {
  const [customer, setCustomer] = useState(null);
  const [form, setForm] = useState({ displayName: '', notificationsEnabled: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [kyc, setKyc] = useState(null);
  const [kycLoading, setKycLoading] = useState(true);
  const [bvnValue, setBvnValue] = useState('');
  const [ninValue, setNinValue] = useState('');
  const [linking, setLinking] = useState({ bvn: false, nin: false });
  const [kycError, setKycError] = useState({ bvn: '', nin: '' });

  useEffect(() => {
    getProfile().then(r => {
      setCustomer(r.data?.customer || null);
      if (r.data?.preferences) setForm(r.data.preferences);
    }).catch(e => setError(e.body?.message || e.message)).finally(() => setLoading(false));

    getKycMe().then(r => setKyc(r.data || null)).catch(() => {}).finally(() => setKycLoading(false));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await updateProfile(form);
      setMessage('Preferences updated successfully.');
    } catch (err) {
      setError(err.body?.message || err.message || 'Unable to update preferences.');
    } finally {
      setSaving(false);
    }
  };

  const submitBvn = async (e) => {
    e.preventDefault();
    setLinking(l => ({ ...l, bvn: true }));
    setKycError(er => ({ ...er, bvn: '' }));
    try {
      const r = await linkBvn(bvnValue);
      setKyc(r.data);
      setBvnValue('');
    } catch (err) {
      setKycError(er => ({ ...er, bvn: err.body?.message || err.message || 'Unable to link BVN.' }));
    } finally {
      setLinking(l => ({ ...l, bvn: false }));
    }
  };

  const submitNin = async (e) => {
    e.preventDefault();
    setLinking(l => ({ ...l, nin: true }));
    setKycError(er => ({ ...er, nin: '' }));
    try {
      const r = await linkNin(ninValue);
      setKyc(r.data);
      setNinValue('');
    } catch (err) {
      setKycError(er => ({ ...er, nin: err.body?.message || err.message || 'Unable to link NIN.' }));
    } finally {
      setLinking(l => ({ ...l, nin: false }));
    }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="Profile" description="Your account details and preferences." />

      {loading ? (
        <div className="h-48 bg-slate-100 animate-pulse rounded-2xl" />
      ) : (
        <>
          <section className="bg-white border rounded-2xl p-6 mb-5">
            <h2 className="font-bold mb-4">Account details</h2>
            <p className="text-xs text-slate-400 mb-4">Sourced from your bank record — contact the branch to update these.</p>
            <dl className="grid sm:grid-cols-2 gap-4 text-sm">
              <div><dt className="text-slate-500">Full name</dt><dd className="font-medium mt-1">{customer?.displayName || '—'}</dd></div>
              <div><dt className="text-slate-500">Email</dt><dd className="font-medium mt-1">{customer?.emailAddress || '—'}</dd></div>
              <div><dt className="text-slate-500">Phone number</dt><dd className="font-medium mt-1">{customer?.mobileNo || '—'}</dd></div>
              <div><dt className="text-slate-500">Status</dt><dd className="font-medium mt-1">{customer?.active ? 'Active' : 'Inactive'}</dd></div>
            </dl>
          </section>

          <section className="bg-white border rounded-2xl p-6 mb-5">
            <h2 className="font-bold mb-1">Identity verification</h2>
            <p className="text-xs text-slate-400 mb-4">Link your BVN and NIN to unlock full account limits.</p>
            {kycLoading ? (
              <div className="h-24 bg-slate-100 animate-pulse rounded-xl" />
            ) : (
              <div className="space-y-4">
                {kyc?.bvnLinked ? (
                  <div className="flex items-center justify-between border rounded-xl p-4">
                    <div><p className="text-sm font-medium">BVN</p><p className="text-xs text-slate-500 mt-0.5">{kyc.bvn}</p></div>
                    <span className={`text-xs px-2.5 py-1 rounded-full ${kyc.bvnVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{kyc.bvnVerified ? 'Verified' : 'Pending'}</span>
                  </div>
                ) : (
                  <form onSubmit={submitBvn} className="flex gap-2">
                    <input required maxLength={11} inputMode="numeric" placeholder="11-digit BVN" value={bvnValue} onChange={e => setBvnValue(e.target.value.replace(/\D/g, ''))} className="flex-1 border rounded-xl px-4 py-2.5 text-sm" />
                    <button disabled={linking.bvn} className="bg-[#006f51] text-white rounded-xl px-4 text-sm font-semibold disabled:opacity-60">{linking.bvn ? 'Linking…' : 'Link BVN'}</button>
                  </form>
                )}
                {kycError.bvn && <p className="text-sm text-red-600">{kycError.bvn}</p>}

                {kyc?.ninLinked ? (
                  <div className="flex items-center justify-between border rounded-xl p-4">
                    <div><p className="text-sm font-medium">NIN</p><p className="text-xs text-slate-500 mt-0.5">{kyc.nin}</p></div>
                    <span className={`text-xs px-2.5 py-1 rounded-full ${kyc.ninVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{kyc.ninVerified ? 'Verified' : 'Pending'}</span>
                  </div>
                ) : (
                  <form onSubmit={submitNin} className="flex gap-2">
                    <input required maxLength={11} inputMode="numeric" placeholder="11-digit NIN" value={ninValue} onChange={e => setNinValue(e.target.value.replace(/\D/g, ''))} className="flex-1 border rounded-xl px-4 py-2.5 text-sm" />
                    <button disabled={linking.nin} className="bg-[#006f51] text-white rounded-xl px-4 text-sm font-semibold disabled:opacity-60">{linking.nin ? 'Linking…' : 'Link NIN'}</button>
                  </form>
                )}
                {kycError.nin && <p className="text-sm text-red-600">{kycError.nin}</p>}
              </div>
            )}
          </section>

          <form onSubmit={save} className="bg-white border rounded-2xl p-6 space-y-4">
            <h2 className="font-bold">Preferences</h2>
            <label className="block text-sm font-medium">Preferred display name
              <input value={form.displayName || ''} onChange={e => setForm({ ...form, displayName: e.target.value })} maxLength={100} placeholder={customer?.displayName || ''} className="mt-2 w-full border rounded-xl px-4 py-3" />
            </label>
            <label className="flex items-center justify-between border rounded-xl p-4">
              <span><b className="block text-sm">Notifications</b><small className="text-slate-500">Receive account activity updates</small></span>
              <input type="checkbox" checked={Boolean(form.notificationsEnabled)} onChange={e => setForm({ ...form, notificationsEnabled: e.target.checked })} className="w-5 h-5 accent-[#006f51]" />
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-emerald-700">{message}</p>}
            <button disabled={saving} className="bg-[#006f51] text-white rounded-xl px-6 py-3 disabled:opacity-50">{saving ? 'Saving…' : 'Save changes'}</button>
          </form>
        </>
      )}
    </div>
  );
}
