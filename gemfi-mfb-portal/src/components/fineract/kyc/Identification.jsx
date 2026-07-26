import React, { useState } from 'react';
import { IdCard, Fingerprint, Loader2, CheckCircle } from 'lucide-react';
import { kycApi } from '@/lib/kycApi';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import KycCard from './KycCard';
import KycStatusBadge from './KycStatusBadge';

const ID_TYPES = ['National ID', 'Driver\'s Licence', 'International Passport', 'Voter Card'];

export default function Identification({ clientId, bvn, nin, identification, onChanged }) {
  const { toast } = useToast();
  const [bvnInput, setBvnInput] = useState('');
  const [ninInput, setNinInput] = useState('');
  const [verifying, setVerifying] = useState(null);
  const [idForm, setIdForm] = useState({
    type: identification?.type || ID_TYPES[0],
    number: identification?.number || '',
    expiryDate: identification?.expiryDate || '',
    countryOfIssue: identification?.countryOfIssue || 'Nigeria',
  });
  const [savingId, setSavingId] = useState(false);

  const verifyBvn = async () => {
    if (!bvnInput.trim()) { toast({ title: 'Enter BVN', variant: 'destructive' }); return; }
    setVerifying('bvn');
    try {
      const res = await kycApi(`/customers/${clientId}/bvn/verify`, { method: 'POST', body: { bvn: bvnInput.trim() } });
      toast({ title: res?.verified ? 'BVN Verified' : 'BVN verification result', description: res?.verified ? `${res.firstName} ${res.lastName}` : undefined });
      onChanged?.();
    } catch (err) {
      toast({ title: 'BVN verification failed', description: err.message, variant: 'destructive' });
    } finally { setVerifying(null); }
  };

  const verifyNin = async () => {
    if (!ninInput.trim()) { toast({ title: 'Enter NIN', variant: 'destructive' }); return; }
    setVerifying('nin');
    try {
      const res = await kycApi(`/customers/${clientId}/nin/verify`, { method: 'POST', body: { nin: ninInput.trim() } });
      toast({ title: res?.verified ? 'NIN Verified' : 'NIN verification result' });
      onChanged?.();
    } catch (err) {
      toast({ title: 'NIN verification failed', description: err.message, variant: 'destructive' });
    } finally { setVerifying(null); }
  };

  const saveId = async () => {
    setSavingId(true);
    try {
      await kycApi(`/customers/${clientId}/identification`, { method: 'POST', body: idForm });
      toast({ title: 'Identification saved' });
      onChanged?.();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setSavingId(false); }
  };

  const inputCls = 'mt-1 bg-slate-800 border-slate-700 text-white';
  const selectCls = 'mt-1 w-full h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <KycCard title="BVN Verification" icon={Fingerprint} status={bvn?.status || 'pending'}>
          {bvn?.verified ? (
            <div className="flex items-center gap-2 text-sm text-emerald-400"><CheckCircle className="w-4 h-4" /> Verified: {bvn.firstName} {bvn.lastName}</div>
          ) : (
            <div className="space-y-2">
              <div>
                <Label className="text-slate-300 text-xs">BVN Number</Label>
                <Input value={bvnInput} onChange={e => setBvnInput(e.target.value)} placeholder="22345678901" maxLength={11} className={inputCls} />
              </div>
              <Button size="sm" onClick={verifyBvn} disabled={verifying === 'bvn'} className="bg-emerald-600 hover:bg-emerald-700">
                {verifying === 'bvn' ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Fingerprint className="w-3.5 h-3.5 mr-1" />} Verify BVN
              </Button>
            </div>
          )}
        </KycCard>

        <KycCard title="NIN Verification" icon={IdCard} status={nin?.status || 'pending'}>
          {nin?.verified ? (
            <div className="flex items-center gap-2 text-sm text-emerald-400"><CheckCircle className="w-4 h-4" /> Verified</div>
          ) : (
            <div className="space-y-2">
              <div>
                <Label className="text-slate-300 text-xs">NIN Number</Label>
                <Input value={ninInput} onChange={e => setNinInput(e.target.value)} placeholder="12345678901" maxLength={11} className={inputCls} />
              </div>
              <Button size="sm" onClick={verifyNin} disabled={verifying === 'nin'} className="bg-emerald-600 hover:bg-emerald-700">
                {verifying === 'nin' ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <IdCard className="w-3.5 h-3.5 mr-1" />} Verify NIN
              </Button>
            </div>
          )}
        </KycCard>
      </div>

      <KycCard title="Identity Document" icon={IdCard}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-slate-300 text-xs">ID Type</Label>
            <select value={idForm.type} onChange={e => setIdForm(p => ({ ...p, type: e.target.value }))} className={selectCls}>
              {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-slate-300 text-xs">ID Number</Label>
            <Input value={idForm.number} onChange={e => setIdForm(p => ({ ...p, number: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <Label className="text-slate-300 text-xs">Expiry Date</Label>
            <Input type="date" value={idForm.expiryDate} onChange={e => setIdForm(p => ({ ...p, expiryDate: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <Label className="text-slate-300 text-xs">Country of Issue</Label>
            <Input value={idForm.countryOfIssue} onChange={e => setIdForm(p => ({ ...p, countryOfIssue: e.target.value }))} className={inputCls} />
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <Button size="sm" onClick={saveId} disabled={savingId} className="bg-emerald-600 hover:bg-emerald-700">
            {savingId && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />} Save Identification
          </Button>
        </div>
      </KycCard>
    </div>
  );
}