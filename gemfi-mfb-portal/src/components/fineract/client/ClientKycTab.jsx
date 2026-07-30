import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { kycApi, isKycConfigured } from '@/lib/kycApi';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import KycNotConfigured from '@/components/fineract/kyc/KycNotConfigured';
import IdentityStatus from '@/components/fineract/kyc/IdentityStatus';
import PhotoSignature from '@/components/fineract/kyc/PhotoSignature';
import DocumentsSection from '@/components/fineract/kyc/DocumentsSection';
import Identification from '@/components/fineract/kyc/Identification';
import AddressVerification from '@/components/fineract/kyc/AddressVerification';
import NextOfKin from '@/components/fineract/kyc/NextOfKin';
import AccountReferences from '@/components/fineract/kyc/AccountReferences';
import ComplianceSection from '@/components/fineract/kyc/ComplianceSection';
import KycTimeline from '@/components/fineract/kyc/KycTimeline';

export default function ClientKycTab({ clientId }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kyc, setKyc] = useState(null);
  const [status, setStatus] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [compliance, setCompliance] = useState(null);

  const load = useCallback(async () => {
    if (!isKycConfigured()) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [kycData, statusData, timelineData] = await Promise.allSettled([
        kycApi(`/customers/${clientId}/kyc`),
        kycApi(`/customers/${clientId}/status`),
        kycApi(`/customers/${clientId}/audit`),
      ]);
      // kycApi() returns the raw response envelope ({ success, data, ... }),
      // not the unwrapped payload — every consumer below expects the
      // unwrapped shape (kyc.status, status.completion, a plain array).
      if (kycData.status === 'fulfilled') setKyc(kycData.value?.data ?? null);
      if (statusData.status === 'fulfilled') setStatus(statusData.value?.data ?? null);
      if (timelineData.status === 'fulfilled') setTimeline(timelineData.value?.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  if (!isKycConfigured()) return <KycNotConfigured />;

  if (loading) {
    return <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <ShieldAlert className="w-8 h-8 text-amber-400 mb-2" />
        <p className="text-sm text-slate-400">{error}</p>
        <button onClick={load} className="mt-3 text-xs text-emerald-400 hover:underline">Retry</button>
      </div>
    );
  }

  return (
    <Tabs defaultValue="dashboard">
      <TabsList className="bg-slate-800/50 border border-slate-700/50 flex-wrap h-auto">
        <TabsTrigger value="dashboard">KYC Dashboard</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="identification">Identification</TabsTrigger>
        <TabsTrigger value="address">Address</TabsTrigger>
        <TabsTrigger value="kin">Next of Kin</TabsTrigger>
        <TabsTrigger value="references">References</TabsTrigger>
        <TabsTrigger value="compliance">Compliance</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard" className="mt-4 space-y-4">
        <IdentityStatus kyc={kyc} status={status} />
        <PhotoSignature clientId={clientId} photo={kyc?.photo} signature={kyc?.signature} onChanged={load} />
      </TabsContent>

      <TabsContent value="documents" className="mt-4">
        <DocumentsSection clientId={clientId} documents={kyc?.documents} onChanged={load} />
      </TabsContent>

      <TabsContent value="identification" className="mt-4">
        <Identification clientId={clientId} bvn={kyc?.bvn} nin={kyc?.nin} identification={kyc?.identification} onChanged={load} />
      </TabsContent>

      <TabsContent value="address" className="mt-4">
        <AddressVerification clientId={clientId} address={kyc?.address} onChanged={load} />
      </TabsContent>

      <TabsContent value="kin" className="mt-4">
        <NextOfKin clientId={clientId} nextOfKin={kyc?.nextOfKin} />
      </TabsContent>

      <TabsContent value="references" className="mt-4">
        <AccountReferences clientId={clientId} references={kyc?.references} />
      </TabsContent>

      <TabsContent value="compliance" className="mt-4">
        <ComplianceSection clientId={clientId} compliance={compliance} />
      </TabsContent>

      <TabsContent value="timeline" className="mt-4">
        <KycTimeline timeline={timeline} />
      </TabsContent>
    </Tabs>
  );
}