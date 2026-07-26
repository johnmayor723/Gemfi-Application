import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fineractApi } from '@/lib/fineract';
import { Plus, Loader2, Search, Users, UserCheck, UserX, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import PageHeader from '@/components/fineract/PageHeader';
import DataTable from '@/components/fineract/DataTable';
import StatusBadge from '@/components/fineract/StatusBadge';
import { useToast } from '@/components/ui/use-toast';

export default function Groups() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [offices, setOffices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({ name: '', officeId: '', staffId: '', externalId: '', activateNow: true, activationDate: new Date().toISOString().split('T')[0] });

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : null;

  const loadGroups = async () => {
    setLoading(true);
    try {
      const params = { limit: 100, orderBy: 'id', sortOrder: 'DESC' };
      if (search) params.sqlSearch = `g.name like '%${search}%'`;
      const res = await fineractApi('/groups', { params });
      setGroups(res.pageItems || []);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
    fineractApi('/offices').then(setOffices).catch(() => {});
    fineractApi('/staff').then(r => setStaff(r.pageItems || r || [])).catch(() => {});
  }, []);

  const handleCreate = async () => {
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        officeId: parseInt(form.officeId),
        active: form.activateNow,
        locale: 'en',
        dateFormat: 'dd MMMM yyyy',
      };
      if (form.staffId) body.staffId = parseInt(form.staffId);
      if (form.externalId.trim()) body.externalId = form.externalId.trim();
      if (form.activateNow) body.activationDate = fmtDate(form.activationDate);

      const res = await fineractApi('/groups', { method: 'POST', body });
      toast({ title: 'Group created successfully' });
      setShowCreate(false);
      setForm({ name: '', officeId: '', staffId: '', externalId: '', activateNow: true, activationDate: new Date().toISOString().split('T')[0] });
      const groupId = res.groupId || res.resourceId;
      if (groupId) navigate(`/groups/${groupId}`);
      else loadGroups();
    } catch (err) {
      toast({ title: 'Validation Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (groupId) => {
    if (!confirm('Are you sure you want to delete this group?')) return;
    try {
      await fineractApi(`/groups/${groupId}`, { method: 'DELETE' });
      toast({ title: 'Group deleted' });
      loadGroups();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const totalGroups = groups.length;
  const activeGroups = groups.filter(g => g.status?.value?.toLowerCase() === 'active').length;
  const inactiveGroups = totalGroups - activeGroups;
  const totalMembers = groups.reduce((sum, g) => sum + (g.clientMembers?.length || 0), 0);

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Group Name', render: (v, row) => <button onClick={() => navigate(`/groups/${row.id}`)} className="text-emerald-400 hover:underline">{v}</button> },
    { key: 'officeName', label: 'Office' },
    { key: 'staffName', label: 'Staff', render: v => v || '—' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    { key: 'clientMembers', label: 'Members', render: (v) => v?.length || 0 },
    { key: 'active', label: 'Actions', render: (_, row) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => navigate(`/groups/${row.id}`)} className="text-slate-300 hover:text-white h-7 px-2 text-xs">View</Button>
        {row.status?.value?.toLowerCase() !== 'active' && (
          <Button size="sm" variant="ghost" onClick={() => navigate(`/groups/${row.id}`)} className="text-emerald-400 hover:text-emerald-300 h-7 px-2 text-xs">Activate</Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => handleDelete(row.id)} className="text-rose-400 hover:text-rose-300 h-7 px-2 text-xs">Delete</Button>
      </div>
    )},
  ];

  const cards = [
    { label: 'Total Groups', value: totalGroups, icon: UsersRound, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Active Groups', value: activeGroups, icon: UserCheck, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Inactive Groups', value: inactiveGroups, icon: UserX, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Total Members', value: totalMembers, icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Groups" description="Manage customer groups — cooperatives, associations, savings clubs, and lending groups"
        action={<Button onClick={() => setShowCreate(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" /> Create Group</Button>} />

      {/* Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">{c.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{c.label}</div>
                </div>
                <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${c.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadGroups()}
              placeholder="Search by group name…" className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-600" />
          </div>
          <Button onClick={loadGroups} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">Search</Button>
        </div>
        <DataTable columns={columns} data={groups} loading={loading} emptyMessage="No groups found" onRowClick={(row) => navigate(`/groups/${row.id}`)} />
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader><DialogTitle>Create Group</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300 text-xs">Group Name *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Office *</Label>
              <select value={form.officeId} onChange={e => setForm(p => ({ ...p, officeId: e.target.value }))}
                className="mt-1 w-full h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm">
                <option value="">Select office</option>
                {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Staff (optional)</Label>
              <select value={form.staffId} onChange={e => setForm(p => ({ ...p, staffId: e.target.value }))}
                className="mt-1 w-full h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm">
                <option value="">Select staff</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.displayName}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs">External ID (optional)</Label>
              <Input value={form.externalId} onChange={e => setForm(p => ({ ...p, externalId: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.activateNow} onChange={e => setForm(p => ({ ...p, activateNow: e.target.checked }))} className="w-4 h-4 rounded accent-emerald-600" />
                <span className="text-sm text-slate-300">Activate immediately</span>
              </label>
            </div>
            {form.activateNow && (
              <div>
                <Label className="text-slate-300 text-xs">Activation Date *</Label>
                <Input type="date" value={form.activationDate} onChange={e => setForm(p => ({ ...p, activationDate: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-slate-400">Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.name || !form.officeId} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}