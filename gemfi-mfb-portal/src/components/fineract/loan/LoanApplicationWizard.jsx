import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fineractApi } from '@/lib/fineract';
import { Loader2, Check, ChevronRight, FileText, Calendar, DollarSign, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import DataTable from '@/components/fineract/DataTable';
import { useToast } from '@/components/ui/use-toast';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : null;

// Extract the integer ID from an EnumOptionData object {id, code, value},
// or return the fallback. Uses ?? so that id=0 (valid for Days, Flat, etc.) is preserved.
const enumId = (val, fallback) => {
  if (val == null) return fallback;
  if (typeof val === 'number') return val;
  if (val.id != null) return val.id;
  return fallback;
};

export default function LoanApplicationWizard({ clientId, productId: presetProductId, onClose, onSubmitted }) {
  const navigate = useNavigate();
  const { id: routeClientId } = useParams();
  const { toast } = useToast();
  const effectiveClientId = clientId || routeClientId;

  const [step, setStep] = useState(0);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [template, setTemplate] = useState(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [schedule, setSchedule] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    productId: presetProductId || '',
    principal: '',
    loanPurpose: '',
    submittedOnDate: new Date().toISOString().split('T')[0],
    expectedDisbursementDate: new Date().toISOString().split('T')[0],
  });

  // Load loan products
  useEffect(() => {
    fineractApi('/loanproducts')
      .then(res => setProducts(Array.isArray(res) ? res : []))
      .catch(err => toast({ title: 'Error', description: err.message, variant: 'destructive' }))
      .finally(() => setLoadingProducts(false));
  }, []);

  // When product selected, load the loan template
  const onProductChange = async (productId) => {
    setForm(p => ({ ...p, productId }));
    if (!productId || !effectiveClientId) return;
    setLoadingTemplate(true);
    setTemplate(null);
    try {
      const tpl = await fineractApi('/loans/template', {
        params: { clientId: effectiveClientId, productId },
      });
      setTemplate(tpl);
      // Populate defaults from template
      setForm(p => ({
        ...p,
        principal: tpl.principal != null ? String(tpl.principal) : p.principal,
        submittedOnDate: new Date().toISOString().split('T')[0],
        expectedDisbursementDate: tpl.timeline?.expectedDisbursementDate
          ? tpl.timeline.expectedDisbursementDate.map(n => String(n).padStart(2, '0')).join('-')
          : new Date().toISOString().split('T')[0],
      }));
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoadingTemplate(false);
    }
  };

  // Build the Fineract loan payload from template + form data.
  // Uses transactionProcessingStrategyCode (NOT transactionProcessingStrategyId)
  // and locale: 'en' per the verified API contract.
  const buildPayload = () => {
    const strategyCode = template?.transactionProcessingStrategyCode || 'mifos-standard-strategy';

    return {
      clientId: parseInt(effectiveClientId),
      productId: parseInt(form.productId),
      principal: parseFloat(form.principal),
      loanTermFrequency: template?.termFrequency ?? template?.loanTermFrequency ?? 12,
      loanTermFrequencyType: enumId(template?.termPeriodFrequencyType, 2),
      loanType: 'individual',
      numberOfRepayments: template?.numberOfRepayments ?? 12,
      repaymentEvery: template?.repaymentEvery ?? 1,
      repaymentFrequencyType: enumId(template?.repaymentFrequencyType, 2),
      interestRatePerPeriod: template?.interestRatePerPeriod ?? 0,
      amortizationType: enumId(template?.amortizationType, 1),
      interestType: enumId(template?.interestType, 0),
      interestCalculationPeriodType: enumId(template?.interestCalculationPeriodType, 1),
      transactionProcessingStrategyCode: strategyCode,
      daysInYearType: enumId(template?.daysInYearType, 1),
      expectedDisbursementDate: fmtDate(form.expectedDisbursementDate),
      submittedOnDate: fmtDate(form.submittedOnDate),
      locale: 'en',
      dateFormat: 'dd MMMM yyyy',
    };
  };

  // Preview repayment schedule
  const previewSchedule = async () => {
    if (!form.principal || !form.expectedDisbursementDate) return;
    setLoadingSchedule(true);
    try {
      const body = buildPayload();
      const res = await fineractApi('/loans?command=calculateLoanSchedule', { method: 'POST', body });
      setSchedule(res);
      setStep(2);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoadingSchedule(false);
    }
  };

  const submit = async () => {
    setSaving(true);
    try {
      const body = buildPayload();
      if (form.loanPurpose.trim()) body.loanPurpose = form.loanPurpose.trim();

      const res = await fineractApi('/loans', { method: 'POST', body });
      const loanId = res.loanId || res.resourceId;
      toast({ title: 'Loan application submitted successfully' });
      if (onSubmitted) onSubmitted(loanId);
      else if (loanId) navigate(`/loans/${loanId}`);
      else if (onClose) onClose();
    } catch (err) {
      toast({ title: 'Validation Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'mt-1 bg-slate-800 border-slate-700 text-white';
  const selectCls = 'mt-1 w-full h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm';

  const scheduleColumns = [
    { key: 'period', label: 'Period' },
    { key: 'dueDate', label: 'Due Date', render: v => v ? v.join('-') : '—' },
    { key: 'principalOriginal', label: 'Principal', render: v => v?.toLocaleString() || '—' },
    { key: 'interestOriginal', label: 'Interest', render: v => v?.toLocaleString() || '—' },
    { key: 'totalOriginalInstallmentAmount', label: 'Total', render: v => v?.toLocaleString() || '—' },
    { key: 'principalLoanBalanceOutstanding', label: 'Balance', render: v => v?.toLocaleString() || '—' },
  ];

  return (
    <div className="space-y-5">
      {/* Stepper */}
      <div className="flex items-center gap-2 text-xs">
        <StepBadge num={1} label="Select Product" active={step >= 0} done={step > 0} />
        <ChevronRight className="w-3 h-3 text-slate-600" />
        <StepBadge num={2} label="Loan Details" active={step >= 1} done={step > 1} />
        <ChevronRight className="w-3 h-3 text-slate-600" />
        <StepBadge num={3} label="Preview Schedule" active={step >= 2} done={step > 2} />
      </div>

      {/* Step 0: Select Product */}
      {step === 0 && (
        <div>
          {loadingProducts ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div> : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {products.map(p => (
                <button key={p.id} onClick={() => onProductChange(String(p.id))}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left ${form.productId === String(p.id) ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700/50 bg-slate-800/50 hover:bg-slate-700/50'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><FileText className="w-4 h-4 text-blue-400" /></div>
                    <div>
                      <div className="text-sm text-white font-medium">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.currency?.displayLabel} · {p.principal?.toLocaleString()} · {p.interestRatePerPeriod}%</div>
                    </div>
                  </div>
                  {form.productId === String(p.id) && <Check className="w-4 h-4 text-emerald-400" />}
                </button>
              ))}
            </div>
          )}
          {form.productId && !loadingTemplate && (
            <div className="flex justify-end mt-4">
              <Button onClick={() => setStep(1)} className="bg-emerald-600 hover:bg-emerald-700">Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
            </div>
          )}
          {loadingTemplate && <div className="flex justify-center mt-4"><Loader2 className="w-5 h-5 animate-spin text-emerald-400" /></div>}
        </div>
      )}

      {/* Step 1: Loan Details */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label className="text-slate-300 text-xs">Principal Amount *</Label>
            <Input type="number" value={form.principal} onChange={e => setForm(p => ({ ...p, principal: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <Label className="text-slate-300 text-xs">Loan Purpose</Label>
            <Textarea value={form.loanPurpose} onChange={e => setForm(p => ({ ...p, loanPurpose: e.target.value }))} className={inputCls} placeholder="Describe the purpose of this loan…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300 text-xs">Submitted Date *</Label>
              <Input type="date" value={form.submittedOnDate} onChange={e => setForm(p => ({ ...p, submittedOnDate: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Expected Disbursement Date *</Label>
              <Input type="date" value={form.expectedDisbursementDate} onChange={e => setForm(p => ({ ...p, expectedDisbursementDate: e.target.value }))} className={inputCls} />
            </div>
          </div>
          {template && (
            <div className="bg-slate-800/50 rounded-lg p-3 text-xs text-slate-400 space-y-1">
              <div># Repayments: {template.numberOfRepayments}</div>
              <div>Interest Rate: {template.interestRatePerPeriod}%</div>
              <div>Term: {template.termFrequency} {template.termPeriodFrequencyType?.value}</div>
            </div>
          )}
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(0)} className="text-slate-400">Back</Button>
            <Button onClick={previewSchedule} disabled={loadingSchedule || !form.principal} className="bg-emerald-600 hover:bg-emerald-700">
              {loadingSchedule ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />} Preview Schedule
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Preview Schedule */}
      {step === 2 && schedule && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/50 rounded-lg p-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <div><div className="text-xs text-slate-500">Principal</div><div className="text-sm text-white">{parseFloat(form.principal).toLocaleString()}</div></div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <div><div className="text-xs text-slate-500">Disbursement</div><div className="text-sm text-white">{fmtDate(form.expectedDisbursementDate)}</div></div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <div><div className="text-xs text-slate-500">Total Repayment</div><div className="text-sm text-white">{schedule.totalRepaymentExpected?.toLocaleString() ?? '—'}</div></div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
            <DataTable columns={scheduleColumns} data={schedule.periods || []} emptyMessage="No schedule periods" />
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)} className="text-slate-400">Back</Button>
            <Button onClick={submit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />} Submit Application
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepBadge({ num, label, active, done }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${done ? 'bg-emerald-600 text-white' : active ? 'border-2 border-emerald-500 text-emerald-400' : 'border-2 border-slate-700 text-slate-600'}`}>
        {done ? <Check className="w-3 h-3" /> : num}
      </div>
      <span className={active ? 'text-slate-300' : 'text-slate-600'}>{label}</span>
    </div>
  );
}