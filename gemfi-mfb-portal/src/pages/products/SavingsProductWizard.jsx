import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { fineractApi } from '@/lib/fineract';
import { ArrowLeft, Loader2, Check, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import PageHeader from '@/components/fineract/PageHeader';
import DetailsStep from '@/components/fineract/savings/steps/DetailsStep';
import CurrencyStep from '@/components/fineract/savings/steps/CurrencyStep';
import TermsStep from '@/components/fineract/savings/steps/TermsStep';
import SettingsStep from '@/components/fineract/savings/steps/SettingsStep';
import InterestStep from '@/components/fineract/savings/steps/InterestStep';
import ChargesStep from '@/components/fineract/savings/steps/ChargesStep';
import AccountingStep from '@/components/fineract/savings/steps/AccountingStep';
import ReviewStep from '@/components/fineract/savings/steps/ReviewStep';

const STEPS = ['Details', 'Currency', 'Terms', 'Settings', 'Interest', 'Charges', 'Accounting', 'Review'];
const DRAFT_KEY = 'savings_product_draft';

function mapProductToForm(p) {
  return {
    name: p.name || '', shortName: p.shortName || '', description: p.description || '',
    currencyCode: p.currency?.code || 'USD',
    digitsAfterDecimal: String(p.currency?.decimalPlaces ?? 2),
    inMultiplesOf: String(p.currency?.inMultiplesOf ?? 1),
    nominalAnnualInterestRate: String(p.nominalAnnualInterestRate ?? '5'),
    minRequiredOpeningBalance: p.minRequiredOpeningBalance != null ? String(p.minRequiredOpeningBalance) : '',
    minRequiredBalance: p.minRequiredBalance != null ? String(p.minRequiredBalance) : '',
    enforceMinRequiredBalance: p.enforceMinRequiredBalance ?? false,
    allowOverdraft: p.allowOverdraft ?? false,
    overdraftLimit: p.overdraftLimit != null ? String(p.overdraftLimit) : '',
    minOverdraftForInterestCalculation: p.minOverdraftForInterestCalculation != null ? String(p.minOverdraftForInterestCalculation) : '',
    withdrawalFeeForTransfers: p.withdrawalFeeForTransfers ?? false,
    lockinPeriodFrequency: p.lockinPeriodFrequency != null ? String(p.lockinPeriodFrequency) : '',
    lockinPeriodFrequencyType: p.lockinPeriodFrequencyType?.id != null ? String(p.lockinPeriodFrequencyType.id) : '',
    interestCompoundingPeriodType: String(p.interestCompoundingPeriodType?.id ?? '1'),
    interestPostingPeriodType: String(p.interestPostingPeriodType?.id ?? '4'),
    interestCalculationType: String(p.interestCalculationType?.id ?? '1'),
    interestCalculationDaysInYearType: String(p.interestCalculationDaysInYearType?.id ?? '365'),
    charges: (p.charges || []).map(c => c.id),
    accountingRule: String(p.accountingRule?.id ?? '1'),
    accountingMappings: {
      savingsReferenceAccount: p.accountingMappings?.savingsReferenceAccount?.id || '',
      overdraftPortfolioAccount: p.accountingMappings?.overdraftPortfolioAccount?.id || '',
      feesReceivableAccount: p.accountingMappings?.feesReceivableAccount?.id || '',
      penaltiesReceivableAccount: p.accountingMappings?.penaltiesReceivableAccount?.id || '',
      savingsControlAccount: p.accountingMappings?.savingsControlAccount?.id || '',
      savingsTransferInSuspenseAccount: p.accountingMappings?.savingsTransferInSuspenseAccount?.id || '',
      interestPayableAccount: p.accountingMappings?.interestPayableAccount?.id || '',
      interestOnSavingsAccount: p.accountingMappings?.interestOnSavingsAccount?.id || '',
      writeOffAccount: p.accountingMappings?.writeOffAccount?.id || '',
      incomeFromFeeAccount: p.accountingMappings?.incomeFromFeeAccount?.id || '',
      incomeFromPenaltyAccount: p.accountingMappings?.incomeFromPenaltyAccount?.id || '',
      overdraftInterestIncomeAccount: p.accountingMappings?.overdraftInterestIncomeAccount?.id || '',
    },
  };
}

export default function SavingsProductWizard() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id;
  const duplicateId = location.state?.duplicateId;

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(isEdit || !!duplicateId);
  const [submitting, setSubmitting] = useState(false);
  const [template, setTemplate] = useState(null);
  const [accountingValid, setAccountingValid] = useState(true);
  const [form, setForm] = useState({
    name: '', shortName: '', description: '',
    currencyCode: 'USD', digitsAfterDecimal: '2', inMultiplesOf: '1',
    nominalAnnualInterestRate: '5',
    minRequiredOpeningBalance: '', minRequiredBalance: '', enforceMinRequiredBalance: false,
    allowOverdraft: false, overdraftLimit: '', minOverdraftForInterestCalculation: '',
    withdrawalFeeForTransfers: false,
    lockinPeriodFrequency: '', lockinPeriodFrequencyType: '',
    interestCompoundingPeriodType: '1', interestPostingPeriodType: '4',
    interestCalculationType: '1', interestCalculationDaysInYearType: '365',
    charges: [],
    accountingRule: '1',
    accountingMappings: {
      savingsReferenceAccount: '', overdraftPortfolioAccount: '',
      feesReceivableAccount: '', penaltiesReceivableAccount: '',
      savingsControlAccount: '', savingsTransferInSuspenseAccount: '',
      interestPayableAccount: '',
      interestOnSavingsAccount: '', writeOffAccount: '',
      incomeFromFeeAccount: '', incomeFromPenaltyAccount: '',
      overdraftInterestIncomeAccount: '',
    },
  });

  const set = useCallback((k, v) => setForm(p => ({ ...p, [k]: v })), []);

  useEffect(() => {
    fineractApi('/savingsproducts/template').then(setTemplate).catch(() => {});
    const productId = id || duplicateId;
    if (productId) {
      fineractApi(`/savingsproducts/${productId}`).then(p => setForm(mapProductToForm(p)))
        .catch(err => toast({ title: 'Error', description: err.message, variant: 'destructive' }))
        .finally(() => setLoading(false));
    } else {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) { try { setForm(JSON.parse(draft)); toast({ title: 'Draft restored' }); } catch {} }
      setLoading(false);
    }
  }, [id, duplicateId]);

  const validateStep = (idx) => {
    switch (idx) {
      case 0: return !!form.name.trim() && !!form.shortName.trim();
      case 1: return !!form.currencyCode && form.digitsAfterDecimal !== '';
      case 2: return form.nominalAnnualInterestRate !== '';
      case 3: return true;
      case 4: return !!form.interestCompoundingPeriodType && !!form.interestPostingPeriodType && !!form.interestCalculationType && !!form.interestCalculationDaysInYearType;
      case 5: return true;
      case 6: return accountingValid;
      default: return true;
    }
  };

  const handleNext = () => { if (validateStep(step) && step < STEPS.length - 1) setStep(step + 1); };
  const handlePrev = () => { if (step > 0) setStep(step - 1); };
  const handleSaveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    toast({ title: 'Draft saved' });
  };

  const buildPayload = () => {
    const p = {
      locale: 'en',
      name: form.name.trim(), shortName: form.shortName.trim(), description: form.description.trim(),
      currencyCode: form.currencyCode,
      digitsAfterDecimal: parseInt(form.digitsAfterDecimal),
      inMultiplesOf: parseInt(form.inMultiplesOf),
      nominalAnnualInterestRate: parseFloat(form.nominalAnnualInterestRate),
      interestCompoundingPeriodType: parseInt(form.interestCompoundingPeriodType),
      interestPostingPeriodType: parseInt(form.interestPostingPeriodType),
      interestCalculationType: parseInt(form.interestCalculationType),
      interestCalculationDaysInYearType: parseInt(form.interestCalculationDaysInYearType),
      enforceMinRequiredBalance: form.enforceMinRequiredBalance,
      allowOverdraft: form.allowOverdraft,
      withdrawalFeeForTransfers: form.withdrawalFeeForTransfers,
      accountingRule: parseInt(form.accountingRule),
    };
    if (form.minRequiredOpeningBalance) p.minRequiredOpeningBalance = parseFloat(form.minRequiredOpeningBalance);
    if (form.minRequiredBalance) p.minRequiredBalance = parseFloat(form.minRequiredBalance);
    if (form.allowOverdraft) {
      if (form.overdraftLimit) p.overdraftLimit = parseFloat(form.overdraftLimit);
      if (form.minOverdraftForInterestCalculation) p.minOverdraftForInterestCalculation = parseFloat(form.minOverdraftForInterestCalculation);
    }
    if (form.lockinPeriodFrequency) { p.lockinPeriodFrequency = parseInt(form.lockinPeriodFrequency); p.lockinPeriodFrequencyType = parseInt(form.lockinPeriodFrequencyType); }
    if (form.charges.length > 0) p.charges = form.charges.map(cid => ({ id: cid }));
    // Fineract expects flat root-level keys with "Id" suffix — NOT a nested object.
    // For NONE (1), omit all mapping fields entirely.
    const CASH_FIELDS = {
      savingsReferenceAccount: 'savingsReferenceAccountId',
      savingsControlAccount: 'savingsControlAccountId',
      interestOnSavingsAccount: 'interestOnSavingsAccountId',
      incomeFromFeeAccount: 'incomeFromFeeAccountId',
      incomeFromPenaltyAccount: 'incomeFromPenaltyAccountId',
    };
    const ACCRUAL_ONLY_FIELDS = {
      feesReceivableAccount: 'feesReceivableAccountId',
      penaltiesReceivableAccount: 'penaltiesReceivableAccountId',
      interestPayableAccount: 'interestPayableAccountId',
      writeOffAccount: 'writeOffAccountId',
    };
    // These three are overdraft-specific — Fineract rejects them unless allowOverdraft=true
    const OVERDRAFT_FIELDS = {
      overdraftPortfolioAccount: 'overdraftPortfolioAccountId',
      overdraftInterestIncomeAccount: 'overdraftInterestIncomeAccountId',
      savingsTransferInSuspenseAccount: 'savingsTransferInSuspenseAccountId',
    };
    const allFields = form.accountingRule === '3'
      ? { ...CASH_FIELDS, ...ACCRUAL_ONLY_FIELDS, ...(form.allowOverdraft ? OVERDRAFT_FIELDS : {}) }
      : CASH_FIELDS;
    if (form.accountingRule === '2' || form.accountingRule === '3') {
      Object.entries(allFields).forEach(([k, payloadKey]) => {
        const v = form.accountingMappings?.[k];
        if (v) p[payloadKey] = parseInt(v);
      });
    }
    return p;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = buildPayload();
      if (isEdit) {
        await fineractApi(`/savingsproducts/${id}`, { method: 'PUT', body: payload });
        toast({ title: 'Savings product updated successfully' });
      } else {
        await fineractApi('/savingsproducts', { method: 'POST', body: payload });
        toast({ title: 'Savings product created successfully' });
      }
      localStorage.removeItem(DRAFT_KEY);
      navigate('/products/savings');
    } catch (err) {
      toast({ title: 'Validation Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>;

  const stepProps = { form, set, template };
  const stepComponents = [
    <DetailsStep {...stepProps} />,
    <CurrencyStep {...stepProps} />,
    <TermsStep {...stepProps} />,
    <SettingsStep {...stepProps} />,
    <InterestStep {...stepProps} />,
    <ChargesStep {...stepProps} />,
    <AccountingStep form={form} set={set} template={template} onValidationChange={setAccountingValid} />,
    <ReviewStep form={form} template={template} />,
  ];

  const isLastStep = step === STEPS.length - 1;
  const canProceed = validateStep(step);

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto pb-24">
      <button onClick={() => navigate('/products/savings')} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Savings Products
      </button>
      <PageHeader title={isEdit ? 'Edit Savings Product' : 'Create Savings Product'} description="Configure a savings product for Apache Fineract" />

      {/* Stepper */}
      <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
        {STEPS.map((label, idx) => (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors ${
                idx < step ? 'bg-emerald-600 border-emerald-600 text-white' :
                idx === step ? 'border-emerald-500 text-emerald-400 bg-slate-800' :
                'border-slate-700 text-slate-600 bg-slate-800'
              }`}>
                {idx < step ? <Check className="w-4 h-4" /> : idx + 1}
              </div>
              <span className={`text-xs mt-1 whitespace-nowrap ${idx <= step ? 'text-slate-300' : 'text-slate-600'}`}>{label}</span>
            </div>
            {idx < STEPS.length - 1 && <div className={`h-0.5 flex-1 mx-1 min-w-[12px] ${idx < step ? 'bg-emerald-600' : 'bg-slate-700'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="mb-6">{stepComponents[step]}</div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleSaveDraft} className="text-slate-400">
          <Save className="w-4 h-4 mr-2" /> Save Draft
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrev} disabled={step === 0} className="border-slate-600 text-slate-300">
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          {isLastStep ? (
            <Button onClick={handleSubmit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />} Finish
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canProceed} className="bg-emerald-600 hover:bg-emerald-700">
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}