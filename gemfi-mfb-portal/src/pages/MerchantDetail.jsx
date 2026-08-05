import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getMerchant, approveMerchant, rejectMerchant, updateMerchantStatus, updateFeeSchedule,
} from '@/lib/merchantApi';
import { ArrowLeft, Loader2, CheckCircle2, XCircle, PauseCircle, PlayCircle, Ban, PenSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import StatusBadge from '@/components/fineract/StatusBadge';
import { useToast } from '@/components/ui/use-toast';

function Field({ label, value }) {
  return (
    <div className="py-2 border-b border-slate-700/30 last:border-0">
      <div className="text-[11px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-sm text-white mt-0.5">{value ?? '—'}</div>
    </div>
  );
}

const fmtDate = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;
const fmtMoney = (n) => n == null ? null : `₦${Number(n).toLocaleString('en-NG')}`;

export default function MerchantDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null); // 'approve' | 'reject' | 'edit' | null
  const [saving, setSaving] = useState(false);
  const [reason, setReason] = useState('');
  const [form, setForm] = useState({
    settlementFineractAccountNumber: '',
    feeType: 'PERCENTAGE',
    feeValue: '',
    feeCap: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMerchant(id);
      setMerchant(data);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => { load(); }, [load]);

  const openEdit = () => {
    setForm({
      settlementFineractAccountNumber: merchant?.settlementFineractAccountNumber || '',
      feeType: merchant?.feeSchedule?.type || 'PERCENTAGE',
      feeValue: merchant?.feeSchedule?.value ?? '',
      feeCap: merchant?.feeSchedule?.capAmount ?? '',
    });
    setDialog('edit');
  };

  const submitApprove = async () => {
    setSaving(true);
    try {
      await approveMerchant(id, {
        settlementFineractAccountNumber: form.settlementFineractAccountNumber,
        feeSchedule: {
          type: form.feeType,
          value: Number(form.feeValue),
          capAmount: form.feeCap ? Number(form.feeCap) : undefined,
        },
      });
      toast({ title: 'Merchant approved', description: 'Settlement account provisioned and merchant activated.' });
      setDialog(null);
      load();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const submitReject = async () => {
    setSaving(true);
    try {
      await rejectMerchant(id, reason.trim());
      toast({ title: 'Merchant application rejected' });
      setDialog(null);
      setReason('');
      load();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async () => {
    setSaving(true);
    try {
      await updateFeeSchedule(id, {
        type: form.feeType,
        value: Number(form.feeValue),
        capAmount: form.feeCap ? Number(form.feeCap) : undefined,
      });
      toast({ title: 'Fee schedule updated' });
      setDialog(null);
      load();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const transition = async (status) => {
    setSaving(true);
    try {
      await updateMerchantStatus(id, status);
      toast({ title: `Merchant ${status.toLowerCase()}` });
      load();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>;
  }

  if (!merchant) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <Link to="/merchants" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Merchant Acquisition
        </Link>
        <p className="text-sm text-slate-400">Merchant not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <Link to="/merchants" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Merchant Acquisition
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-white">{merchant.businessName}</h1>
            <StatusBadge status={merchant.status} />
          </div>
          <p className="text-sm text-slate-500 mt-1">{merchant.merchantCategory} · RC {merchant.registrationNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          {merchant.status === 'PENDING' && (
            <>
              <Button onClick={() => setDialog('approve')} className="bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
              </Button>
              <Button variant="outline" onClick={() => setDialog('reject')} className="border-rose-700 text-rose-400 hover:bg-rose-500/10">
                <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
              </Button>
            </>
          )}
          {merchant.status === 'ACTIVE' && (
            <>
              <Button variant="outline" onClick={openEdit} className="border-slate-600 text-slate-300 hover:bg-slate-700">
                <PenSquare className="w-3.5 h-3.5 mr-1" /> Edit Fee Schedule
              </Button>
              <Button variant="outline" onClick={() => transition('SUSPENDED')} disabled={saving} className="border-amber-700 text-amber-400 hover:bg-amber-500/10">
                <PauseCircle className="w-3.5 h-3.5 mr-1" /> Suspend
              </Button>
            </>
          )}
          {merchant.status === 'SUSPENDED' && (
            <>
              <Button onClick={() => transition('ACTIVE')} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                <PlayCircle className="w-3.5 h-3.5 mr-1" /> Reactivate
              </Button>
              <Button variant="outline" onClick={() => transition('CLOSED')} disabled={saving} className="border-rose-700 text-rose-400 hover:bg-rose-500/10">
                <Ban className="w-3.5 h-3.5 mr-1" /> Close
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-2">Business Details</h2>
          <Field label="Trading Name" value={merchant.tradingName} />
          <Field label="Business Type" value={merchant.businessType} />
          <Field label="Contact Name" value={merchant.contactName} />
          <Field label="Contact Email" value={merchant.contactEmail} />
          <Field label="Contact Phone" value={merchant.contactPhone} />
          <Field label="Address" value={merchant.address} />
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-2">Settlement & Fees</h2>
          {merchant.status === 'REJECTED' && <Field label="Rejection Reason" value={merchant.rejectionReason} />}
          <Field label="Settlement Account" value={merchant.settlementFineractAccountNumber} />
          <Field label="Collection Virtual Account" value={merchant.settlementVirtualAccountNumber} />
          <Field label="Fee" value={merchant.feeSchedule ? `${merchant.feeSchedule.type === 'PERCENTAGE' ? merchant.feeSchedule.value + '%' : fmtMoney(merchant.feeSchedule.value)}${merchant.feeSchedule.capAmount ? ` (capped ${fmtMoney(merchant.feeSchedule.capAmount)})` : ''}` : null} />
          <Field label="Reviewed By" value={merchant.reviewedBy} />
          <Field label="Reviewed At" value={fmtDate(merchant.reviewedAt)} />
        </div>
      </div>

      {/* Approve dialog */}
      <Dialog open={dialog === 'approve'} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader><DialogTitle>Approve Merchant</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-400 -mt-2">
            Provisions a collection virtual account against the settlement account below and activates the merchant.
          </p>
          <div className="space-y-3">
            <div>
              <Label className="text-slate-300 text-xs">Settlement Fineract Account Number</Label>
              <Input value={form.settlementFineractAccountNumber} onChange={e => setForm(f => ({ ...f, settlementFineractAccountNumber: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" placeholder="e.g. 000000004" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-slate-300 text-xs">Fee Type</Label>
                <select value={form.feeType} onChange={e => setForm(f => ({ ...f, feeType: e.target.value }))} className="mt-1 w-full bg-slate-800 border border-slate-700 text-white rounded-md px-2 py-2 text-sm">
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FLAT">Flat</option>
                </select>
              </div>
              <div>
                <Label className="text-slate-300 text-xs">Value</Label>
                <Input type="number" value={form.feeValue} onChange={e => setForm(f => ({ ...f, feeValue: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-slate-300 text-xs">Cap (optional)</Label>
                <Input type="number" value={form.feeCap} onChange={e => setForm(f => ({ ...f, feeCap: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} className="border-slate-600 text-slate-300">Cancel</Button>
            <Button onClick={submitApprove} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />} Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={dialog === 'reject'} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader><DialogTitle>Reject Merchant Application</DialogTitle></DialogHeader>
          <div>
            <Label className="text-slate-300 text-xs">Rejection Reason</Label>
            <Textarea value={reason} onChange={e => setReason(e.target.value)} className="mt-1 bg-slate-800 border-slate-700 text-white" placeholder="e.g. Registration number could not be verified" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} className="border-slate-600 text-slate-300">Cancel</Button>
            <Button onClick={submitReject} disabled={saving || !reason.trim()} className="bg-rose-600 hover:bg-rose-700">
              {saving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />} Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit fee schedule dialog */}
      <Dialog open={dialog === 'edit'} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader><DialogTitle>Edit Fee Schedule</DialogTitle></DialogHeader>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-slate-300 text-xs">Fee Type</Label>
              <select value={form.feeType} onChange={e => setForm(f => ({ ...f, feeType: e.target.value }))} className="mt-1 w-full bg-slate-800 border border-slate-700 text-white rounded-md px-2 py-2 text-sm">
                <option value="PERCENTAGE">Percentage</option>
                <option value="FLAT">Flat</option>
              </select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Value</Label>
              <Input type="number" value={form.feeValue} onChange={e => setForm(f => ({ ...f, feeValue: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Cap (optional)</Label>
              <Input type="number" value={form.feeCap} onChange={e => setForm(f => ({ ...f, feeCap: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} className="border-slate-600 text-slate-300">Cancel</Button>
            <Button onClick={submitEdit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
