import React, { useState } from 'react';
import { PenTool, CreditCard, AlertTriangle, UserX, Ban, Loader2, FileSearch, ExternalLink } from 'lucide-react';
import { kycApi } from '@/lib/kycApi';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import KycCard from './KycCard';
import KycStatusBadge from './KycStatusBadge';

function ComplianceItem({ icon: Icon, title, status, onAction, actionLabel, running, children }) {
  return (
    <KycCard title={title} icon={Icon} status={status} actions={
      <Button size="sm" variant="outline" onClick={onAction} disabled={running} className="border-slate-600 text-slate-300 h-7 text-xs">
        {running ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null} {actionLabel}
      </Button>
    }>
      {children}
    </KycCard>
  );
}

function Field({ label, value }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-slate-700/30 last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-sm text-white text-right max-w-[60%]">{value || '—'}</span>
    </div>
  );
}

export default function ComplianceSection({ clientId, compliance }) {
  const { toast } = useToast();
  const [running, setRunning] = useState(null);

  const runAction = async (key, path) => {
    setRunning(key);
    try {
      await kycApi(path, { method: 'POST' });
      toast({ title: `${key} completed` });
    } catch (err) {
      toast({ title: `${key} failed`, description: err.message, variant: 'destructive' });
    } finally { setRunning(null); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ComplianceItem icon={PenTool} title="Signature Verification" status={compliance?.signatureVerification?.status} actionLabel="Verify" running={running === 'signature'} onAction={() => runAction('signature', `/customers/${clientId}/signature/verify`)}>
          <Field label="Status" value={<KycStatusBadge status={compliance?.signatureVerification?.status || 'pending'} />} />
          <Field label="Verification Date" value={compliance?.signatureVerification?.date} />
          <Field label="Officer" value={compliance?.signatureVerification?.officer} />
          <Field label="Comments" value={compliance?.signatureVerification?.comments} />
        </ComplianceItem>

        <ComplianceItem icon={CreditCard} title="Credit Check" status={compliance?.creditCheck?.status} actionLabel="Run Credit Check" running={running === 'credit'} onAction={() => runAction('credit', `/customers/${clientId}/credit-check`)}>
          <Field label="Status" value={<KycStatusBadge status={compliance?.creditCheck?.status || 'pending'} />} />
          <Field label="Credit Bureau" value={compliance?.creditCheck?.bureau} />
          <Field label="Reference Number" value={compliance?.creditCheck?.referenceNumber} />
          <Field label="Risk Score" value={compliance?.creditCheck?.riskScore} />
          {compliance?.creditCheck?.reportUrl && (
            <a href={compliance?.creditCheck.reportUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline mt-2">
              <ExternalLink className="w-3 h-3" /> View Report
            </a>
          )}
        </ComplianceItem>

        <ComplianceItem icon={AlertTriangle} title="AML Screening" status={compliance?.aml?.status} actionLabel="Run Screening" running={running === 'aml'} onAction={() => runAction('aml', `/customers/${clientId}/aml-check`)}>
          <Field label="Status" value={<KycStatusBadge status={compliance?.aml?.status || 'pending'} />} />
          <Field label="Last Checked" value={compliance?.aml?.lastChecked} />
          <Field label="Risk Rating" value={compliance?.aml?.riskRating} />
        </ComplianceItem>

        <ComplianceItem icon={UserX} title="PEP Screening" status={compliance?.pep?.status} actionLabel="Run Screening" running={running === 'pep'} onAction={() => runAction('pep', `/customers/${clientId}/pep-check`)}>
          <Field label="Status" value={<KycStatusBadge status={compliance?.pep?.status || 'pending'} />} />
          <Field label="Last Checked" value={compliance?.pep?.lastChecked} />
        </ComplianceItem>

        <ComplianceItem icon={Ban} title="Sanctions Screening" status={compliance?.sanctions?.status} actionLabel="Run Screening" running={running === 'sanctions'} onAction={() => runAction('sanctions', `/customers/${clientId}/sanctions-check`)}>
          <Field label="Status" value={<KycStatusBadge status={compliance?.sanctions?.status || 'pending'} />} />
          <Field label="Last Checked" value={compliance?.sanctions?.lastChecked} />
        </ComplianceItem>
      </div>
    </div>
  );
}