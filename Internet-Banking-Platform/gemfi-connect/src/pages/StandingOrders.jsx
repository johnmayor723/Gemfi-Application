import React, { useEffect, useState } from 'react';
import { Plus, X, Pause, Play, Ban } from 'lucide-react';
import { getStandingOrders, initiateStandingOrder, confirmStandingOrder, cancelStandingOrder, pauseStandingOrder, resumeStandingOrder } from '@/api/standingOrder.api';
import PageHeader from '@/components/PageHeader';

const emptyForm = { destinationAccountNumber: '', amount: '', narration: '', frequency: 'MONTHLY', startDate: '' };
const statusStyles = { ACTIVE: 'bg-emerald-50 text-emerald-700', PAUSED: 'bg-amber-50 text-amber-700', PENDING_OTP: 'bg-slate-100 text-slate-600', CANCELLED: 'bg-red-50 text-red-700', COMPLETED: 'bg-slate-100 text-slate-600' };

export default function StandingOrders() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [step, setStep] = useState('form');
  const [orderId, setOrderId] = useState(null);
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = () => {
    setLoading(true);
    getStandingOrders().then(r => setItems(r.data?.items || r.data || [])).catch(e => setError(e.body?.message || e.message)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const closeForm = () => { setShowForm(false); setStep('form'); setForm(emptyForm); setCode(''); setFormError(''); };

  const initiate = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const result = await initiateStandingOrder({ ...form, amount: Number(form.amount) });
      setOrderId(result.data?.id);
      setStep('otp');
    } catch (err) {
      setFormError(err.body?.message || err.message || 'Unable to create standing order.');
    } finally {
      setSaving(false);
    }
  };

  const confirm = async () => {
    setFormError('');
    setSaving(true);
    try {
      await confirmStandingOrder(orderId, code);
      closeForm();
      load();
    } catch (err) {
      setFormError(err.body?.message || err.message || 'Unable to confirm standing order.');
    } finally {
      setSaving(false);
    }
  };

  const act = (action, id) => action(id).then(load).catch(e => setError(e.body?.message || e.message));

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Standing orders" description="Automate recurring transfers." />
        <button onClick={() => setShowForm(true)} className="shrink-0 mt-1 inline-flex items-center gap-2 bg-[#006f51] text-white rounded-xl px-4 py-2.5 text-sm font-semibold"><Plus size={17} />New standing order</button>
      </div>

      {error && <p className="bg-red-50 text-red-700 p-4 rounded-xl mb-4">{error}</p>}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={closeForm}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold">{step === 'form' ? 'New standing order' : 'Enter OTP'}</h2><button onClick={closeForm}><X size={20} /></button></div>
            {step === 'form' ? (
              <form onSubmit={initiate} className="space-y-4">
                <label className="block text-sm font-medium">Destination account number
                  <input required inputMode="numeric" maxLength={10} value={form.destinationAccountNumber} onChange={e => setForm({ ...form, destinationAccountNumber: e.target.value.replace(/\D/g, '') })} className="mt-2 w-full border rounded-xl px-4 py-3" />
                </label>
                <label className="block text-sm font-medium">Amount
                  <input required type="number" min="1" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="mt-2 w-full border rounded-xl px-4 py-3" />
                </label>
                <label className="block text-sm font-medium">Frequency
                  <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} className="mt-2 w-full border rounded-xl px-4 py-3">
                    <option value="DAILY">Daily</option><option value="WEEKLY">Weekly</option><option value="MONTHLY">Monthly</option>
                  </select>
                </label>
                <label className="block text-sm font-medium">Start date
                  <input required type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="mt-2 w-full border rounded-xl px-4 py-3" />
                </label>
                <label className="block text-sm font-medium">Narration
                  <input maxLength={100} value={form.narration} onChange={e => setForm({ ...form, narration: e.target.value })} className="mt-2 w-full border rounded-xl px-4 py-3" />
                </label>
                {formError && <p className="text-sm text-red-600">{formError}</p>}
                <button disabled={saving} className="w-full bg-[#006f51] text-white rounded-xl py-3 font-semibold disabled:opacity-60">{saving ? 'Submitting…' : 'Continue'}</button>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">Enter the 6-digit code sent to you to activate this standing order.</p>
                <input inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} className="w-full border rounded-xl px-4 py-3 tracking-widest text-center text-lg" placeholder="000000" />
                {formError && <p className="text-sm text-red-600">{formError}</p>}
                <button disabled={saving || code.length !== 6} onClick={confirm} className="w-full bg-[#006f51] text-white rounded-xl py-3 font-semibold disabled:opacity-60">{saving ? 'Confirming…' : 'Confirm'}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="h-44 bg-slate-100 animate-pulse rounded-2xl" />
      ) : items.length ? (
        <div className="bg-white border rounded-2xl divide-y">
          {items.map(o => (
            <div key={o.id} className="p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-sm">{o.destinationAccountNumber} · {o.frequency}</p>
                <p className="text-xs text-slate-500 mt-1">{o.narration || 'No narration'} {o.nextRunAt ? `· Next run ${new Date(o.nextRunAt).toLocaleDateString()}` : ''}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm">NGN {o.amount}</span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[o.status] || 'bg-slate-100 text-slate-600'}`}>{o.status}</span>
                {o.status === 'ACTIVE' && <button onClick={() => act(pauseStandingOrder, o.id)} aria-label="Pause" className="text-slate-400 hover:text-[#006f51]"><Pause size={17} /></button>}
                {o.status === 'PAUSED' && <button onClick={() => act(resumeStandingOrder, o.id)} aria-label="Resume" className="text-slate-400 hover:text-[#006f51]"><Play size={17} /></button>}
                {['ACTIVE', 'PAUSED'].includes(o.status) && <button onClick={() => act(cancelStandingOrder, o.id)} aria-label="Cancel" className="text-slate-400 hover:text-red-600"><Ban size={17} /></button>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border rounded-2xl p-12 text-center text-slate-500">No standing orders yet.</div>
      )}
    </>
  );
}
