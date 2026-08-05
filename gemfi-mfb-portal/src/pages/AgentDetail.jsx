import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getAgent, approveAgent, rejectAgent, updateAgentStatus, updateCommissionSchedule, updateAgentLimits,
} from '@/lib/agencyApi';
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

export default function AgentDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null); // 'approve' | 'reject' | 'edit' | null
  const [saving, setSaving] = useState(false);
  const [reason, setReason] = useState('');
  const [form, setForm] = useState({
    settlementFineractAccountNumber: '',
    commissionType: 'PERCENTAGE',
    commissionValue: '',
    commissionCap: '',
    dailyCashInLimit: '',
    dailyCashOutLimit: '',
    perTransactionLimit: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAgent(id);
      setAgent(data);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => { load(); }, [load]);

  const openEdit = () => {
    setForm({
      settlementFineractAccountNumber: agent?.settlementFineractAccountNumber || '',
      commissionType: agent?.commissionSchedule?.type || 'PERCENTAGE',
      commissionValue: agent?.commissionSchedule?.value ?? '',
      commissionCap: agent?.commissionSchedule?.capAmount ?? '',
      dailyCashInLimit: agent?.dailyCashInLimit ?? '',
      dailyCashOutLimit: agent?.dailyCashOutLimit ?? '',
      perTransactionLimit: agent?.perTransactionLimit ?? '',
    });
    setDialog('edit');
  };

  const submitApprove = async () => {
    setSaving(true);
    try {
      await approveAgent(id, {
        settlementFineractAccountNumber: form.settlementFineractAccountNumber,
        commissionSchedule: {
          type: form.commissionType,
          value: Number(form.commissionValue),
          capAmount: form.commissionCap ? Number(form.commissionCap) : undefined,
        },
        dailyCashInLimit: Number(form.dailyCashInLimit),
        dailyCashOutLimit: Number(form.dailyCashOutLimit),
        perTransactionLimit: Number(form.perTransactionLimit),
      });
      toast({ title: 'Agent approved', description: 'Float account provisioned and agent activated.' });
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
      await rejectAgent(id, reason.trim());
      toast({ title: 'Agent application rejected' });
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
      await updateCommissionSchedule(id, {
        type: form.commissionType,
        value: Number(form.commissionValue),
        capAmount: form.commissionCap ? Number(form.commissionCap) : undefined,
      });
      await updateAgentLimits(id, {
        dailyCashInLimit: Number(form.dailyCashInLimit),
        dailyCashOutLimit: Number(form.dailyCashOutLimit),
        perTransactionLimit: Number(form.perTransactionLimit),
      });
      toast({ title: 'Commission schedule and limits updated' });
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
      await updateAgentStatus(id, status);
      toast({ title: `Agent ${status.toLowerCase()}` });
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

  if (!agent) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <Link to="/agents" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Agency Banking
        </Link>
        <p className="text-sm text-slate-400">Agent not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <Link to="/agents" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Agency Banking
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-white">{agent.businessName}</h1>
            <StatusBadge status={agent.status} />
          </div>
          <p className="text-sm text-slate-500 mt-1">{agent.agentType === 'SUPER_AGENT' ? 'Super Agent' : 'Agent'} · RC {agent.registrationNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          {agent.status === 'PENDING' && (
            <>
              <Button onClick={() => setDialog('approve')} className="bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
              </Button>
              <Button variant="outline" onClick={() => setDialog('reject')} className="border-rose-700 text-rose-400 hover:bg-rose-500/10">
                <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
              </Button>
            </>
          )}
          {agent.status === 'ACTIVE' && (
            <>
              <Button variant="outline" onClick={openEdit} className="border-slate-600 text-slate-300 hover:bg-slate-700">
                <PenSquare className="w-3.5 h-3.5 mr-1" /> Edit Commission & Limits
              </Button>
              <Button variant="outline" onClick={() => transition('SUSPENDED')} disabled={saving} className="border-amber-700 text-amber-400 hover:bg-amber-500/10">
                <PauseCircle className="w-3.5 h-3.5 mr-1" /> Suspend
              </Button>
            </>
          )}
          {agent.status === 'SUSPENDED' && (
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
          <Field label="Trading Name" value={agent.tradingName} />
          <Field label="Business Type" value={agent.businessType} />
          <Field label="Contact Name" value={agent.contactName} />
          <Field label="Contact Email" value={agent.contactEmail} />
          <Field label="Contact Phone" value={agent.contactPhone} />
          <Field label="Address" value={agent.address} />
          {agent.agentType === 'AGENT' && <Field label="Parent Super Agent ID" value={agent.parentAgentId} />}
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-2">Float & Limits</h2>
          {agent.status === 'REJECTED' && <Field label="Rejection Reason" value={agent.rejectionReason} />}
          <Field label="Settlement Account" value={agent.settlementFineractAccountNumber} />
          <Field label="Float Virtual Account" value={agent.floatVirtualAccountNumber} />
          <Field label="Commission" value={agent.commissionSchedule ? `${agent.commissionSchedule.type === 'PERCENTAGE' ? agent.commissionSchedule.value + '%' : fmtMoney(agent.commissionSchedule.value)}${agent.commissionSchedule.capAmount ? ` (capped ${fmtMoney(agent.commissionSchedule.capAmount)})` : ''}` : null} />
          <Field label="Daily Cash-In Limit" value={fmtMoney(agent.dailyCashInLimit)} />
          <Field label="Daily Cash-Out Limit" value={fmtMoney(agent.dailyCashOutLimit)} />
          <Field label="Per-Transaction Limit" value={fmtMoney(agent.perTransactionLimit)} />
          <Field label="Reviewed By" value={agent.reviewedBy} />
          <Field label="Reviewed At" value={fmtDate(agent.reviewedAt)} />
        </div>
      </div>

      {/* Approve dialog */}
      <Dialog open={dialog === 'approve'} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader><DialogTitle>Approve Agent</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-400 -mt-2">
            Provisions a float virtual account against the settlement account below and activates the agent.
          </p>
          <div className="space-y-3">
            <div>
              <Label className="text-slate-300 text-xs">Settlement Fineract Account Number</Label>
              <Input value={form.settlementFineractAccountNumber} onChange={e => setForm(f => ({ ...f, settlementFineractAccountNumber: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" placeholder="e.g. 000000004" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-slate-300 text-xs">Commission Type</Label>
                <select value={form.commissionType} onChange={e => setForm(f => ({ ...f, commissionType: e.target.value }))} className="mt-1 w-full bg-slate-800 border border-slate-700 text-white rounded-md px-2 py-2 text-sm">
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FLAT">Flat</option>
                </select>
              </div>
              <div>
                <Label className="text-slate-300 text-xs">Value</Label>
                <Input type="number" value={form.commissionValue} onChange={e => setForm(f => ({ ...f, commissionValue: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-slate-300 text-xs">Cap (optional)</Label>
                <Input type="number" value={form.commissionCap} onChange={e => setForm(f => ({ ...f, commissionCap: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-slate-300 text-xs">Daily Cash-In Limit</Label>
                <Input type="number" value={form.dailyCashInLimit} onChange={e => setForm(f => ({ ...f, dailyCashInLimit: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-slate-300 text-xs">Daily Cash-Out Limit</Label>
                <Input type="number" value={form.dailyCashOutLimit} onChange={e => setForm(f => ({ ...f, dailyCashOutLimit: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-slate-300 text-xs">Per-Transaction Limit</Label>
                <Input type="number" value={form.perTransactionLimit} onChange={e => setForm(f => ({ ...f, perTransactionLimit: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
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
          <DialogHeader><DialogTitle>Reject Agent Application</DialogTitle></DialogHeader>
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

      {/* Edit commission/limits dialog */}
      <Dialog open={dialog === 'edit'} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader><DialogTitle>Edit Commission & Limits</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-slate-300 text-xs">Commission Type</Label>
                <select value={form.commissionType} onChange={e => setForm(f => ({ ...f, commissionType: e.target.value }))} className="mt-1 w-full bg-slate-800 border border-slate-700 text-white rounded-md px-2 py-2 text-sm">
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FLAT">Flat</option>
                </select>
              </div>
              <div>
                <Label className="text-slate-300 text-xs">Value</Label>
                <Input type="number" value={form.commissionValue} onChange={e => setForm(f => ({ ...f, commissionValue: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-slate-300 text-xs">Cap (optional)</Label>
                <Input type="number" value={form.commissionCap} onChange={e => setForm(f => ({ ...f, commissionCap: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-slate-300 text-xs">Daily Cash-In Limit</Label>
                <Input type="number" value={form.dailyCashInLimit} onChange={e => setForm(f => ({ ...f, dailyCashInLimit: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-slate-300 text-xs">Daily Cash-Out Limit</Label>
                <Input type="number" value={form.dailyCashOutLimit} onChange={e => setForm(f => ({ ...f, dailyCashOutLimit: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-slate-300 text-xs">Per-Transaction Limit</Label>
                <Input type="number" value={form.perTransactionLimit} onChange={e => setForm(f => ({ ...f, perTransactionLimit: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
              </div>
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
