import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { generateStatement, downloadStatementCsv } from '@/api/statement.api';
import { useBankAuth } from '@/auth/AuthProvider';
import PageHeader from '@/components/PageHeader';

export default function Statements() {
  const { user } = useBankAuth();
  const [form, setForm] = useState({ accountNumber: user?.accountNumber || '', startDate: '', endDate: '' });
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await generateStatement(form);
      setStatement(result.data);
    } catch (err) {
      setError(err.body?.message || err.message || 'Unable to generate statement.');
    } finally {
      setLoading(false);
    }
  };

  const download = async () => {
    setError('');
    setDownloading(true);
    try {
      await downloadStatementCsv(form);
    } catch (err) {
      setError(err.body?.message || err.message || 'Unable to download statement.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <PageHeader title="Statements" description="Generate a statement of account for any date range." />
      <form onSubmit={submit} className="bg-white border rounded-2xl p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <label className="block text-sm font-medium">Account number
          <input required inputMode="numeric" maxLength={10} value={form.accountNumber} onChange={e => setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, '') })} className="mt-2 w-full border rounded-xl px-3 py-2.5" />
        </label>
        <label className="block text-sm font-medium">Start date
          <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="mt-2 w-full border rounded-xl px-3 py-2.5" />
        </label>
        <label className="block text-sm font-medium">End date
          <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="mt-2 w-full border rounded-xl px-3 py-2.5" />
        </label>
        <div className="flex gap-2 items-end">
          <button disabled={loading} className="flex-1 bg-[hsl(var(--primary))] text-white rounded-xl py-2.5 font-semibold disabled:opacity-60">{loading ? 'Loading…' : 'View'}</button>
          <button type="button" onClick={download} disabled={downloading || !form.accountNumber} className="shrink-0 border rounded-xl px-3 py-2.5 disabled:opacity-60" aria-label="Download CSV"><Download size={18} /></button>
        </div>
      </form>

      {error && <p className="bg-red-50 text-red-700 p-4 rounded-xl mb-4">{error}</p>}

      {statement && (
        <section className="bg-white border rounded-2xl p-5">
          <div className="flex flex-wrap justify-between gap-4 mb-5 pb-5 border-b">
            <div><p className="text-sm text-slate-500">Account</p><p className="font-bold">{statement.accountName} · {statement.accountNumber}</p></div>
            <div><p className="text-sm text-slate-500">Opening balance</p><p className="font-bold">{statement.openingBalance ?? '—'}</p></div>
            <div><p className="text-sm text-slate-500">Closing balance</p><p className="font-bold">{statement.closingBalance ?? '—'}</p></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-slate-500"><th className="pb-2 font-medium">Date</th><th className="pb-2 font-medium">Description</th><th className="pb-2 font-medium">Type</th><th className="pb-2 font-medium text-right">Amount</th><th className="pb-2 font-medium text-right">Balance</th></tr></thead>
              <tbody>
                {(statement.transactions || []).map((t, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-2.5">{t.date}</td>
                    <td className="py-2.5">{t.description}</td>
                    <td className="py-2.5">{t.type === 'CREDIT' ? <span className="text-emerald-700">Credit</span> : <span className="text-red-600">Debit</span>}</td>
                    <td className="py-2.5 text-right">{t.amount}</td>
                    <td className="py-2.5 text-right">{t.runningBalance}</td>
                  </tr>
                ))}
                {!statement.transactions?.length && <tr><td colSpan={5} className="py-8 text-center text-slate-500">No transactions in this period.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
