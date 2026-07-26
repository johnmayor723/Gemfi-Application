import React, { useState, useEffect } from 'react';
import { fineractApi } from '@/lib/fineract';
import { Plus, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import PageHeader from '@/components/fineract/PageHeader';
import DataTable from '@/components/fineract/DataTable';
import { useToast } from '@/components/ui/use-toast';

export default function GLClosures() {
  const { toast } = useToast();
  const [closures, setClosures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [offices, setOffices] = useState([]);
  const [form, setForm] = useState({ officeId: '', closingDate: '', comments: '' });

  const loadClosures = async () => {
    setLoading(true);
    try {
      const res = await fineractApi('/glclosures');
      setClosures(Array.isArray(res) ? res : []);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClosures();
    fineractApi('/offices').then(setOffices).catch(() => {});
  }, []);

  const handleCreate = async () => {
    setSaving(true);
    try {
      const d = new Date(form.closingDate);
      await fineractApi('/glclosures', {
        method: 'POST',
        body: {
          officeId: parseInt(form.officeId),
          closingDate: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
          comments: form.comments,
          locale: 'en',
          dateFormat: 'dd MMMM yyyy',
        }
      });
      toast({ title: 'GL Closure created' });
      setShowCreate(false);
      loadClosures();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this closure?')) return;
    try {
      await fineractApi(`/glclosures/${id}`, { method: 'DELETE' });
      toast({ title: 'Closure deleted' });
      loadClosures();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'officeName', label: 'Office' },
    { key: 'closingDate', label: 'Closing Date', render: (v) => v ? v.join('-') : '—' },
    { key: 'comments', label: 'Comments' },
    {
      key: '_actions', label: '', render: (_, row) => (
        <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-rose-400">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="GL Closures" description="Accounting closures"
        action={<Button onClick={() => setShowCreate(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" /> New Closure</Button>} />

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <DataTable columns={columns} data={closures} loading={loading} emptyMessage="No closures" />
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader><DialogTitle>Create GL Closure</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300 text-xs">Office *</Label>
              <select value={form.officeId} onChange={e => setForm(p => ({ ...p, officeId: e.target.value }))} className="mt-1 w-full h-10 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm">
                <option value="">Select office</option>
                {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Closing Date *</Label>
              <Input type="date" value={form.closingDate} onChange={e => setForm(p => ({ ...p, closingDate: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Comments</Label>
              <Input value={form.comments} onChange={e => setForm(p => ({ ...p, comments: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-slate-400">Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.officeId || !form.closingDate} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}