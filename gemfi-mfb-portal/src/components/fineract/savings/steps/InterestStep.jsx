import React from 'react';
import ProductFormSection from '@/components/fineract/product/ProductFormSection';
import ProductField from '@/components/fineract/product/ProductField';

const COMPOUNDING_OPTIONS = [
  { id: 1, value: 'Daily' }, { id: 4, value: 'Monthly' },
  { id: 5, value: 'Quarterly' }, { id: 7, value: 'Annually' },
];
const POSTING_OPTIONS = [
  { id: 4, value: 'Monthly' }, { id: 5, value: 'Quarterly' },
  { id: 6, value: 'Bi-Annual' }, { id: 7, value: 'Annually' },
];
const CALC_TYPE_OPTIONS = [
  { id: 1, value: 'Daily Balance' }, { id: 0, value: 'Average Daily Balance' },
];
const DAYS_IN_YEAR_OPTIONS = [
  { id: 360, value: '360 Days' }, { id: 365, value: '365 Days' },
];

export default function InterestStep({ form, set, template }) {
  const selectCls = 'mt-1 w-full h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm';

  return (
    <ProductFormSection title="Interest Calculation">
      <ProductField label="Interest Compounding Period" required>
        <select value={form.interestCompoundingPeriodType} onChange={e => set('interestCompoundingPeriodType', e.target.value)} className={selectCls}>
          {(template?.interestCompoundingPeriodTypeOptions || COMPOUNDING_OPTIONS).map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
        </select>
      </ProductField>
      <ProductField label="Interest Posting Period" required>
        <select value={form.interestPostingPeriodType} onChange={e => set('interestPostingPeriodType', e.target.value)} className={selectCls}>
          {(template?.interestPostingPeriodTypeOptions || POSTING_OPTIONS).map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
        </select>
      </ProductField>
      <ProductField label="Interest Calculation Type" required>
        <select value={form.interestCalculationType} onChange={e => set('interestCalculationType', e.target.value)} className={selectCls}>
          {(template?.interestCalculationTypeOptions || CALC_TYPE_OPTIONS).map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
        </select>
      </ProductField>
      <ProductField label="Days in Year" required>
        <select value={form.interestCalculationDaysInYearType} onChange={e => set('interestCalculationDaysInYearType', e.target.value)} className={selectCls}>
          {(template?.interestCalculationDaysInYearTypeOptions || DAYS_IN_YEAR_OPTIONS).map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
        </select>
      </ProductField>
    </ProductFormSection>
  );
}