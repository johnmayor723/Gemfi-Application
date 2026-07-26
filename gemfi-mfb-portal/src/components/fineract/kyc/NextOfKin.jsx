import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Loader2, Edit } from 'lucide-react';
import { kycApi } from '@/lib/kycApi';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import KycCard from './KycCard';

const EMPTY = { name: '', relationship: '', phone: '', email: '', address: '' };

export default function NextOfKin({ clientId, nextOfKin: initial }) {
  const { toast } = useToast();
  const [list, setList] = useState(initial || []);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { setList(initial || []); }, [initial]);

  const inputCls = 'mt-1 bg-slate-800 border-slate-700 text-white';

  const save = async () => {
    if (!form.name.trim()) { toast({ title: 'Name is required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      if (editingId) {
        await kycApi(`/next-of-kin/${editingId}`, { method: 'PUT', body: form });
        setList(prev => prev.map(n => n.id === editingId ? { ...n, ...form } : n));
        toast({ title: 'Next of kin updated' });
      } else {
        const res = await kycApi(`/customers/${clientId}/next-of-kin`, { method: 'POST', body: form });
        setList(prev => [...prev, { id: res?.id || Date.now(), ...form }]);
        toast({ title: 'Next of kin added' });
      }
      setForm(EMPTY); setEditingId(null);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const edit = (item) => { setForm({ name: item.name, relationship: item.relationship, phone: item.phone, email: item.email, address: item.address }); setEditingId(item.id); };

  const remove = async (id) => {
    setDeleting(id);
    try {
      await kycApi(`/next-of-kin/${id}`, { method: 'DELETE' });
      setList(prev => prev.filter(n => n.id !== id));
      toast({ title: 'Removed' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setDeleting(null); }
  };

  return (
    <KycCard title="Next of Kin" icon={Users}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div><Label className="text-slate-300 text-xs">Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} /></div>
        <div><Label className="text-slate-300 text-xs">Relationship</Label><Input value={form.relationship} onChange={e => setForm(p => ({ ...p, relationship: e.target.value }))} className={inputCls} /></div>
        <div><Label className="text-slate-300 text-xs">Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={inputCls} /></div>
        <div><Label className="text-slate-300 text-xs">Email</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputCls} /></div>
        <div className="md:col-span-2"><Label className="text-slate-300 text-xs">Address</Label><Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className={inputCls} /></div>
      </div>
      <div className="flex gap-2 mb-4">
        <Button size="sm" onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
          {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-1" />} {editingId ? 'Update' : 'Add'}
        </Button>
        {editingId && <Button size="sm" variant="ghost" onClick={() => { setForm(EMPTY); setEditingId(null); }} className="text-slate-400">Cancel</Button>}
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-3">No next of kin added</p>
      ) : (
        <div className="space-y-2">
          {list.map(item => (
            <div key={item.id} className="flex items-start justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
              <div>
                <p className="text-sm text-white">{item.name} <span className="text-xs text-slate-500">· {item.relationship}</span></p>
                <p className="text-xs text-slate-400">{item.phone} {item.email ? `· ${item.email}` : ''}</p>
                {item.address && <p className="text-xs text-slate-500 mt-0.5">{item.address}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => edit(item)} className="p-1.5 text-slate-400 hover:text-white"><Edit className="w-3.5 h-3.5" /></button>
                <button onClick={() => remove(item.id)} disabled={deleting === item.id} className="p-1.5 text-rose-400 hover:text-rose-300">
                  {deleting === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </KycCard>
  );
}