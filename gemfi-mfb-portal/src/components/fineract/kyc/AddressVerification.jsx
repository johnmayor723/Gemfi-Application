import React, { useState } from 'react';
import { MapPin, Loader2, Upload, Eye, CheckCircle } from 'lucide-react';
import { kycApi, kycUpload } from '@/lib/kycApi';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import KycCard from './KycCard';
import KycStatusBadge from './KycStatusBadge';

export default function AddressVerification({ clientId, address, onChanged }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    address: address?.address || '',
    city: address?.city || '',
    state: address?.state || '',
    country: address?.country || 'Nigeria',
    postalCode: address?.postalCode || '',
  });
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [proofUrl, setProofUrl] = useState(address?.proofUrl || null);

  const inputCls = 'mt-1 bg-slate-800 border-slate-700 text-white';

  const save = async () => {
    setSaving(true);
    try {
      await kycApi(`/customers/${clientId}/address`, { method: 'PUT', body: form });
      toast({ title: 'Address saved' });
      onChanged?.();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const uploadProof = async (file, onProgress) => {
    try {
      const res = await kycUpload(`/customers/${clientId}/address/proof`, file, 'file', {}, onProgress);
      setProofUrl(res?.url);
      toast({ title: 'Proof of address uploaded' });
      onChanged?.();
    } catch (err) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
      throw err;
    }
  };

  const verify = async () => {
    setVerifying(true);
    try {
      await kycApi(`/customers/${clientId}/address/verify`, { method: 'POST' });
      toast({ title: 'Address verification initiated' });
      onChanged?.();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setVerifying(false); }
  };

  return (
    <KycCard title="Address Verification" icon={MapPin} status={address?.status || 'pending'}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="md:col-span-2">
          <Label className="text-slate-300 text-xs">Residential Address</Label>
          <Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className={inputCls} />
        </div>
        <div><Label className="text-slate-300 text-xs">City</Label><Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} className={inputCls} /></div>
        <div><Label className="text-slate-300 text-xs">State</Label><Input value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} className={inputCls} /></div>
        <div><Label className="text-slate-300 text-xs">Country</Label><Input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} className={inputCls} /></div>
        <div><Label className="text-slate-300 text-xs">Postal Code</Label><Input value={form.postalCode} onChange={e => setForm(p => ({ ...p, postalCode: e.target.value }))} className={inputCls} /></div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
          {saving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />} Save Address
        </Button>
        <label className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-white cursor-pointer">
          <Upload className="w-3.5 h-3.5" /> Upload Proof
          <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={e => { const f = e.target.files?.[0]; if (f) uploadProof(f, () => {}); e.target.value = ''; }} />
        </label>
        {proofUrl && <button onClick={() => window.open(proofUrl, '_blank')} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-white"><Eye className="w-3.5 h-3.5" /> View Proof</button>}
        <Button size="sm" variant="outline" onClick={verify} disabled={verifying} className="border-slate-600 text-slate-300">
          {verifying ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />} Verify Address
        </Button>
      </div>
    </KycCard>
  );
}