import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fineractApi } from '@/lib/fineract';
import { ArrowLeft, Loader2, Edit, FileText, Receipt, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import StatusBadge from '@/components/fineract/StatusBadge';
import ClientOverviewTab from '@/components/fineract/client/ClientOverviewTab';
import ClientKycTab from '@/components/fineract/client/ClientKycTab';
import ClientSavingsTab from '@/components/fineract/client/ClientSavingsTab';
import ClientLoansTab from '@/components/fineract/client/ClientLoansTab';
import ClientPlaceholderTab from '@/components/fineract/client/ClientPlaceholderTab';
import AuditHistoryTab from '@/components/fineract/audit/AuditHistoryTab';
import { useToast } from '@/components/ui/use-toast';
import { useTerminology } from '@/lib/terminology';

export default function ClientDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const t = useTerminology();
  const [client, setClient] = useState(null);
  const [accounts, setAccounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showApplyLoan, setShowApplyLoan] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [c, a] = await Promise.all([
        fineractApi(`/clients/${id}`),
        fineractApi(`/clients/${id}/accounts`).catch(() => null),
      ]);
      setClient(c);
      setAccounts(a);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleCommand = async (cmd) => {
    try {
      const body = { locale: 'en', dateFormat: 'dd MMMM yyyy' };
      if (cmd === 'activate') {
        body.activationDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
      }
      if (cmd === 'close') {
        body.closureDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
        body.closureReasonId = 1;
      }
      await fineractApi(`/clients/${id}?command=${cmd}`, { method: 'POST', body });
      toast({ title: `${t.clientSingular} ${cmd}d successfully` });
      load();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await fineractApi(`/clients/${id}`, { method: 'PUT', body: editForm });
      toast({ title: `${t.clientSingular} updated` });
      setShowEdit(false);
      load();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = () => {
    setEditForm({ firstname: client.firstname, lastname: client.lastname, mobileNo: client.mobileNo || '' });
    setShowEdit(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>;
  }
  if (!client) {
    return <div className="p-8 text-center text-slate-500">{t.clientSingular} not found</div>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <Link to="/clients" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to {t.clients}
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xl font-bold">
            {client.displayName?.charAt(0) || '?'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{client.displayName}</h1>
            <p className="text-sm text-slate-400 mt-0.5">{t.clientSingular} #{client.accountNo} · {client.officeName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={client.status} />
          <Button size="sm" variant="outline" onClick={openEdit} className="border-slate-600 text-slate-300">
            <Edit className="w-3.5 h-3.5 mr-1" /> Edit
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50 flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="kyc">KYC</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          {t.showSavings && <TabsTrigger value="savings">{t.savings}</TabsTrigger>}
          <TabsTrigger value="loans">Loans</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <ClientOverviewTab
            client={client}
            accounts={accounts}
            onEdit={openEdit}
            onActivate={() => handleCommand('activate')}
            onClose={() => handleCommand('close')}
            onApplyLoan={() => { setActiveTab('loans'); setShowApplyLoan(true); }}
          />
        </TabsContent>
        <TabsContent value="kyc" className="mt-4">
          <ClientKycTab clientId={id} />
        </TabsContent>
        <TabsContent value="documents" className="mt-4">
          <ClientPlaceholderTab icon={FileText} title={`${t.clientSingular} Documents`} description="Document uploads and verification will appear here." />
        </TabsContent>
        {t.showSavings && (
          <TabsContent value="savings" className="mt-4">
            <ClientSavingsTab accounts={accounts} clientId={id} />
          </TabsContent>
        )}
        <TabsContent value="loans" className="mt-4">
          <ClientLoansTab clientId={id} accounts={accounts} onRefreshClient={load} showApply={showApplyLoan} setShowApply={setShowApplyLoan} />
        </TabsContent>
        <TabsContent value="transactions" className="mt-4">
          <ClientPlaceholderTab icon={Receipt} title={`${t.clientSingular} Transactions`} description="Account-level transactions across all products will appear here." />
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          <AuditHistoryTab entityName="CLIENT" resourceId={id} />
        </TabsContent>
      </Tabs>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader><DialogTitle>Edit {t.clientSingular}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300 text-xs">First Name</Label>
              <Input value={editForm.firstname || ''} onChange={e => setEditForm(p => ({ ...p, firstname: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Last Name</Label>
              <Input value={editForm.lastname || ''} onChange={e => setEditForm(p => ({ ...p, lastname: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Mobile Number</Label>
              <Input value={editForm.mobileNo || ''} onChange={e => setEditForm(p => ({ ...p, mobileNo: e.target.value }))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEdit(false)} className="text-slate-400">Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}