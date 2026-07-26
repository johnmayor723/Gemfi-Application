import React from 'react';
import ProductFormSection from '@/components/fineract/product/ProductFormSection';

function SummaryItem({ label, value }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-slate-700/30">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-sm text-white text-right max-w-[60%]">{value || '—'}</span>
    </div>
  );
}

const lookupEnum = (options, id) => {
  const opt = options?.find(o => String(o.id) === String(id));
  return opt?.value || opt?.name || '—';
};
const lookupStrategy = (options, code) => {
  const opt = options?.find(o => o.code === code);
  return opt?.name || code || '—';
};

export default function ReviewStep({ form, template }) {
  const chargeNames = form.charges.map(id => {
    const c = template?.chargeOptions?.find(co => co.id === id);
    return c?.name || `#${id}`;
  });
  const accRuleLabel = { '1': 'NONE', '2': 'CASH', '3': 'ACCRUAL' }[form.accountingRule] || '—';

  return (
    <div className="space-y-4">
      <ProductFormSection title="Details">
        <div className="col-span-2">
          <SummaryItem label="Name" value={form.name} />
          <SummaryItem label="Short Name" value={form.shortName} />
          <SummaryItem label="Description" value={form.description} />
          <SummaryItem label="Include in Borrower Cycle" value={form.includeInBorrowerCycle ? 'Yes' : 'No'} />
          <SummaryItem label="Use Borrower Cycle" value={form.useBorrowerCycle ? 'Yes' : 'No'} />
        </div>
      </ProductFormSection>
      <ProductFormSection title="Currency">
        <div className="col-span-2">
          <SummaryItem label="Currency" value={form.currencyCode} />
          <SummaryItem label="Decimal Places" value={form.digitsAfterDecimal} />
          <SummaryItem label="Multiples Of" value={form.inMultiplesOf} />
        </div>
      </ProductFormSection>
      <ProductFormSection title="Terms">
        <div className="col-span-2">
          <SummaryItem label="Principal" value={form.principal} />
          <SummaryItem label="Min Principal" value={form.minPrincipal} />
          <SummaryItem label="Max Principal" value={form.maxPrincipal} />
          <SummaryItem label="Number of Repayments" value={form.numberOfRepayments} />
          <SummaryItem label="Repayment Every" value={`${form.repaymentEvery} ${lookupEnum(template?.repaymentFrequencyTypeOptions, form.repaymentFrequencyType)}`} />
        </div>
      </ProductFormSection>
      <ProductFormSection title="Interest">
        <div className="col-span-2">
          <SummaryItem label="Interest Rate" value={`${form.interestRatePerPeriod}%`} />
          <SummaryItem label="Interest Freq" value={lookupEnum(template?.interestRateFrequencyTypeOptions, form.interestRateFrequencyType)} />
          <SummaryItem label="Amortization" value={lookupEnum(template?.amortizationTypeOptions, form.amortizationType)} />
          <SummaryItem label="Interest Type" value={lookupEnum(template?.interestTypeOptions, form.interestType)} />
          <SummaryItem label="Calc Period" value={lookupEnum(template?.interestCalculationPeriodTypeOptions, form.interestCalculationPeriodType)} />
        </div>
      </ProductFormSection>
      <ProductFormSection title="Settings">
        <div className="col-span-2">
          <SummaryItem label="Days in Month" value={lookupEnum(template?.daysInMonthTypeOptions, form.daysInMonthType)} />
          <SummaryItem label="Days in Year" value={lookupEnum(template?.daysInYearTypeOptions, form.daysInYearType)} />
          <SummaryItem label="Processing Strategy" value={lookupStrategy(template?.transactionProcessingStrategyOptions, form.transactionProcessingStrategyCode)} />
          <SummaryItem label="Recalculation Enabled" value={form.isInterestRecalculationEnabled ? 'Yes' : 'No'} />
          {form.isInterestRecalculationEnabled && (
            <>
              <SummaryItem label="Compounding Type" value={lookupEnum(template?.interestRecalculationCompoundingTypeOptions, form.interestRecalculationCompoundingType)} />
              <SummaryItem label="Reschedule Strategy" value={lookupEnum(template?.rescheduleStrategyTypeOptions, form.rescheduleStrategyType)} />
              <SummaryItem label="Pre-closure Strategy" value={lookupEnum(template?.preClosureInterestCalculationStrategyOptions, form.preClosureInterestCalculationStrategy)} />
            </>
          )}
        </div>
      </ProductFormSection>
      <ProductFormSection title="Charges">
        <div className="col-span-2"><SummaryItem label="Selected Charges" value={chargeNames.length ? chargeNames.join(', ') : 'None'} /></div>
      </ProductFormSection>
      <ProductFormSection title="Accounting">
        <div className="col-span-2">
          <SummaryItem label="Accounting Rule" value={accRuleLabel} />
          {(form.accountingRule === '2' || form.accountingRule === '3') && Object.entries(form.accountingMappings).filter(([, v]) => v).map(([k, v]) => (
            <SummaryItem key={k} label={k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())} value={`GL #${v}`} />
          ))}
        </div>
      </ProductFormSection>
    </div>
  );
}