import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fineractApi } from '@/lib/fineract';
import { ArrowLeft, Loader2, UserPlus, UserMinus, CheckCircle, XCircle, Search, Edit, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import StatusBadge from '@/components/fineract/StatusBadge';
import DataTable from '@/components/fineract/DataTable';
import { useToast } from '@/components/ui/use-toast';
import { useTerminology } from '@/lib/terminology';

export default function GroupDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const t = useTerminology();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showRemoveMembers, setShowRemoveMembers] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClients, setSelectedClients] = useState([]);
  const [removingClients, setRemovingClients] = useState([]);
  const [saving, setSaving] = useState(false);
  const [offices, setOffices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [editForm, setEditForm] = useState({ name: '', officeId: '', staffId: '', externalId: '' });
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : null;

  const load = async () => {
    setLoading(true);
    try {
      const g = await fineractApi(`/groups/${id}?associations=clientMembers,staff`);
      setGroup(g);
      setEditForm({ name: g.name || '', officeId: String(g.officeId || ''), staffId: g.staffId ? String(g.staffId) : '', externalId: g.externalId || '' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    fineractApi('/offices').then(setOffices).catch(() => {});
    fineractApi('/staff').then(r => setStaff(r.pageItems || r || [])).catch(() => {});
  }, [id]);

  const loadClients = async () => {
    try {
      const res = await fineractApi('/clients', { params: { limit: 200 } });
      setClients(res.pageItems || []);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const openAddMembers = () => {
    setShowAddMembers(true);
    setSelectedClients([]);
    setClientSearch('');
    loadClients();
  };

  const filteredClients = clients.filter(c => {
    if (!clientSearch) return true;
    const s = clientSearch.toLowerCase();
    return c.displayName?.toLowerCase().includes(s) || c.accountNo?.includes(s) || c.mobileNo?.includes(s);
  });

  const existingMemberIds = new Set((group?.clientMembers || []).map(m => m.id));
  const availableClients = filteredClients.filter(c => !existingMemberIds.has(c.id));

  const toggleClient = (clientId) => {
    setSelectedClients(prev => prev.includes(clientId) ? prev.filter(id => id !== clientId) : [...prev, clientId]);
  };

  const handleAddMembers = async () => {
    if (selectedClients.length === 0) return;
    setSaving(true);
    try {
      await fineractApi(`/groups/${id}?command=associateClients`, {
        method: 'POST',
        body: { clientMembers: selectedClients }
      });
      toast({ title: `${selectedClients.length} member(s) added` });
      setShowAddMembers(false);
      load();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMembers = async () => {
    if (removingClients.length === 0) return;
    setSaving(true);
    try {
      await fineractApi(`/groups/${id}?command=disassociateClients`, {
        method: 'POST',
        body: { clientMembers: removingClients }
      });
      toast({ title: `${removingClients.length} member(s) removed` });
      setShowRemoveMembers(false);
      setRemovingClients([]);
      load();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async () => {
    setSaving(true);
    try {
      await fineractApi(`/groups/${id}?command=activate`, {
        method: 'POST',
        body: { activationDate: fmtDate(new Date()), locale: 'en', dateFormat: 'dd MMMM yyyy' }
      });
      toast({ title: 'Group activated' });
      load();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async () => {
    if (!confirm('Close this group?')) return;
    setSaving(true);
    try {
      await fineractApi(`/groups/${id}?command=close`, {
        method: 'POST',
        body: { closureDate: fmtDate(new Date()), locale: 'en', dateFormat: 'dd MMMM yyyy' }
      });
      toast({ title: 'Group closed' });
      load();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    setSaving(true);
    try {
      const body = { name: editForm.name.trim(), officeId: parseInt(editForm.officeId) };
      if (editForm.staffId) body.staffId = parseInt(editForm.staffId);
      if (editForm.externalId.trim()) body.externalId = editForm.externalId.trim();
      await fineractApi(`/groups/${id}`, { method: 'PUT', body });
      toast({ title: 'Group updated' });
      setShowEdit(false);
      load();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const loadNotes = async () => {
    try {
      const res = await fineractApi(`/groups/${id}/notes`);
      setNotes(Array.isArray(res) ? res : []);
    } catch (err) {
      setNotes([]);
    }
  };

  const openNotes = () => { setShowNotes(true); loadNotes(); };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      await fineractApi(`/groups/${id}/notes`, { method: 'POST', body: { note: newNote.trim() } });
      setNewNote('');
      loadNotes();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>;
  if (!group) return <div className="p-8 text-center text-slate-500">Group not found</div>;

  const statusVal = group.status?.value?.toLowerCase() || '';
  const memberColumns = [
    { key: 'accountNo', label: `${t.clientSingular} #` },
    { key: 'displayName', label: 'Name', render: (v, row) => <Link to={`/clients/${row.id}`} className="text-emerald-400 hover:underline">{v}</Link> },
    { key: 'mobileNo', label: 'Mobile', render: v => v || '—' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
  ];

  const Field = ({ label, value }) => (
    <div><dt className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</dt><dd className="text-sm text-white mt-1">{value ?? '—'}</dd></div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <Link to="/groups" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Groups
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{group.name}</h1>
          <p className="text-sm text-slate-400 mt-1">Group ID: {group.id} · {group.clientMembers?.length || 0} members</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={group.status} />
          {statusVal !== 'active' && (
            <Button size="sm" onClick={handleActivate} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Activate
            </Button>
          )}
          {statusVal === 'active' && (
            <Button size="sm" variant="outline" onClick={handleClose} disabled={saving} className="border-slate-600 text-slate-300">
              <XCircle className="w-3.5 h-3.5 mr-1" /> Close
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setShowEdit(true)} className="border-slate-600 text-slate-300">
            <Edit className="w-3.5 h-3.5 mr-1" /> Edit
          </Button>
          <Button size="sm" variant="outline" onClick={openNotes} className="border-slate-600 text-slate-300">
            <StickyNote className="w-3.5 h-3.5 mr-1" /> Notes
          </Button>
        </div>
      </div>

      {/* Group Info */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-white mb-4">Group Information</h2>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Name" value={group.name} />
          <Field label="Office" value={group.officeName} />
          <Field label="Staff" value={group.staffName} />
          <Field label="Activation Date" value={group.activationDate ? fmtDate(group.activationDate.join ? group.activationDate.join('-') : group.activationDate) : '—'} />
          <Field label="External ID" value={group.externalId} />
          <Field label="Member Count" value={group.clientMembers?.length || 0} />
          <Field label="Active Members" value={group.clientMembers?.filter(m => m.status?.value?.toLowerCase() === 'active').length || 0} />
          <Field label="Status" value={group.status?.value} />
        </dl>
      </div>

      {/* Members */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Members ({group.clientMembers?.length || 0})</h2>
          <div className="flex gap-2">
            <Button size="sm" onClick={openAddMembers} className="bg-emerald-600 hover:bg-emerald-700">
              <UserPlus className="w-3.5 h-3.5 mr-1" /> Add Members
            </Button>
            {group.clientMembers?.length > 0 && (
              <Button size="sm" variant="outline" onClick={() => { setShowRemoveMembers(true); setRemovingClients([]); }} className="border-slate-600 text-slate-300">
                <UserMinus className="w-3.5 h-3.5 mr-1" /> Remove
              </Button>
            )}
          </div>
        </div>
        <DataTable columns={memberColumns} data={group.clientMembers || []} emptyMessage="No members yet" />
      </div>

      {/* Add Members Dialog */}
      <Dialog open={showAddMembers} onOpenChange={setShowAddMembers}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader><DialogTitle>Add Members</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder="Search by name, client #, or phone…"
                className="pl-9 bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1 border border-slate-700 rounded-lg p-2">
              {availableClients.length === 0 ? <p className="text-center text-slate-500 text-sm py-4">No available clients</p> :
                availableClients.map(c => (
                  <label key={c.id} className="flex items-center gap-3 p-2 rounded hover:bg-slate-800 cursor-pointer">
                    <input type="checkbox" checked={selectedClients.includes(c.id)} onChange={() => toggleClient(c.id)} className="w-4 h-4 accent-emerald-600" />
                    <div>
                      <div className="text-sm text-white">{c.displayName}</div>
                      <div className="text-xs text-slate-500">#{c.accountNo} · {c.mobileNo || 'No phone'}</div>
                    </div>
                  </label>
                ))
              }
            </div>
            {selectedClients.length > 0 && <p className="text-xs text-emerald-400">{selectedClients.length} selected</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddMembers(false)} className="text-slate-400">Cancel</Button>
            <Button onClick={handleAddMembers} disabled={saving || selectedClients.length === 0} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Add {selectedClients.length || ''} Member(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Members Dialog */}
      <Dialog open={showRemoveMembers} onOpenChange={setShowRemoveMembers}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader><DialogTitle>Remove Members</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto border border-slate-700 rounded-lg p-2">
            {(group.clientMembers || []).map(m => (
              <label key={m.id} className="flex items-center gap-3 p-2 rounded hover:bg-slate-800 cursor-pointer">
                <input type="checkbox" checked={removingClients.includes(m.id)} onChange={() => setRemovingClients(prev => prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id])} className="w-4 h-4 accent-rose-600" />
                <div>
                  <div className="text-sm text-white">{m.displayName}</div>
                  <div className="text-xs text-slate-500">#{m.accountNo}</div>
                </div>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRemoveMembers(false)} className="text-slate-400">Cancel</Button>
            <Button onClick={handleRemoveMembers} disabled={saving || removingClients.length === 0} className="bg-rose-600 hover:bg-rose-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Remove {removingClients.length || ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader><DialogTitle>Edit Group</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300 text-xs">Group Name *</Label>
              <Input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Office *</Label>
              <select value={editForm.officeId} onChange={e => setEditForm(p => ({ ...p, officeId: e.target.value }))}
                className="mt-1 w-full h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm">
                <option value="">Select office</option>
                {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Staff</Label>
              <select value={editForm.staffId} onChange={e => setEditForm(p => ({ ...p, staffId: e.target.value }))}
                className="mt-1 w-full h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm">
                <option value="">Select staff</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.displayName}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs">External ID</Label>
              <Input value={editForm.externalId} onChange={e => setEditForm(p => ({ ...p, externalId: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEdit(false)} className="text-slate-400">Cancel</Button>
            <Button onClick={handleEdit} disabled={saving || !editForm.name || !editForm.officeId} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={showNotes} onOpenChange={setShowNotes}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader><DialogTitle>Group Notes</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {notes.length === 0 ? <p className="text-center text-slate-500 text-sm py-4">No notes yet</p> :
              notes.map(n => (
                <div key={n.id} className="bg-slate-800 rounded-lg p-3">
                  <p className="text-sm text-slate-300">{n.note}</p>
                  <p className="text-xs text-slate-500 mt-1">{n.createdByUsername} · {n.createdOn?.join?.('-') || n.createdOn}</p>
                </div>
              ))
            }
          </div>
          <div className="space-y-2">
            <Textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a note…" className="bg-slate-800 border-slate-700 text-white" />
            <Button onClick={handleAddNote} disabled={!newNote.trim()} size="sm" className="bg-emerald-600 hover:bg-emerald-700">Add Note</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}