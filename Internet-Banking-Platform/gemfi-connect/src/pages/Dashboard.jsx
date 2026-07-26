import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Send, ReceiptText, UserRound, ShieldCheck, BadgeCheck } from 'lucide-react';
import { getAccounts } from '@/api/account.api';
import { generateStatement } from '@/api/statement.api';
import { getKycMe } from '@/api/kyc.api';
import { useBankAuth } from '@/auth/AuthProvider';
import BalanceCard from '@/components/BalanceCard';
import AccountCard from '@/components/AccountCard';
import TransactionTable from '@/components/TransactionTable';
import PageHeader from '@/components/PageHeader';

const kycStatusStyles = {
  VERIFIED: 'bg-emerald-50 text-emerald-700',
  PARTIALLY_VERIFIED: 'bg-amber-50 text-amber-700',
  NOT_STARTED: 'bg-slate-100 text-slate-600',
};

export default function Dashboard() {
  const { user } = useBankAuth();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [kyc, setKyc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failedSections, setFailedSections] = useState([]);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      getAccounts(),
      user?.accountNumber ? generateStatement({ accountNumber: user.accountNumber }) : Promise.resolve(null),
      getKycMe(),
    ]).then(([accountsResult, statementResult, kycResult]) => {
      const failed = [];

      if (accountsResult.status === 'fulfilled') setAccounts(accountsResult.value.data || []);
      else failed.push('accounts');

      if (statementResult.status === 'fulfilled') {
        setTransactions([...(statementResult.value?.data?.transactions || [])].reverse().slice(0, 5));
      } else {
        failed.push('recent transactions');
      }

      if (kycResult.status === 'fulfilled') setKyc(kycResult.value.data || null);
      else failed.push('identity verification status');

      setFailedSections(failed);
    }).finally(() => setLoading(false));
  }, [user]);

  const primary = accounts.find(a => a.isPrimary) || accounts[0];

  return (
    <>
      <PageHeader title="Dashboard" description="Your financial overview at a glance." />
      {!loading && failedSections.length > 0 && (
        <div className="mb-5 bg-red-50 text-red-700 rounded-xl p-4">
          Couldn't load {failedSections.join(', ')} right now. The rest of your dashboard is up to date — try refreshing shortly.
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <BalanceCard availableBalance={primary?.availableBalance} ledgerBalance={primary?.ledgerBalance} currency={primary?.currency} />
        <div className="lg:col-span-2 grid grid-cols-3 gap-3">
          {[['Send money', '/transfers', Send], ['Pay bills', '/payments', ReceiptText], ['Profile', '/profile', UserRound]].map(([x, to, I]) => (
            <Link key={to} to={to} className="bg-white border rounded-2xl p-4 flex flex-col justify-between hover:border-[#ff832e] transition">
              <I className="text-[#006f51]" />
              <span className="mt-6 text-sm font-semibold">{x}</span>
            </Link>
          ))}
        </div>
      </div>

      <section className="mt-8">
        <div className="flex justify-between mb-4">
          <h2 className="text-lg font-bold">Your accounts</h2>
          <Link to="/accounts" className="text-sm text-[#006f51] flex gap-1">View all <ArrowRight size={16} /></Link>
        </div>
        {loading ? (
          <div className="h-44 bg-slate-100 animate-pulse rounded-2xl" />
        ) : accounts.length ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.slice(0, 3).map(a => <AccountCard key={a.accountNumber} account={a} />)}
          </div>
        ) : (
          <div className="bg-white border rounded-2xl p-10 text-center text-slate-500">No accounts available.</div>
        )}
      </section>

      <section className="mt-8 bg-white border rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-11 h-11 rounded-xl bg-[#e7f4ef] text-[#006f51] grid place-items-center"><ShieldCheck size={19} /></span>
          <div>
            <h2 className="text-lg font-bold">Identity verification</h2>
            <p className="text-sm text-slate-500">BVN and NIN status</p>
          </div>
        </div>
        {loading ? (
          <div className="h-16 bg-slate-100 animate-pulse rounded-xl" />
        ) : kyc ? (
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="border rounded-xl p-4">
              <p className="text-xs text-slate-500">BVN</p>
              <p className="font-semibold mt-1">{kyc.bvn || 'Not linked'}</p>
              <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${kyc.bvnVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{kyc.bvnVerified ? 'Verified' : kyc.bvnLinked ? 'Pending' : 'Not linked'}</span>
            </div>
            <div className="border rounded-xl p-4">
              <p className="text-xs text-slate-500">NIN</p>
              <p className="font-semibold mt-1">{kyc.nin || 'Not linked'}</p>
              <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${kyc.ninVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{kyc.ninVerified ? 'Verified' : kyc.ninLinked ? 'Pending' : 'Not linked'}</span>
            </div>
            <div className="border rounded-xl p-4 flex flex-col justify-between">
              <p className="text-xs text-slate-500">Overall status</p>
              <span className={`inline-flex items-center gap-1.5 mt-1 text-sm font-semibold px-2.5 py-1 rounded-full w-fit ${kycStatusStyles[kyc.overallStatus] || 'bg-slate-100 text-slate-600'}`}><BadgeCheck size={14} />{kyc.overallStatus?.replace(/_/g, ' ') || 'Not started'}</span>
            </div>
          </div>
        ) : null}
      </section>

      <section className="mt-8 bg-white border rounded-2xl p-5">
        <div className="flex justify-between mb-3">
          <h2 className="text-lg font-bold">Recent transactions</h2>
          <Link to="/transactions" className="text-sm text-[#006f51]">View all</Link>
        </div>
        <TransactionTable transactions={transactions} loading={loading} />
      </section>
    </>
  );
}
