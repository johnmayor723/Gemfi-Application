import React, { useState, useEffect } from 'react';
import { fineractApi } from '@/lib/fineract';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import PageHeader from '@/components/fineract/PageHeader';
import DataTable from '@/components/fineract/DataTable';
import { useToast } from '@/components/ui/use-toast';

export default function Funds() {
  const { toast } = useToast();
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', externalId: '' });

  const loadFunds = async () => {
    setLoading(true);
    try {
      const res = await fineractApi('/funds');
      setFunds(Array.isArray(res) ? res : []);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFunds(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await fineractApi('/funds', {
        method: 'POST',
        body: { name: form.name, ...(form.externalId && { externalId: form.externalId }) }
      });
      toast({ title: 'Fund created' });
      setShowCreate(false);
      setForm({ name: '', externalId: '' });
      loadFunds();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'externalId', label: 'External ID' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Fund Management" description="Manage funds"
        action={<Button onClick={() => setShowCreate(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" /> New Fund</Button>} />

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <DataTable columns={columns} data={funds} loading={loading} emptyMessage="No funds" />
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm">
          <DialogHeader><DialogTitle>Create Fund</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300 text-xs">Fund Name *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">External ID</Label>
              <Input value={form.externalId} onChange={e => setForm(p => ({ ...p, externalId: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-slate-400">Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.name} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}