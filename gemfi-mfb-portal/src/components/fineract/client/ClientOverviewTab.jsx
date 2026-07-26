import React from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, PiggyBank, FileText, UserCheck, UserX, Edit, Upload, IdCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/fineract/StatusBadge';

export default function ClientOverviewTab({ client, accounts, onEdit, onActivate, onClose, onApplyLoan }) {
  const Field = ({ label, value }) => (
    <div>
      <dt className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">{label}</dt>
      <dd className="text-sm text-white mt-1">{value || '—'}</dd>
    </div>
  );

  const loanCount = accounts?.loanAccounts?.length || 0;
  const savingsCount = accounts?.savingsAccounts?.length || 0;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <CreditCard className="w-4 h-4 text-blue-400 mb-2" />
          <div className="text-xl font-bold text-white">{loanCount}</div>
          <div className="text-[11px] text-slate-500 uppercase">Loans</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <PiggyBank className="w-4 h-4 text-amber-400 mb-2" />
          <div className="text-xl font-bold text-white">{savingsCount}</div>
          <div className="text-[11px] text-slate-500 uppercase">Savings</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <UserCheck className="w-4 h-4 text-emerald-400 mb-2" />
          <div className="text-xl font-bold text-white">{client.status?.value || '—'}</div>
          <div className="text-[11px] text-slate-500 uppercase">Status</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <FileText className="w-4 h-4 text-purple-400 mb-2" />
          <div className="text-xl font-bold text-white">{client.accountNo}</div>
          <div className="text-[11px] text-slate-500 uppercase">Client No.</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link to={`/savings?action=create&clientId=${client.id}`}><PiggyBank className="w-3.5 h-3.5 mr-1" /> Open Savings</Link>
        </Button>
        <Button size="sm" onClick={onApplyLoan} className="bg-blue-600 hover:bg-blue-700">
          <CreditCard className="w-3.5 h-3.5 mr-1" /> Apply for Loan
        </Button>
        <Button size="sm" variant="outline" onClick={onEdit} className="border-slate-600 text-slate-300">
          <Edit className="w-3.5 h-3.5 mr-1" /> Edit
        </Button>
        {client.status?.value === 'Pending' && (
          <Button size="sm" onClick={onActivate} className="bg-emerald-600 hover:bg-emerald-700">
            <UserCheck className="w-3.5 h-3.5 mr-1" /> Activate
          </Button>
        )}
        {client.status?.value === 'Active' && (
          <Button size="sm" variant="outline" onClick={onClose} className="border-slate-600 text-slate-300">
            <UserX className="w-3.5 h-3.5 mr-1" /> Close
          </Button>
        )}
      </div>

      {/* Personal Information */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Personal Information</h2>
        <dl className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="First Name" value={client.firstname} />
          <Field label="Last Name" value={client.lastname} />
          <Field label="Full Name" value={client.displayName} />
          <Field label="Office" value={client.officeName} />
          <Field label="Staff" value={client.staffName} />
          <Field label="Mobile" value={client.mobileNo} />
          <Field label="Email" value={client.emailAddress} />
          <Field label="External ID / BVN" value={client.externalId} />
          <Field label="Gender" value={client.gender?.name} />
          <Field label="Date of Birth" value={client.dateOfBirth?.join('-')} />
          <Field label="Activation Date" value={client.timeline?.activatedOnDate?.join('-')} />
          <Field label="Account No" value={client.accountNo} />
        </dl>
      </div>
    </div>
  );
}