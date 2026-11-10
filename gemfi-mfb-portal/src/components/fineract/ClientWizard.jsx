import React, { useState, useEffect } from 'react';
import { fineractApi } from '@/lib/fineract';
import { Loader2, Check, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useTerminology } from '@/lib/terminology';

const legalForms = [{ id: 1, name: 'Individual' }];

export default function ClientWizard({ offices, onClose, onCreated }) {
  const { toast } = useToast();
  const t = useTerminology();
  const [saving, setSaving] = useState(false);
  const [genders, setGenders] = useState([]);
  const [gendersLoaded, setGendersLoaded] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    firstname: '', lastname: '', mobileNo: '', emailAddress: '', genderId: '',
    officeId: '', legalFormId: '1',
    activateNow: false, activationDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fineractApi('/clients/template').then(t => {
      if (t.genderOptions?.length > 0) {
        setGenders(t.genderOptions);
        setGendersLoaded(true);
      } else {
        setGenders([{ id: 1, name: 'Male' }, { id: 2, name: 'Female' }]);
        setGendersLoaded(false);
      }
    }).catch(() => {
      setGenders([{ id: 1, name: 'Male' }, { id: 2, name: 'Female' }]);
      setGendersLoaded(false);
    });
  }, []);

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: undefined }));
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : null;

  const validate = () => {
    const e = {};
    if (!form.firstname.trim()) e.firstname = 'First name is required';
    if (!form.lastname.trim()) e.lastname = 'Last name is required';
    if (!form.mobileNo.trim()) e.mobileNo = 'Mobile number is required';
    else if (!/^[0-9+\-\s]{7,15}$/.test(form.mobileNo)) e.mobileNo = 'Invalid mobile number format';
    if (form.emailAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailAddress)) e.emailAddress = 'Invalid email format';
    if (!form.officeId) e.officeId = 'Office is required';
    if (!form.legalFormId) e.legalFormId = 'Legal form is required';
    if (form.activateNow && !form.activationDate) e.activationDate = 'Activation date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      // Build body dynamically — only include populated fields
      const body = {
        firstname: form.firstname.trim(),
        lastname: form.lastname.trim(),
        mobileNo: form.mobileNo.trim(),
        officeId: parseInt(form.officeId),
        legalFormId: parseInt(form.legalFormId),
        active: form.activateNow,
        locale: 'en',
        dateFormat: 'dd MMMM yyyy',
      };
      if (form.emailAddress.trim()) body.emailAddress = form.emailAddress.trim();
      // Only send genderId if it was loaded from Fineract's template and selected
      if (gendersLoaded && form.genderId) body.genderId = parseInt(form.genderId);
      if (form.activateNow) body.activationDate = fmtDate(form.activationDate);

      const res = await fineractApi('/clients', { method: 'POST', body });
      const clientId = res.resourceId || res.clientId;

      toast({ title: `${t.clientSingular} created successfully` });
      onCreated(clientId);
    } catch (err) {
      toast({ title: 'Validation Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'mt-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-600';
  const selectCls = 'mt-1 w-full h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">New {t.clientSingular}</h2>
          <p className="text-sm text-slate-400 mt-1">Create a new {t.clientSingular.toLowerCase()} in Fineract</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <User className="w-3.5 h-3.5" /> Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300 text-xs">First Name *</Label>
                <Input value={form.firstname} onChange={e => set('firstname', e.target.value)} className={inputCls} />
                {errors.firstname && <p className="text-xs text-rose-400 mt-1">{errors.firstname}</p>}
              </div>
              <div>
                <Label className="text-slate-300 text-xs">Last Name *</Label>
                <Input value={form.lastname} onChange={e => set('lastname', e.target.value)} className={inputCls} />
                {errors.lastname && <p className="text-xs text-rose-400 mt-1">{errors.lastname}</p>}
              </div>
              <div>
                <Label className="text-slate-300 text-xs">Mobile Number *</Label>
                <Input value={form.mobileNo} onChange={e => set('mobileNo', e.target.value)} placeholder="08012345678" className={inputCls} />
                {errors.mobileNo && <p className="text-xs text-rose-400 mt-1">{errors.mobileNo}</p>}
              </div>
              <div>
                <Label className="text-slate-300 text-xs">Email Address</Label>
                <Input type="email" value={form.emailAddress} onChange={e => set('emailAddress', e.target.value)} placeholder="john@example.com" className={inputCls} />
                {errors.emailAddress && <p className="text-xs text-rose-400 mt-1">{errors.emailAddress}</p>}
              </div>
              <div className="col-span-2">
                <Label className="text-slate-300 text-xs">Gender {!gendersLoaded && <span className="text-slate-600">(not configured on server)</span>}</Label>
                <select value={form.genderId} onChange={e => set('genderId', e.target.value)} className={selectCls}>
                  <option value="">Select gender</option>
                  {genders.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Client Configuration */}
          <div>
            <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Settings className="w-3.5 h-3.5" /> {t.clientSingular} Configuration
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300 text-xs">Office *</Label>
                <select value={form.officeId} onChange={e => set('officeId', e.target.value)} className={selectCls}>
                  <option value="">Select office</option>
                  {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
                {errors.officeId && <p className="text-xs text-rose-400 mt-1">{errors.officeId}</p>}
              </div>
              <div>
                <Label className="text-slate-300 text-xs">Legal Form *</Label>
                <select value={form.legalFormId} onChange={e => set('legalFormId', e.target.value)} className={selectCls}>
                  <option value="">Select legal form</option>
                  {legalForms.map(lf => <option key={lf.id} value={lf.id}>{lf.name}</option>)}
                </select>
                {errors.legalFormId && <p className="text-xs text-rose-400 mt-1">{errors.legalFormId}</p>}
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.activateNow} onChange={e => set('activateNow', e.target.checked)} className="w-4 h-4 rounded accent-emerald-600" />
                  <span className="text-sm text-slate-300">Activate {t.clientSingular.toLowerCase()} immediately</span>
                </label>
              </div>
              {form.activateNow && (
                <div className="col-span-2">
                  <Label className="text-slate-300 text-xs">Activation Date *</Label>
                  <Input type="date" value={form.activationDate} onChange={e => set('activationDate', e.target.value)} className={inputCls} />
                  {errors.activationDate && <p className="text-xs text-rose-400 mt-1">{errors.activationDate}</p>}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose} className="text-slate-400">Cancel</Button>
          <Button onClick={submit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-1" />} Create {t.clientSingular}
          </Button>
        </div>
      </div>
    </div>
  );
}