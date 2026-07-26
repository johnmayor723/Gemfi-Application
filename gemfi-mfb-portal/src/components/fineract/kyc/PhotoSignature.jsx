import React, { useState } from 'react';
import { Camera, PenTool, Eye, Trash2, Loader2 } from 'lucide-react';
import { kycApi, kycUpload } from '@/lib/kycApi';
import { useToast } from '@/components/ui/use-toast';
import KycCard from './KycCard';
import UploadZone from './UploadZone';

export default function PhotoSignature({ clientId, photo, signature, onChanged }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(photo?.url || null);
  const [sigUrl, setSigUrl] = useState(signature?.url || null);

  const handleUploadPhoto = async (file, onProgress) => {
    setBusy('photo');
    try {
      const res = await kycUpload(`/customers/${clientId}/photo`, file, 'photo', {}, onProgress);
      setPhotoUrl(res?.url);
      toast({ title: 'Photo uploaded' });
      onChanged?.();
    } catch (err) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
      throw err;
    } finally { setBusy(null); }
  };

  const handleUploadSig = async (file, onProgress) => {
    setBusy('sig');
    try {
      const res = await kycUpload(`/customers/${clientId}/signature`, file, 'signature', {}, onProgress);
      setSigUrl(res?.url);
      toast({ title: 'Signature uploaded' });
      onChanged?.();
    } catch (err) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
      throw err;
    } finally { setBusy(null); }
  };

  const deletePhoto = async () => {
    setBusy('photo');
    try {
      await kycApi(`/customers/${clientId}/photo`, { method: 'DELETE' });
      setPhotoUrl(null);
      toast({ title: 'Photo deleted' });
      onChanged?.();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setBusy(null); }
  };

  const deleteSig = async () => {
    setBusy('sig');
    try {
      await kycApi(`/customers/${clientId}/signature`, { method: 'DELETE' });
      setSigUrl(null);
      toast({ title: 'Signature deleted' });
      onChanged?.();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setBusy(null); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <KycCard title="Passport Photograph" icon={Camera}>
        <div className="flex flex-col items-center gap-3">
          {photoUrl ? (
            <img src={photoUrl} alt="Passport" className="w-32 h-40 object-cover rounded-lg border border-slate-700" />
          ) : (
            <div className="w-32 h-40 rounded-lg border-2 border-dashed border-slate-700 flex items-center justify-center">
              {busy === 'photo' ? <Loader2 className="w-6 h-6 animate-spin text-slate-500" /> : <Camera className="w-8 h-8 text-slate-600" />}
            </div>
          )}
          <div className="flex gap-2">
            <UploadZone label={photoUrl ? 'Replace' : 'Upload'} accept="images" compact onUpload={handleUploadPhoto} />
            {photoUrl && <button onClick={() => window.open(photoUrl, '_blank')} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-white"><Eye className="w-3.5 h-3.5" /> Preview</button>}
            {photoUrl && <button onClick={deletePhoto} disabled={busy === 'photo'} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-rose-600/20 text-rose-400 hover:bg-rose-600/30"><Trash2 className="w-3.5 h-3.5" /></button>}
          </div>
        </div>
      </KycCard>

      <KycCard title="Signature" icon={PenTool}>
        <div className="flex flex-col items-center gap-3">
          {sigUrl ? (
            <img src={sigUrl} alt="Signature" className="w-48 h-24 object-contain rounded-lg border border-slate-700 bg-white/5" />
          ) : (
            <div className="w-48 h-24 rounded-lg border-2 border-dashed border-slate-700 flex items-center justify-center">
              {busy === 'sig' ? <Loader2 className="w-6 h-6 animate-spin text-slate-500" /> : <PenTool className="w-8 h-8 text-slate-600" />}
            </div>
          )}
          <div className="flex gap-2">
            <UploadZone label={sigUrl ? 'Replace Signature' : 'Upload Signature'} accept="images" compact onUpload={handleUploadSig} />
            {sigUrl && <button onClick={() => window.open(sigUrl, '_blank')} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-white"><Eye className="w-3.5 h-3.5" /> Preview</button>}
            {sigUrl && <button onClick={deleteSig} disabled={busy === 'sig'} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-rose-600/20 text-rose-400 hover:bg-rose-600/30"><Trash2 className="w-3.5 h-3.5" /></button>}
          </div>
        </div>
      </KycCard>
    </div>
  );
}