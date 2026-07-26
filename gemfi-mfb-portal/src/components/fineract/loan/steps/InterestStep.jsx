import React from 'react';
import { Input } from '@/components/ui/input';
import ProductFormSection from '@/components/fineract/product/ProductFormSection';
import ProductField from '@/components/fineract/product/ProductField';

const INTEREST_FREQ_OPTIONS = [
  { id: 2, value: 'Per Month' },
  { id: 3, value: 'Per Year' },
  { id: 0, value: 'Per Day' },
  { id: 1, value: 'Per Week' },
];
const AMORTIZATION_OPTIONS = [
  { id: 1, value: 'Equal Installments' },
  { id: 0, value: 'Equal Principal' },
];
const INTEREST_TYPE_OPTIONS = [
  { id: 0, value: 'Declining Balance' },
  { id: 1, value: 'Flat' },
];
const INTEREST_CALC_PERIOD_OPTIONS = [
  { id: 1, value: 'Same as Repayment Period' },
  { id: 0, value: 'Daily' },
];

export default function InterestStep({ form, set, template }) {
  const inputCls = 'mt-1 bg-slate-800 border-slate-700 text-white';
  const selectCls = 'mt-1 w-full h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm';
  const tpl = (key, fallback) => template?.[key] || fallback;

  return (
    <div className="space-y-4">
      <ProductFormSection title="Interest Rate">
        <ProductField label="Interest Rate Per Period" required>
          <Input type="number" step="0.01" value={form.interestRatePerPeriod} onChange={e => set('interestRatePerPeriod', e.target.value)} className={inputCls} />
        </ProductField>
        <ProductField label="Minimum Interest Rate">
          <Input type="number" step="0.01" value={form.minInterestRatePerPeriod} onChange={e => set('minInterestRatePerPeriod', e.target.value)} className={inputCls} />
        </ProductField>
        <ProductField label="Maximum Interest Rate">
          <Input type="number" step="0.01" value={form.maxInterestRatePerPeriod} onChange={e => set('maxInterestRatePerPeriod', e.target.value)} className={inputCls} />
        </ProductField>
        <ProductField label="Interest Rate Frequency Type" required>
          <select value={form.interestRateFrequencyType} onChange={e => set('interestRateFrequencyType', e.target.value)} className={selectCls}>
            {tpl('interestRateFrequencyTypeOptions', INTEREST_FREQ_OPTIONS).map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
          </select>
        </ProductField>
      </ProductFormSection>

      <ProductFormSection title="Loan Calculation">
        <ProductField label="Amortization Type" required>
          <select value={form.amortizationType} onChange={e => set('amortizationType', e.target.value)} className={selectCls}>
            {tpl('amortizationTypeOptions', AMORTIZATION_OPTIONS).map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
          </select>
        </ProductField>
        <ProductField label="Interest Type" required>
          <select value={form.interestType} onChange={e => set('interestType', e.target.value)} className={selectCls}>
            {tpl('interestTypeOptions', INTEREST_TYPE_OPTIONS).map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
          </select>
        </ProductField>
        <ProductField label="Interest Calculation Period" required>
          <select value={form.interestCalculationPeriodType} onChange={e => set('interestCalculationPeriodType', e.target.value)} className={selectCls}>
            {tpl('interestCalculationPeriodTypeOptions', INTEREST_CALC_PERIOD_OPTIONS).map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
          </select>
        </ProductField>
      </ProductFormSection>
    </div>
  );
}