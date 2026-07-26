import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, RefreshCw, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fineractApi } from '@/lib/fineract';
import { getAccountIdentifiers, registerAccount, isAccountServiceConfigured } from '@/lib/accountApi';
import { useToast } from '@/components/ui/use-toast';

// Displays (and, if missing, generates) the Account Number / NUBAN /
// Fineract account number for a savings account. `compact` renders an
// inline strip (for lists); otherwise a full card (for detail pages).
export default function AccountIdentifiers({ fineractAccountId, clientId, clientName, clientMobile, compact = false }) {
  const { toast } = useToast();
  const [identifiers, setIdentifiers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const configured = isAccountServiceConfigured();

  const load = useCallback(async () => {
    if (!configured || !fineractAccountId) { setLoading(false); return; }
    setLoading(true);
    try {
      setIdentifiers(await getAccountIdentifiers(fineractAccountId));
    } catch {
      setIdentifiers(null);
    } finally {
      setLoading(false);
    }
  }, [fineractAccountId, configured]);

  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    setGenerating(true);
    try {
      let name = clientName;
      let phoneNumber = clientMobile;
      if ((!name || !phoneNumber) && clientId) {
        const client = await fineractApi(`/clients/${clientId}`);
        name = name || client.displayName;
        phoneNumber = phoneNumber || client.mobileNo;
      }
      if (!phoneNumber) throw new Error('Client has no mobile number on file.');
      await registerAccount({ fineractAccountId, name, phoneNumber });
      toast({ title: 'Account Number generated' });
      await load();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  if (!configured) {
    return compact ? null : (
      <p className="text-xs text-slate-500">
        Account Service is not configured. <a href="/connection" className="text-emerald-400 hover:underline">Configure it</a> to generate Account Numbers.
      </p>
    );
  }

  if (loading) {
    return compact ? null : <Loader2 className="w-4 h-4 animate-spin text-slate-500" />;
  }

  if (!identifiers) {
    return (
      <div className={compact ? 'flex items-center gap-2 mt-1' : 'flex items-center justify-between'}>
        <span className={compact ? 'text-[11px] text-amber-400' : 'text-sm text-amber-400'}>Account Number not yet generated</span>
        <Button
          size="sm"
          variant="outline"
          onClick={generate}
          disabled={generating}
          className={compact ? 'h-6 px-2 text-[11px] border-slate-600 text-slate-300' : 'border-slate-600 text-slate-300'}
        >
          {generating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />} Generate
        </Button>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
        <span>Acct # <span className="text-white font-medium">{identifiers.accountNumber}</span></span>
        <span>NUBAN <span className="text-white font-medium">{identifiers.nuban || '—'}</span></span>
      </div>
    );
  }

  const Field = ({ label, value }) => (
    <div>
      <dt className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</dt>
      <dd className="text-sm text-white mt-1">{value || '—'}</dd>
    </div>
  );

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <Hash className="w-4 h-4 text-emerald-400" /> Account Identifiers
      </h2>
      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Field label="Account Number" value={identifiers.accountNumber} />
        <Field label="NUBAN" value={identifiers.nuban} />
        <Field label="Fineract Account Number" value={identifiers.fineractAccountNumber} />
      </dl>
    </div>
  );
}
