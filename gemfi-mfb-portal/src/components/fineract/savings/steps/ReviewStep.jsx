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

export default function ReviewStep({ form, template }) {
  const chargeNames = form.charges.map(id => {
    const c = template?.chargeOptions?.find(co => co.id === id);
    return c?.name || `#${id}`;
  });
  const accRuleLabel = { '1': 'NONE', '2': 'CASH', '3': 'ACCRUAL' }[form.accountingRule] || '—';

  return (
    <div className="space-y-4">
      <ProductFormSection title="Details">
        <div className="col-span-2"><SummaryItem label="Name" value={form.name} /><SummaryItem label="Short Name" value={form.shortName} /><SummaryItem label="Description" value={form.description} /></div>
      </ProductFormSection>
      <ProductFormSection title="Currency">
        <div className="col-span-2"><SummaryItem label="Currency" value={form.currencyCode} /><SummaryItem label="Decimal Places" value={form.digitsAfterDecimal} /><SummaryItem label="Multiples Of" value={form.inMultiplesOf} /></div>
      </ProductFormSection>
      <ProductFormSection title="Terms">
        <div className="col-span-2">
          <SummaryItem label="Interest Rate" value={`${form.nominalAnnualInterestRate}%`} />
          <SummaryItem label="Min Opening Balance" value={form.minRequiredOpeningBalance} />
          <SummaryItem label="Min Required Balance" value={form.minRequiredBalance} />
          <SummaryItem label="Enforce Min Balance" value={form.enforceMinRequiredBalance ? 'Yes' : 'No'} />
        </div>
      </ProductFormSection>
      <ProductFormSection title="Settings">
        <div className="col-span-2">
          <SummaryItem label="Allow Overdraft" value={form.allowOverdraft ? 'Yes' : 'No'} />
          <SummaryItem label="Withdrawal Fee for Transfers" value={form.withdrawalFeeForTransfers ? 'Yes' : 'No'} />
          <SummaryItem label="Lock-in Period" value={form.lockinPeriodFrequency ? `${form.lockinPeriodFrequency} ${lookupEnum(template?.lockinPeriodFrequencyTypeOptions || template?.termFrequencyTypeOptions, form.lockinPeriodFrequencyType)}` : '—'} />
        </div>
      </ProductFormSection>
      <ProductFormSection title="Interest Calculation">
        <div className="col-span-2">
          <SummaryItem label="Compounding Period" value={lookupEnum(template?.interestCompoundingPeriodTypeOptions, form.interestCompoundingPeriodType)} />
          <SummaryItem label="Posting Period" value={lookupEnum(template?.interestPostingPeriodTypeOptions, form.interestPostingPeriodType)} />
          <SummaryItem label="Calculation Type" value={lookupEnum(template?.interestCalculationTypeOptions, form.interestCalculationType)} />
          <SummaryItem label="Days in Year" value={lookupEnum(template?.interestCalculationDaysInYearTypeOptions, form.interestCalculationDaysInYearType)} />
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