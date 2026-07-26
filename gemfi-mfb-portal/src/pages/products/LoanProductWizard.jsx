import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fineractApi } from '@/lib/fineract';
import { ArrowLeft, Loader2, Check, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import PageHeader from '@/components/fineract/PageHeader';
import DetailsStep from '@/components/fineract/loan/steps/DetailsStep';
import CurrencyStep from '@/components/fineract/loan/steps/CurrencyStep';
import TermsStep from '@/components/fineract/loan/steps/TermsStep';
import InterestStep from '@/components/fineract/loan/steps/InterestStep';
import SettingsStep from '@/components/fineract/loan/steps/SettingsStep';
import RecalculationStep from '@/components/fineract/loan/steps/RecalculationStep';
import ChargesStep from '@/components/fineract/loan/steps/ChargesStep';
import AccountingStep from '@/components/fineract/loan/steps/AccountingStep';
import ReviewStep from '@/components/fineract/loan/steps/ReviewStep';

const STEPS = ['Details', 'Currency', 'Terms', 'Interest', 'Settings', 'Recalculation', 'Charges', 'Accounting', 'Review'];
const DRAFT_KEY = 'loan_product_draft';

function mapProductToForm(p) {
  return {
    name: p.name || '', shortName: p.shortName || '', description: p.description || '',
    currencyCode: p.currency?.code || 'USD',
    digitsAfterDecimal: String(p.currency?.decimalPlaces ?? 2),
    inMultiplesOf: String(p.currency?.inMultiplesOf ?? 1),
    principal: String(p.principal ?? ''),
    minPrincipal: p.minPrincipal != null ? String(p.minPrincipal) : '',
    maxPrincipal: p.maxPrincipal != null ? String(p.maxPrincipal) : '',
    numberOfRepayments: String(p.numberOfRepayments ?? ''),
    minNumberOfRepayments: p.minNumberOfRepayments != null ? String(p.minNumberOfRepayments) : '',
    maxNumberOfRepayments: p.maxNumberOfRepayments != null ? String(p.maxNumberOfRepayments) : '',
    repaymentEvery: String(p.repaymentEvery ?? '1'),
    repaymentFrequencyType: String(p.repaymentFrequencyType?.id ?? '2'),
    interestRatePerPeriod: String(p.interestRatePerPeriod ?? ''),
    minInterestRatePerPeriod: p.minInterestRatePerPeriod != null ? String(p.minInterestRatePerPeriod) : '',
    maxInterestRatePerPeriod: p.maxInterestRatePerPeriod != null ? String(p.maxInterestRatePerPeriod) : '',
    interestRateFrequencyType: String(p.interestRateFrequencyType?.id ?? '2'),
    amortizationType: String(p.amortizationType?.id ?? '1'),
    interestType: String(p.interestType?.id ?? '0'),
    interestCalculationPeriodType: String(p.interestCalculationPeriodType?.id ?? '1'),
    daysInMonthType: String(p.daysInMonthType?.id ?? '1'),
    daysInYearType: String(p.daysInYearType?.id ?? '1'),
    transactionProcessingStrategyCode: p.transactionProcessingStrategy?.code || 'mifos-standard-strategy',
    repaymentStartDateType: String(p.repaymentStartDateType?.id ?? '1'),
    includeInBorrowerCycle: p.includeInBorrowerCycle ?? false,
    useBorrowerCycle: p.useBorrowerCycle ?? false,
    canUseForTopup: p.canUseForTopup ?? false,
    allowVariableInstallments: p.allowVariableInstallments ?? false,
    isInterestRecalculationEnabled: p.isInterestRecalculationEnabled ?? false,
    interestRecalculationCompoundingType: String(p.interestRecalculationData?.interestRecalculationCompoundingType?.id ?? '0'),
    rescheduleStrategyType: String(p.interestRecalculationData?.rescheduleStrategyType?.id ?? '3'),
    preClosureInterestCalculationStrategy: String(p.interestRecalculationData?.preClosureInterestCalculationStrategy?.id ?? '1'),
    interestRecalculationFrequencyType: String(p.interestRecalculationData?.interestRecalculationFrequencyType?.id ?? '1'),
    charges: (p.charges || []).map(c => c.id),
    accountingRule: String(p.accountingRule?.id ?? '1'),
    accountingMappings: {
      fundSource: p.accountingMappings?.fundSourceAccount?.id || '',
      loanPortfolio: p.accountingMappings?.loanPortfolioAccount?.id || '',
      transfersInSuspense: p.accountingMappings?.transfersInSuspenseAccount?.id || '',
      interestOnLoan: p.accountingMappings?.interestOnLoanAccount?.id || '',
      incomeFromFee: p.accountingMappings?.incomeFromFeeAccount?.id || '',
      incomeFromPenalty: p.accountingMappings?.incomeFromPenaltyAccount?.id || '',
      incomeFromRecovery: p.accountingMappings?.incomeFromRecoveryAccount?.id || '',
      overpaymentLiability: p.accountingMappings?.overpaymentLiabilityAccount?.id || '',
      writeOff: p.accountingMappings?.writeOffAccount?.id || '',
      receivableInterest: p.accountingMappings?.receivableInterestAccount?.id || '',
      receivableFee: p.accountingMappings?.receivableFeeAccount?.id || '',
      receivablePenalty: p.accountingMappings?.receivablePenaltyAccount?.id || '',
    },
  };
}

export default function LoanProductWizard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id;

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [template, setTemplate] = useState(null);
  const [accountingValid, setAccountingValid] = useState(true);
  const [form, setForm] = useState({
    name: '', shortName: '', description: '',
    currencyCode: 'USD', digitsAfterDecimal: '2', inMultiplesOf: '1',
    principal: '100000', minPrincipal: '', maxPrincipal: '',
    numberOfRepayments: '12', minNumberOfRepayments: '', maxNumberOfRepayments: '',
    repaymentEvery: '1', repaymentFrequencyType: '2',
    interestRatePerPeriod: '5', minInterestRatePerPeriod: '', maxInterestRatePerPeriod: '',
    interestRateFrequencyType: '2',
    amortizationType: '1', interestType: '0', interestCalculationPeriodType: '1',
    daysInMonthType: '1', daysInYearType: '1',
    transactionProcessingStrategyCode: 'mifos-standard-strategy',
    repaymentStartDateType: '1',
    includeInBorrowerCycle: false, useBorrowerCycle: false,
    canUseForTopup: false, allowVariableInstallments: false,
    isInterestRecalculationEnabled: false,
    interestRecalculationCompoundingType: '0', rescheduleStrategyType: '3',
    preClosureInterestCalculationStrategy: '1', interestRecalculationFrequencyType: '1',
    charges: [],
    accountingRule: '1',
    accountingMappings: {
      fundSource: '', loanPortfolio: '', transfersInSuspense: '',
      interestOnLoan: '', incomeFromFee: '', incomeFromPenalty: '',
      incomeFromRecovery: '', overpaymentLiability: '', writeOff: '',
      receivableInterest: '', receivableFee: '', receivablePenalty: '',
    },
  });

  const set = useCallback((k, v) => setForm(p => ({ ...p, [k]: v })), []);

  useEffect(() => {
    fineractApi('/loanproducts/template').then(setTemplate).catch(() => {});
    if (isEdit) {
      fineractApi(`/loanproducts/${id}`).then(p => setForm(mapProductToForm(p)))
        .catch(err => toast({ title: 'Error', description: err.message, variant: 'destructive' }))
        .finally(() => setLoading(false));
    } else {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) { try { setForm(JSON.parse(draft)); toast({ title: 'Draft restored' }); } catch {} }
      setLoading(false);
    }
  }, [id]);

  const validateStep = (idx) => {
    switch (idx) {
      case 0: return !!form.name.trim() && !!form.shortName.trim();
      case 1: return !!form.currencyCode && form.digitsAfterDecimal !== '';
      case 2: return form.principal !== '' && form.numberOfRepayments !== '' && form.repaymentEvery !== '';
      case 3: return form.interestRatePerPeriod !== '';
      case 4: return true;
      case 5: return !form.isInterestRecalculationEnabled || !!form.interestRecalculationCompoundingType;
      case 6: return true;
      case 7: return accountingValid;
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
      name: form.name.trim(),
      shortName: form.shortName.trim(),
      description: form.description.trim(),
      currencyCode: form.currencyCode,
      digitsAfterDecimal: parseInt(form.digitsAfterDecimal),
      inMultiplesOf: parseInt(form.inMultiplesOf),
      principal: parseFloat(form.principal),
      numberOfRepayments: parseInt(form.numberOfRepayments),
      repaymentEvery: parseInt(form.repaymentEvery),
      repaymentFrequencyType: parseInt(form.repaymentFrequencyType),
      interestRatePerPeriod: parseFloat(form.interestRatePerPeriod),
      interestRateFrequencyType: parseInt(form.interestRateFrequencyType),
      amortizationType: parseInt(form.amortizationType),
      interestType: parseInt(form.interestType),
      interestCalculationPeriodType: parseInt(form.interestCalculationPeriodType),
      daysInMonthType: parseInt(form.daysInMonthType),
      daysInYearType: parseInt(form.daysInYearType),
      transactionProcessingStrategyCode: form.transactionProcessingStrategyCode,
      repaymentStartDateType: parseInt(form.repaymentStartDateType),
      includeInBorrowerCycle: form.includeInBorrowerCycle,
      useBorrowerCycle: form.useBorrowerCycle,
      canUseForTopup: form.canUseForTopup,
      allowVariableInstallments: form.allowVariableInstallments,
      isInterestRecalculationEnabled: form.isInterestRecalculationEnabled,
      accountingRule: parseInt(form.accountingRule),
    };
    if (form.minPrincipal) p.minPrincipal = parseFloat(form.minPrincipal);
    if (form.maxPrincipal) p.maxPrincipal = parseFloat(form.maxPrincipal);
    if (form.minNumberOfRepayments) p.minNumberOfRepayments = parseInt(form.minNumberOfRepayments);
    if (form.maxNumberOfRepayments) p.maxNumberOfRepayments = parseInt(form.maxNumberOfRepayments);
    if (form.minInterestRatePerPeriod) p.minInterestRatePerPeriod = parseFloat(form.minInterestRatePerPeriod);
    if (form.maxInterestRatePerPeriod) p.maxInterestRatePerPeriod = parseFloat(form.maxInterestRatePerPeriod);
    if (form.charges.length > 0) p.charges = form.charges.map(cid => ({ id: cid }));
    if (form.isInterestRecalculationEnabled) {
      p.interestRecalculationData = {
        interestRecalculationCompoundingType: parseInt(form.interestRecalculationCompoundingType),
        rescheduleStrategyType: parseInt(form.rescheduleStrategyType),
        preClosureInterestCalculationStrategy: parseInt(form.preClosureInterestCalculationStrategy),
      };
      if (form.interestRecalculationCompoundingType !== '0') {
        p.interestRecalculationData.interestRecalculationFrequencyType = parseInt(form.interestRecalculationFrequencyType);
      }
    }
    // Fineract expects flat root-level keys with "AccountId" suffix using the
    // internal GL Account ID (NOT the GL Code). For NONE (1), omit all mapping
    // fields entirely. lossesWrittenOffAccountId is NOT supported — never send it.
    const CASH_FIELDS = {
      fundSource: 'fundSourceAccountId',
      loanPortfolio: 'loanPortfolioAccountId',
      transfersInSuspense: 'transfersInSuspenseAccountId',
      interestOnLoan: 'interestOnLoanAccountId',
      incomeFromFee: 'incomeFromFeeAccountId',
      incomeFromPenalty: 'incomeFromPenaltyAccountId',
      incomeFromRecovery: 'incomeFromRecoveryAccountId',
      overpaymentLiability: 'overpaymentLiabilityAccountId',
      writeOff: 'writeOffAccountId',
    };
    const ACCRUAL_ONLY_FIELDS = {
      receivableInterest: 'receivableInterestAccountId',
      receivableFee: 'receivableFeeAccountId',
      receivablePenalty: 'receivablePenaltyAccountId',
    };
    const allFields = form.accountingRule === '3' ? { ...CASH_FIELDS, ...ACCRUAL_ONLY_FIELDS } : CASH_FIELDS;
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
        await fineractApi(`/loanproducts/${id}`, { method: 'PUT', body: payload });
        toast({ title: 'Loan product updated successfully' });
      } else {
        await fineractApi('/loanproducts', { method: 'POST', body: payload });
        toast({ title: 'Loan product created successfully' });
      }
      localStorage.removeItem(DRAFT_KEY);
      navigate('/products/loan');
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
    <InterestStep {...stepProps} />,
    <SettingsStep {...stepProps} />,
    <RecalculationStep {...stepProps} />,
    <ChargesStep {...stepProps} />,
    <AccountingStep form={form} set={set} template={template} onValidationChange={setAccountingValid} />,
    <ReviewStep form={form} template={template} />,
  ];

  const isLastStep = step === STEPS.length - 1;
  const canProceed = validateStep(step);

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto pb-24">
      <button onClick={() => navigate('/products/loan')} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Loan Products
      </button>
      <PageHeader title={isEdit ? 'Edit Loan Product' : 'Create Loan Product'} description="Configure a loan product for Apache Fineract" />

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