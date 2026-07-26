import React from 'react';
import { Fingerprint, IdCard, BadgeCheck, Calendar, UserCog } from 'lucide-react';
import KycCard from './KycCard';
import KycStatusBadge from './KycStatusBadge';

function StatusRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <span className="text-sm text-white">{value || '—'}</span>
    </div>
  );
}

export default function IdentityStatus({ kyc, status }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <KycCard title="Identity Status" icon={BadgeCheck} status={kyc?.status}>
        <StatusRow icon={Fingerprint} label="BVN Verification" value={<KycStatusBadge status={kyc?.bvn?.status || 'pending'} />} />
        <StatusRow icon={IdCard} label="NIN Verification" value={<KycStatusBadge status={kyc?.nin?.status || 'pending'} />} />
        <StatusRow icon={BadgeCheck} label="KYC Level" value={kyc?.kycLevel || '—'} />
        <StatusRow icon={Calendar} label="Verification Date" value={kyc?.verificationDate} />
        <StatusRow icon={UserCog} label="Verification Officer" value={kyc?.verificationOfficer} />
        <StatusRow icon={BadgeCheck} label="Verification Status" value={<KycStatusBadge status={kyc?.status || 'pending'} />} />
      </KycCard>

      <KycCard title="KYC Completion" icon={BadgeCheck} status={status?.completion >= 100 ? 'verified' : 'pending'}>
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative w-28 h-28">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgb(51 65 85)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none" stroke="rgb(16 185 129)" strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - (status?.completion || 0) / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-white">{status?.completion || 0}%</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-4 text-xs">
            <span className="text-slate-400">Photo</span><span className={status?.photo ? 'text-emerald-400' : 'text-slate-600'}>{status?.photo ? '✓' : '✗'}</span>
            <span className="text-slate-400">Signature</span><span className={status?.signature ? 'text-emerald-400' : 'text-slate-600'}>{status?.signature ? '✓' : '✗'}</span>
            <span className="text-slate-400">Documents</span><span className={status?.documents ? 'text-emerald-400' : 'text-slate-600'}>{status?.documents ? '✓' : '✗'}</span>
            <span className="text-slate-400">BVN</span><span className={status?.bvn ? 'text-emerald-400' : 'text-slate-600'}>{status?.bvn ? '✓' : '✗'}</span>
            <span className="text-slate-400">NIN</span><span className={status?.nin ? 'text-emerald-400' : 'text-slate-600'}>{status?.nin ? '✓' : '✗'}</span>
            <span className="text-slate-400">Credit Check</span><span className={status?.creditCheck ? 'text-emerald-400' : 'text-slate-600'}>{status?.creditCheck ? '✓' : '✗'}</span>
            <span className="text-slate-400">AML</span><span className={status?.aml ? 'text-emerald-400' : 'text-slate-600'}>{status?.aml ? '✓' : '✗'}</span>
          </div>
        </div>
      </KycCard>
    </div>
  );
}