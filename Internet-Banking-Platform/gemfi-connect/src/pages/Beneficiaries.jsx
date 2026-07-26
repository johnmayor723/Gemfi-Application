import React, { useEffect, useState } from 'react';
import { Plus, Star, Trash2, X, UserRound } from 'lucide-react';
import { getBeneficiaries, createBeneficiary, updateBeneficiary, deleteBeneficiary } from '@/api/beneficiary.api';
import PageHeader from '@/components/PageHeader';

const emptyForm = { accountNumber: '', bankCode: '', bankName: '', accountName: '', nickname: '' };

export default function Beneficiaries() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = () => {
    setLoading(true);
    getBeneficiaries().then(r => setItems(r.data || [])).catch(e => setError(e.body?.message || e.message)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const payload = { accountNumber: form.accountNumber, nickname: form.nickname || undefined };
      if (form.bankCode) { payload.bankCode = form.bankCode; payload.bankName = form.bankName; payload.accountName = form.accountName; }
      await createBeneficiary(payload);
      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setFormError(err.body?.message || err.message || 'Unable to add beneficiary.');
    } finally {
      setSaving(false);
    }
  };

  const toggleFavorite = (b) => updateBeneficiary(b.id || b._id, { isFavorite: !b.isFavorite }).then(load);
  const remove = (b) => { if (window.confirm('Remove this beneficiary?')) deleteBeneficiary(b.id || b._id).then(load); };

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Beneficiaries" description="Manage the accounts you send money to often." />
        <button onClick={() => setShowForm(true)} className="shrink-0 mt-1 inline-flex items-center gap-2 bg-[#006f51] text-white rounded-xl px-4 py-2.5 text-sm font-semibold"><Plus size={17} />Add beneficiary</button>
      </div>

      {error && <p className="bg-red-50 text-red-700 p-4 rounded-xl mb-4">{error}</p>}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <form onClick={e => e.stopPropagation()} onSubmit={submit} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center"><h2 className="text-lg font-bold">Add beneficiary</h2><button type="button" onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <label className="block text-sm font-medium">Account number
              <input inputMode="numeric" maxLength={10} required value={form.accountNumber} onChange={e => setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, '') })} className="mt-2 w-full border rounded-xl px-4 py-3" placeholder="10-digit account number" />
            </label>
            <label className="block text-sm font-medium">Bank code (leave blank for Gemfi MFB)
              <input value={form.bankCode} onChange={e => setForm({ ...form, bankCode: e.target.value })} className="mt-2 w-full border rounded-xl px-4 py-3" placeholder="Optional" />
            </label>
            {form.bankCode && <>
              <label className="block text-sm font-medium">Bank name
                <input required value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} className="mt-2 w-full border rounded-xl px-4 py-3" />
              </label>
              <label className="block text-sm font-medium">Account name
                <input required value={form.accountName} onChange={e => setForm({ ...form, accountName: e.target.value })} className="mt-2 w-full border rounded-xl px-4 py-3" />
              </label>
            </>}
            <label className="block text-sm font-medium">Nickname
              <input maxLength={50} value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} className="mt-2 w-full border rounded-xl px-4 py-3" placeholder="Optional" />
            </label>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <button disabled={saving} className="w-full bg-[#006f51] text-white rounded-xl py-3 font-semibold disabled:opacity-60">{saving ? 'Saving…' : 'Save beneficiary'}</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="h-44 bg-slate-100 animate-pulse rounded-2xl" />
      ) : items.length ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(b => (
            <div key={b.id || b._id} className="bg-white border rounded-2xl p-5">
              <div className="flex justify-between items-start">
                <span className="w-11 h-11 rounded-xl bg-[#e7f4ef] text-[#006f51] grid place-items-center"><UserRound size={20} /></span>
                <div className="flex gap-1">
                  <button onClick={() => toggleFavorite(b)} aria-label="Toggle favorite" className={b.isFavorite ? 'text-[#ff832e]' : 'text-slate-300 hover:text-[#ff832e]'}><Star size={18} fill={b.isFavorite ? 'currentColor' : 'none'} /></button>
                  <button onClick={() => remove(b)} aria-label="Remove beneficiary" className="text-slate-300 hover:text-red-600"><Trash2 size={18} /></button>
                </div>
              </div>
              <p className="font-bold mt-4">{b.nickname || b.accountName || 'Beneficiary'}</p>
              <p className="text-sm text-slate-500 mt-1">{b.accountNumber}</p>
              <p className="text-xs text-slate-400 mt-1">{b.bankName || 'Gemfi Microfinance Bank'}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border rounded-2xl p-12 text-center text-slate-500">No beneficiaries yet. Add one to send money faster next time.</div>
      )}
    </>
  );
}
