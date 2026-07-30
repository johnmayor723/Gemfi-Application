import React, { useEffect, useState } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import { getBulkTransfers, initiateBulkTransfer, confirmBulkTransfer } from '@/api/bulkTransfer.api';
import PageHeader from '@/components/PageHeader';

const emptyItem = { destinationAccountNumber: '', amount: '', narration: '' };
const statusStyles = { PENDING_OTP: 'bg-slate-100 text-slate-600', PROCESSING: 'bg-amber-50 text-amber-700', COMPLETED: 'bg-emerald-50 text-emerald-700', FAILED: 'bg-red-50 text-red-700' };

export default function BulkTransfers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [rows, setRows] = useState([{ ...emptyItem }]);
  const [narration, setNarration] = useState('');
  const [step, setStep] = useState('form');
  const [batchId, setBatchId] = useState(null);
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = () => {
    setLoading(true);
    getBulkTransfers().then(r => setItems(r.data?.items || r.data || [])).catch(e => setError(e.body?.message || e.message)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const closeForm = () => { setShowForm(false); setStep('form'); setRows([{ ...emptyItem }]); setNarration(''); setCode(''); setFormError(''); };

  const updateRow = (i, field, value) => setRows(rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  const addRow = () => setRows([...rows, { ...emptyItem }]);
  const removeRow = (i) => setRows(rows.filter((_, idx) => idx !== i));

  const initiate = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const payload = {
        items: rows.map(r => ({ destinationAccountNumber: r.destinationAccountNumber, amount: Number(r.amount), narration: r.narration || undefined })),
        narration: narration || undefined,
      };
      const result = await initiateBulkTransfer(payload);
      setBatchId(result.data?.id);
      setStep('otp');
    } catch (err) {
      setFormError(err.body?.message || err.message || 'Unable to create bulk transfer.');
    } finally {
      setSaving(false);
    }
  };

  const confirm = async () => {
    setFormError('');
    setSaving(true);
    try {
      await confirmBulkTransfer(batchId, code);
      closeForm();
      load();
    } catch (err) {
      setFormError(err.body?.message || err.message || 'Unable to confirm bulk transfer.');
    } finally {
      setSaving(false);
    }
  };

  const total = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Bulk transfers" description="Pay multiple beneficiaries in one batch." />
        <button onClick={() => setShowForm(true)} className="shrink-0 mt-1 inline-flex items-center gap-2 bg-[hsl(var(--primary))] text-white rounded-xl px-4 py-2.5 text-sm font-semibold"><Plus size={17} />New batch</button>
      </div>

      {error && <p className="bg-red-50 text-red-700 p-4 rounded-xl mb-4">{error}</p>}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={closeForm}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold">{step === 'form' ? 'New bulk transfer' : 'Enter OTP'}</h2><button onClick={closeForm}><X size={20} /></button></div>
            {step === 'form' ? (
              <form onSubmit={initiate} className="space-y-4">
                <div className="space-y-3">
                  {rows.map((r, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-start">
                      <input required inputMode="numeric" maxLength={10} placeholder="Account number" value={r.destinationAccountNumber} onChange={e => updateRow(i, 'destinationAccountNumber', e.target.value.replace(/\D/g, ''))} className="border rounded-xl px-3 py-2.5 text-sm" />
                      <input required type="number" min="1" step="0.01" placeholder="Amount" value={r.amount} onChange={e => updateRow(i, 'amount', e.target.value)} className="border rounded-xl px-3 py-2.5 text-sm" />
                      <input placeholder="Narration" value={r.narration} onChange={e => updateRow(i, 'narration', e.target.value)} className="border rounded-xl px-3 py-2.5 text-sm" />
                      <button type="button" onClick={() => removeRow(i)} disabled={rows.length === 1} className="p-2.5 text-slate-400 hover:text-red-600 disabled:opacity-30"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addRow} className="text-sm font-semibold text-[hsl(var(--primary))]">+ Add another beneficiary</button>
                <label className="block text-sm font-medium">Batch narration
                  <input maxLength={100} value={narration} onChange={e => setNarration(e.target.value)} className="mt-2 w-full border rounded-xl px-4 py-3" placeholder="Optional" />
                </label>
                <div className="flex justify-between text-sm font-semibold bg-slate-50 rounded-xl p-3"><span>Total</span><span>NGN {total.toFixed(2)}</span></div>
                {formError && <p className="text-sm text-red-600">{formError}</p>}
                <button disabled={saving} className="w-full bg-[hsl(var(--primary))] text-white rounded-xl py-3 font-semibold disabled:opacity-60">{saving ? 'Submitting…' : 'Continue'}</button>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">Enter the 6-digit code sent to you to confirm this batch.</p>
                <input inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} className="w-full border rounded-xl px-4 py-3 tracking-widest text-center text-lg" placeholder="000000" />
                {formError && <p className="text-sm text-red-600">{formError}</p>}
                <button disabled={saving || code.length !== 6} onClick={confirm} className="w-full bg-[hsl(var(--primary))] text-white rounded-xl py-3 font-semibold disabled:opacity-60">{saving ? 'Confirming…' : 'Confirm'}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="h-44 bg-slate-100 animate-pulse rounded-2xl" />
      ) : items.length ? (
        <div className="bg-white border rounded-2xl divide-y">
          {items.map(b => (
            <div key={b.id} className="p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-sm">{b.items?.length || 0} beneficiaries</p>
                <p className="text-xs text-slate-500 mt-1">{b.narration || 'No narration'}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm">NGN {b.totalAmount ?? b.amount ?? '—'}</span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[b.status] || 'bg-slate-100 text-slate-600'}`}>{b.status}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border rounded-2xl p-12 text-center text-slate-500">No bulk transfers yet.</div>
      )}
    </>
  );
}
