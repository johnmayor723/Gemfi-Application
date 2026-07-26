import React, { useState, useEffect } from 'react';
import { fineractApi } from '@/lib/fineract';
import { Plus, Loader2, KeyRound, Power, PowerOff, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import PageHeader from '@/components/fineract/PageHeader';
import DataTable from '@/components/fineract/DataTable';
import { useToast } from '@/components/ui/use-toast';

export default function Users() {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showReset, setShowReset] = useState(null);
  const [saving, setSaving] = useState(false);
  const [offices, setOffices] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({ username: '', firstname: '', lastname: '', email: '', officeId: '', roleIds: [], password: '', repeatPassword: '', sendPasswordToEmail: false, passwordNeverExpires: true, isSelfServiceUser: false });
  const [resetForm, setResetForm] = useState({ password: '', repeatPassword: '' });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fineractApi('/users');
      setUsers(Array.isArray(res) ? res : []);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    fineractApi('/offices').then(setOffices).catch(() => {});
    fineractApi('/roles').then(r => setRoles(Array.isArray(r) ? r : [])).catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (form.password !== form.repeatPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const body = {
        username: form.username,
        firstname: form.firstname,
        lastname: form.lastname,
        email: form.email,
        officeId: parseInt(form.officeId),
        roles: form.roleIds.map(id => ({ id: parseInt(id) })),
        sendPasswordToEmail: form.sendPasswordToEmail,
        passwordNeverExpires: form.passwordNeverExpires,
        isSelfServiceUser: form.isSelfServiceUser,
      };
      if (!form.sendPasswordToEmail) {
        body.password = form.password;
        body.repeatPassword = form.repeatPassword;
      }
      await fineractApi('/users', { method: 'POST', body });
      toast({ title: 'User created successfully' });
      setShowCreate(false);
      setForm({ username: '', firstname: '', lastname: '', email: '', officeId: '', roleIds: [], password: '', repeatPassword: '', sendPasswordToEmail: false, passwordNeverExpires: true, isSelfServiceUser: false });
      loadUsers();
    } catch (err) {
      toast({ title: 'Validation Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleUser = async (user) => {
    try {
      await fineractApi(`/users/${user.id}`, { method: 'PUT', body: { enabled: !user.enabled } });
      toast({ title: `User ${!user.enabled ? 'enabled' : 'disabled'}` });
      loadUsers();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleResetPassword = async () => {
    if (resetForm.password !== resetForm.repeatPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await fineractApi(`/users/${showReset.id}`, { method: 'PUT', body: { password: resetForm.password, repeatPassword: resetForm.repeatPassword } });
      toast({ title: 'Password reset successfully' });
      setShowReset(null);
      setResetForm({ password: '', repeatPassword: '' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleRole = (roleId) => {
    setForm(p => ({ ...p, roleIds: p.roleIds.includes(roleId) ? p.roleIds.filter(id => id !== roleId) : [...p.roleIds, roleId] }));
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'username', label: 'Username' },
    { key: 'firstname', label: 'Full Name', render: (v, row) => `${v} ${row.lastname || ''}` },
    { key: 'email', label: 'Email', render: v => v || '—' },
    { key: 'officeName', label: 'Office', render: v => v || '—' },
    { key: 'selectedRoles', label: 'Roles', render: (v) => (v || []).map(r => r.name).join(', ') || '—' },
    { key: 'enabled', label: 'Status', render: (v) => v ? <span className="text-emerald-400 text-xs">Active</span> : <span className="text-rose-400 text-xs">Inactive</span> },
    { key: 'lastTimeLogin', label: 'Last Login', render: v => v || 'Never' },
    { key: 'actions', label: 'Actions', render: (_, row) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => toggleUser(row)} className={`h-7 px-2 text-xs ${row.enabled ? 'text-rose-400 hover:text-rose-300' : 'text-emerald-400 hover:text-emerald-300'}`}>
          {row.enabled ? <><PowerOff className="w-3 h-3 mr-1" />Disable</> : <><Power className="w-3 h-3 mr-1" />Enable</>}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setShowReset(row); setResetForm({ password: '', repeatPassword: '' }); }} className="text-amber-400 hover:text-amber-300 h-7 px-2 text-xs">
          <KeyRound className="w-3 h-3 mr-1" />Reset
        </Button>
      </div>
    )},
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Users" description="Manage bank staff who access the system"
        action={<Button onClick={() => setShowCreate(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" /> Create User</Button>} />

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <DataTable columns={columns} data={users} loading={loading} emptyMessage="No users" />
      </div>

      {/* Create User Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create User</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300 text-xs">Username *</Label>
              <Input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300 text-xs">First Name *</Label>
                <Input value={form.firstname} onChange={e => setForm(p => ({ ...p, firstname: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-slate-300 text-xs">Last Name *</Label>
                <Input value={form.lastname} onChange={e => setForm(p => ({ ...p, lastname: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
              </div>
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Email *</Label>
              <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Office *</Label>
              <select value={form.officeId} onChange={e => setForm(p => ({ ...p, officeId: e.target.value }))} className="mt-1 w-full h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm">
                <option value="">Select office</option>
                {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Roles * (assign at least one)</Label>
              <div className="mt-1 space-y-1 max-h-32 overflow-y-auto border border-slate-700 rounded-lg p-2">
                {roles.map(r => (
                  <label key={r.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-800 cursor-pointer">
                    <input type="checkbox" checked={form.roleIds.includes(r.id)} onChange={() => toggleRole(r.id)} className="w-4 h-4 accent-emerald-600" />
                    <span className="text-sm text-slate-300">{r.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.sendPasswordToEmail} onChange={e => setForm(p => ({ ...p, sendPasswordToEmail: e.target.checked }))} className="w-4 h-4 accent-emerald-600" />
                <span className="text-sm text-slate-300">Send password to email</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.passwordNeverExpires} onChange={e => setForm(p => ({ ...p, passwordNeverExpires: e.target.checked }))} className="w-4 h-4 accent-emerald-600" />
                <span className="text-sm text-slate-300">Password never expires</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isSelfServiceUser} onChange={e => setForm(p => ({ ...p, isSelfServiceUser: e.target.checked }))} className="w-4 h-4 accent-emerald-600" />
                <span className="text-sm text-slate-300">Self-service user</span>
              </label>
            </div>
            {!form.sendPasswordToEmail && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300 text-xs">Password *</Label>
                  <Input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs">Repeat Password *</Label>
                  <Input type="password" value={form.repeatPassword} onChange={e => setForm(p => ({ ...p, repeatPassword: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-slate-400">Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.username || !form.firstname || !form.lastname || !form.email || !form.officeId || form.roleIds.length === 0 || (!form.sendPasswordToEmail && !form.password)} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!showReset} onOpenChange={() => setShowReset(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm">
          <DialogHeader><DialogTitle>Reset Password — {showReset?.username}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300 text-xs">New Password *</Label>
              <Input type="password" value={resetForm.password} onChange={e => setResetForm(p => ({ ...p, password: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Repeat Password *</Label>
              <Input type="password" value={resetForm.repeatPassword} onChange={e => setResetForm(p => ({ ...p, repeatPassword: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowReset(null)} className="text-slate-400">Cancel</Button>
            <Button onClick={handleResetPassword} disabled={saving || !resetForm.password} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}