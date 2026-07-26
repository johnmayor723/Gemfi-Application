import React, { useState, useEffect, useCallback } from 'react';
import { kycApi, isKycConfigured } from '@/lib/kycApi';
import { AlertTriangle, Clock, XCircle, FileWarning, UserCheck, Loader2, ShieldCheck } from 'lucide-react';
import PageHeader from '@/components/fineract/PageHeader';
import KycNotConfigured from '@/components/fineract/kyc/KycNotConfigured';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
      <Icon className={`w-5 h-5 mb-3 ${color}`} />
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

export default function KycDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!isKycConfigured()) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await kycApi('/dashboard');
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!isKycConfigured()) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <PageHeader title="KYC Dashboard" description="Compliance and identity verification overview" />
        <KycNotConfigured />
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>;
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <PageHeader title="KYC Dashboard" description="Compliance and identity verification overview" />
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
          <p className="text-sm text-slate-400">{error}</p>
          <button onClick={load} className="mt-3 text-xs text-emerald-400 hover:underline">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="KYC Dashboard" description="Compliance and identity verification overview" />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        <StatCard icon={Clock} label="Pending Verifications" value={stats?.pendingVerifications ?? 0} color="text-amber-400" />
        <StatCard icon={XCircle} label="Failed BVN" value={stats?.failedBVN ?? 0} color="text-rose-400" />
        <StatCard icon={FileWarning} label="Expired Documents" value={stats?.expiredDocuments ?? 0} color="text-orange-400" />
        <StatCard icon={ShieldCheck} label="Pending Credit Checks" value={stats?.pendingCreditChecks ?? 0} color="text-blue-400" />
        <StatCard icon={UserCheck} label="Pending Approvals" value={stats?.pendingApprovals ?? 0} color="text-emerald-400" />
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-3">KYC Service Status</h2>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-emerald-400">KYC Service is connected and operational</span>
        </div>
      </div>
    </div>
  );
}