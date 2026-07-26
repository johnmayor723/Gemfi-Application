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

export default function Staff() {
  const { toast } = useToast();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [offices, setOffices] = useState([]);
  const [form, setForm] = useState({ firstname: '', lastname: '', officeId: '', mobileNo: '', isLoanOfficer: false });

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await fineractApi('/staff');
      setStaff(Array.isArray(res) ? res : []);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
    fineractApi('/offices').then(setOffices).catch(() => {});
  }, []);

  const handleCreate = async () => {
    setSaving(true);
    try {
      const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
      await fineractApi('/staff', {
        method: 'POST',
        body: {
          firstname: form.firstname,
          lastname: form.lastname,
          officeId: parseInt(form.officeId),
          isLoanOfficer: form.isLoanOfficer,
          isActive: true,
          joiningDate: today,
          locale: 'en',
          dateFormat: 'dd MMMM yyyy',
          ...(form.mobileNo && { mobileNo: form.mobileNo }),
        }
      });
      toast({ title: 'Staff member created' });
      setShowCreate(false);
      setForm({ firstname: '', lastname: '', officeId: '', mobileNo: '', isLoanOfficer: false });
      loadStaff();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'displayName', label: 'Name' },
    { key: 'officeName', label: 'Office' },
    { key: 'isLoanOfficer', label: 'Loan Officer', render: (v) => v ? 'Yes' : 'No' },
    { key: 'isActive', label: 'Active', render: (v) => v ? 'Yes' : 'No' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Staff" description="Manage staff members"
        action={<Button onClick={() => setShowCreate(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" /> New Staff</Button>} />

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <DataTable columns={columns} data={staff} loading={loading} emptyMessage="No staff members" />
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader><DialogTitle>Create Staff Member</DialogTitle></DialogHeader>
          <div className="space-y-4">
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
              <Label className="text-slate-300 text-xs">Office *</Label>
              <select value={form.officeId} onChange={e => setForm(p => ({ ...p, officeId: e.target.value }))} className="mt-1 w-full h-10 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm">
                <option value="">Select office</option>
                {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Mobile Number</Label>
              <Input value={form.mobileNo} onChange={e => setForm(p => ({ ...p, mobileNo: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={form.isLoanOfficer} onChange={e => setForm(p => ({ ...p, isLoanOfficer: e.target.checked }))} className="rounded" />
              Is Loan Officer
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-slate-400">Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.firstname || !form.lastname || !form.officeId} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}