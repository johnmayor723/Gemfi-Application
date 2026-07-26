import React, { useState, useEffect } from 'react';
import { fineractApi } from '@/lib/fineract';
import { Plus, Loader2, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import PageHeader from '@/components/fineract/PageHeader';
import DataTable from '@/components/fineract/DataTable';
import { useToast } from '@/components/ui/use-toast';

const accountTypes = [
  { id: 1, label: 'Asset' },
  { id: 2, label: 'Liability' },
  { id: 3, label: 'Equity' },
  { id: 4, label: 'Income' },
  { id: 5, label: 'Expense' },
];

// Confirmed against a live Fineract instance's /glaccounts response:
// usage.id 1 = "DETAIL" (postable), usage.id 2 = "HEADER" (chart-of-accounts
// grouping only) — this was previously swapped, which meant picking
// "Detail" in this form actually created a HEADER account in Fineract.
const usageOptions = [
  { id: 1, label: 'Detail' },
  { id: 2, label: 'Header' },
];

export default function GLAccounts() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', glCode: '', type: '1', usage: '2', manualEntriesAllowed: true, description: '' });

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const res = await fineractApi('/glaccounts');
      setAccounts(Array.isArray(res) ? res : []);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAccounts(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        name: form.name,
        glCode: form.glCode,
        type: parseInt(form.type),
        usage: parseInt(form.usage),
        manualEntriesAllowed: form.manualEntriesAllowed,
        description: form.description,
      };
      if (editing) {
        await fineractApi(`/glaccounts/${editing.id}`, { method: 'PUT', body });
        toast({ title: 'Account updated' });
      } else {
        await fineractApi('/glaccounts', { method: 'POST', body });
        toast({ title: 'Account created' });
      }
      setShowForm(false);
      setEditing(null);
      loadAccounts();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this GL account?')) return;
    try {
      await fineractApi(`/glaccounts/${id}`, { method: 'DELETE' });
      toast({ title: 'Account deleted' });
      loadAccounts();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const openEdit = (acc) => {
    setEditing(acc);
    setForm({
      name: acc.name,
      glCode: acc.glCode,
      type: String(acc.type?.id || 1),
      usage: String(acc.usage?.id || 2),
      manualEntriesAllowed: acc.manualEntriesAllowed ?? true,
      description: acc.description || '',
    });
    setShowForm(true);
  };

  const columns = [
    { key: 'glCode', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type', render: (v) => v?.value || '—' },
    { key: 'usage', label: 'Usage', render: (v) => v?.value || '—' },
    { key: 'manualEntriesAllowed', label: 'Manual', render: (v) => v ? 'Yes' : 'No' },
    {
      key: 'id', label: '', render: (_, row) => (
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white">
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-rose-400">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Chart of Accounts" description="General Ledger accounts"
        action={<Button onClick={() => { setEditing(null); setForm({ name: '', glCode: '', type: '1', usage: '2', manualEntriesAllowed: true, description: '' }); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" /> New Account</Button>} />

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <DataTable columns={columns} data={accounts} loading={loading} emptyMessage="No GL accounts" />
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Create'} GL Account</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300 text-xs">Account Name *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">GL Code *</Label>
              <Input value={form.glCode} onChange={e => setForm(p => ({ ...p, glCode: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300 text-xs">Type *</Label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="mt-1 w-full h-10 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm">
                  {accountTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-slate-300 text-xs">Usage *</Label>
                <select value={form.usage} onChange={e => setForm(p => ({ ...p, usage: e.target.value }))} className="mt-1 w-full h-10 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm">
                  {usageOptions.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Description</Label>
              <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={form.manualEntriesAllowed} onChange={e => setForm(p => ({ ...p, manualEntriesAllowed: e.target.checked }))} className="rounded" />
              Allow manual entries
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowForm(false)} className="text-slate-400">Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.glCode} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} {editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}