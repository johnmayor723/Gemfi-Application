import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Loader2, Edit, Upload, Eye } from 'lucide-react';
import { kycApi, kycUpload } from '@/lib/kycApi';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import KycCard from './KycCard';
import KycStatusBadge from './KycStatusBadge';

const EMPTY = { name: '', phoneNumber: '', email: '', address: '', occupation: '', bank: '', accountNumber: '' };

export default function AccountReferences({ clientId, references: initial }) {
  const { toast } = useToast();
  const [list, setList] = useState(initial || []);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [uploadingFor, setUploadingFor] = useState(null);

  useEffect(() => { setList(initial || []); }, [initial]);

  const inputCls = 'mt-1 bg-slate-800 border-slate-700 text-white';

  const save = async () => {
    if (!form.name.trim()) { toast({ title: 'Name is required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      if (editingId) {
        await kycApi(`/references/${editingId}`, { method: 'PUT', body: form });
        setList(prev => prev.map(r => r.id === editingId ? { ...r, ...form } : r));
        toast({ title: 'Reference updated' });
      } else {
        const res = await kycApi(`/customers/${clientId}/references`, { method: 'POST', body: form });
        setList(prev => [...prev, { id: res?.id || Date.now(), ...form }]);
        toast({ title: 'Reference added' });
      }
      setForm(EMPTY); setEditingId(null);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const edit = (item) => { setForm({ name: item.name, phoneNumber: item.phoneNumber, email: item.email, address: item.address, occupation: item.occupation, bank: item.bank, accountNumber: item.accountNumber }); setEditingId(item.id); };

  const remove = async (id) => {
    setDeleting(id);
    try {
      await kycApi(`/references/${id}`, { method: 'DELETE' });
      setList(prev => prev.filter(r => r.id !== id));
      toast({ title: 'Reference removed' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setDeleting(null); }
  };

  const uploadLetter = async (refId, file) => {
    setUploadingFor(refId);
    try {
      const res = await kycUpload(`/references/${refId}/letter`, file, 'file', {}, () => {});
      setList(prev => prev.map(r => r.id === refId ? { ...r, letterUrl: res?.url } : r));
      toast({ title: 'Reference letter uploaded' });
    } catch (err) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally { setUploadingFor(null); }
  };

  return (
    <KycCard title="Current Account References" icon={UserPlus}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div><Label className="text-slate-300 text-xs">Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} /></div>
        <div><Label className="text-slate-300 text-xs">Phone Number</Label><Input value={form.phoneNumber} onChange={e => setForm(p => ({ ...p, phoneNumber: e.target.value }))} className={inputCls} /></div>
        <div><Label className="text-slate-300 text-xs">Email</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputCls} /></div>
        <div><Label className="text-slate-300 text-xs">Occupation</Label><Input value={form.occupation} onChange={e => setForm(p => ({ ...p, occupation: e.target.value }))} className={inputCls} /></div>
        <div><Label className="text-slate-300 text-xs">Bank</Label><Input value={form.bank} onChange={e => setForm(p => ({ ...p, bank: e.target.value }))} className={inputCls} /></div>
        <div><Label className="text-slate-300 text-xs">Account Number</Label><Input value={form.accountNumber} onChange={e => setForm(p => ({ ...p, accountNumber: e.target.value }))} className={inputCls} /></div>
        <div className="md:col-span-2"><Label className="text-slate-300 text-xs">Address</Label><Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className={inputCls} /></div>
      </div>
      <div className="flex gap-2 mb-4">
        <Button size="sm" onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
          {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <UserPlus className="w-3.5 h-3.5 mr-1" />} {editingId ? 'Update' : 'Add Reference'}
        </Button>
        {editingId && <Button size="sm" variant="ghost" onClick={() => { setForm(EMPTY); setEditingId(null); }} className="text-slate-400">Cancel</Button>}
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-3">No references added</p>
      ) : (
        <div className="space-y-2">
          {list.map(ref => (
            <div key={ref.id} className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-white">{ref.name} <span className="text-xs text-slate-500">· {ref.occupation}</span></p>
                  <p className="text-xs text-slate-400">{ref.phoneNumber} {ref.email ? `· ${ref.email}` : ''}</p>
                  <p className="text-xs text-slate-500">{ref.bank} {ref.accountNumber ? `· ${ref.accountNumber}` : ''}</p>
                  {ref.address && <p className="text-xs text-slate-500 mt-0.5">{ref.address}</p>}
                </div>
                <div className="flex gap-1 items-center">
                  <KycStatusBadge status={ref.status || 'pending'} />
                  <label className="p-1.5 text-slate-400 hover:text-white cursor-pointer">
                    {uploadingFor === ref.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={e => { const f = e.target.files?.[0]; if (f) uploadLetter(ref.id, f); e.target.value = ''; }} />
                  </label>
                  {ref.letterUrl && <button onClick={() => window.open(ref.letterUrl, '_blank')} className="p-1.5 text-slate-400 hover:text-white"><Eye className="w-3.5 h-3.5" /></button>}
                  <button onClick={() => edit(ref)} className="p-1.5 text-slate-400 hover:text-white"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => remove(ref.id)} disabled={deleting === ref.id} className="p-1.5 text-rose-400 hover:text-rose-300">
                    {deleting === ref.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </KycCard>
  );
}