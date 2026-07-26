import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fineractApi } from '@/lib/fineract';
import { Plus, Loader2, Shield, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import PageHeader from '@/components/fineract/PageHeader';
import DataTable from '@/components/fineract/DataTable';
import { useToast } from '@/components/ui/use-toast';

export default function Roles() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const loadRoles = async () => {
    setLoading(true);
    try {
      const res = await fineractApi('/roles');
      setRoles(Array.isArray(res) ? res : []);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRoles(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await fineractApi('/roles', { method: 'POST', body: { name: form.name, description: form.description } });
      toast({ title: 'Role created successfully' });
      setShowCreate(false);
      setForm({ name: '', description: '' });
      loadRoles();
    } catch (err) {
      toast({ title: 'Validation Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Role Name', render: (v, row) => <button onClick={() => navigate(`/system/roles/${row.id}`)} className="text-emerald-400 hover:underline">{v}</button> },
    { key: 'description', label: 'Description', render: v => v || '—' },
    { key: 'numUsers', label: 'Users Assigned', render: (v, row) => row.numUsers ?? '—' },
    { key: 'disabled', label: 'Status', render: (v) => v ? <span className="text-rose-400 text-xs">Disabled</span> : <span className="text-emerald-400 text-xs">Active</span> },
    { key: 'actions', label: 'Actions', render: (_, row) => (
      <Button size="sm" variant="ghost" onClick={() => navigate(`/system/roles/${row.id}`)} className="text-slate-300 hover:text-white h-7 px-2 text-xs">
        <Shield className="w-3 h-3 mr-1" /> Manage Permissions
      </Button>
    )},
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Roles & Permissions" description="Manage roles, assign permissions, and control system access"
        action={<Button onClick={() => setShowCreate(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" /> Create Role</Button>} />

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <DataTable columns={columns} data={roles} loading={loading} emptyMessage="No roles" onRowClick={(row) => navigate(`/system/roles/${row.id}`)} />
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm">
          <DialogHeader><DialogTitle>Create Role</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300 text-xs">Role Name *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Description</Label>
              <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
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