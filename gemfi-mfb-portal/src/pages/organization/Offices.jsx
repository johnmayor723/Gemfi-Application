import React, { useState, useEffect } from 'react';
import { fineractApi } from '@/lib/fineract';
import { Plus, Loader2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import PageHeader from '@/components/fineract/PageHeader';
import DataTable from '@/components/fineract/DataTable';
import { useToast } from '@/components/ui/use-toast';

export default function Offices() {
  const { toast } = useToast();
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', parentId: '', openingDate: '', externalId: '' });

  const loadOffices = async () => {
    setLoading(true);
    try {
      const res = await fineractApi('/offices');
      setOffices(Array.isArray(res) ? res : []);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOffices(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = { name: form.name, locale: 'en', dateFormat: 'dd MMMM yyyy' };
      if (form.parentId) body.parentId = parseInt(form.parentId);
      if (form.externalId) body.externalId = form.externalId;
      
      if (editing) {
        await fineractApi(`/offices/${editing.id}`, { method: 'PUT', body });
        toast({ title: 'Office updated' });
      } else {
        const d = form.openingDate ? new Date(form.openingDate) : new Date();
        body.openingDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
        await fineractApi('/offices', { method: 'POST', body });
        toast({ title: 'Office created' });
      }
      setShowForm(false);
      setEditing(null);
      loadOffices();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (office) => {
    setEditing(office);
    setForm({ name: office.name, parentId: String(office.parentId || ''), openingDate: '', externalId: office.externalId || '' });
    setShowForm(true);
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'parentName', label: 'Parent' },
    { key: 'openingDate', label: 'Opening Date', render: (v) => v ? v.join('-') : '—' },
    { key: 'externalId', label: 'External ID' },
    {
      key: '_edit', label: '', render: (_, row) => (
        <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white">
          <Edit className="w-3.5 h-3.5" />
        </button>
      )
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Offices" description="Organizational hierarchy"
        action={<Button onClick={() => { setEditing(null); setForm({ name: '', parentId: '', openingDate: '', externalId: '' }); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" /> New Office</Button>} />

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <DataTable columns={columns} data={offices} loading={loading} emptyMessage="No offices" />
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Create'} Office</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300 text-xs">Office Name *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Parent Office</Label>
              <select value={form.parentId} onChange={e => setForm(p => ({ ...p, parentId: e.target.value }))} className="mt-1 w-full h-10 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm">
                <option value="">None (root)</option>
                {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            {!editing && (
              <div>
                <Label className="text-slate-300 text-xs">Opening Date</Label>
                <Input type="date" value={form.openingDate} onChange={e => setForm(p => ({ ...p, openingDate: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
              </div>
            )}
            <div>
              <Label className="text-slate-300 text-xs">External ID</Label>
              <Input value={form.externalId} onChange={e => setForm(p => ({ ...p, externalId: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowForm(false)} className="text-slate-400">Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} {editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}