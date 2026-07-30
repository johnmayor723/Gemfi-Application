import React, { useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { kycApi } from '@/lib/kycApi';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

export default function KycApprovalActions({ clientId, status, onChanged }) {
  const { toast } = useToast();
  const [dialog, setDialog] = useState(null); // 'approve' | 'reject' | null
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      if (dialog === 'approve') {
        await kycApi(`/customers/${clientId}/kyc/approve`, { method: 'POST' });
        toast({ title: 'KYC profile approved' });
      } else {
        await kycApi(`/customers/${clientId}/kyc/reject`, {
          method: 'POST',
          body: { reason: reason.trim() || undefined },
        });
        toast({ title: 'KYC profile rejected' });
      }
      setDialog(null);
      setReason('');
      onChanged?.();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => setDialog('approve')}
          disabled={status === 'Verified'}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setDialog('reject')}
          disabled={status === 'Rejected'}
          className="border-rose-700 text-rose-400 hover:bg-rose-500/10"
        >
          <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
        </Button>
      </div>

      <Dialog open={!!dialog} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>{dialog === 'approve' ? 'Approve KYC Profile' : 'Reject KYC Profile'}</DialogTitle>
          </DialogHeader>

          {dialog === 'approve' ? (
            <p className="text-sm text-slate-400">
              This marks the customer's KYC as Verified. This action is recorded in the audit trail under your admin account.
            </p>
          ) : (
            <div>
              <Label className="text-slate-300 text-xs">Reason (optional)</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1 bg-slate-800 border-slate-700 text-white"
                placeholder="e.g. BVN name mismatch with submitted documents"
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} className="border-slate-600 text-slate-300">
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={saving}
              className={dialog === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}
            >
              {saving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
              {dialog === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
