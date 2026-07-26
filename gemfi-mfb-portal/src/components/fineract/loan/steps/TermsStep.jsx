import React from 'react';
import { Input } from '@/components/ui/input';
import ProductFormSection from '@/components/fineract/product/ProductFormSection';
import ProductField from '@/components/fineract/product/ProductField';

const FREQ_OPTIONS = [
  { id: 0, value: 'Days' },
  { id: 1, value: 'Weeks' },
  { id: 2, value: 'Months' },
];

export default function TermsStep({ form, set, template }) {
  const inputCls = 'mt-1 bg-slate-800 border-slate-700 text-white';
  const selectCls = 'mt-1 w-full h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm';
  const freqOptions = template?.repaymentFrequencyTypeOptions || FREQ_OPTIONS;

  return (
    <div className="space-y-4">
      <ProductFormSection title="Principal">
        <ProductField label="Principal Amount" required>
          <Input type="number" value={form.principal} onChange={e => set('principal', e.target.value)} className={inputCls} />
        </ProductField>
        <ProductField label="Minimum Principal">
          <Input type="number" value={form.minPrincipal} onChange={e => set('minPrincipal', e.target.value)} className={inputCls} />
        </ProductField>
        <ProductField label="Maximum Principal">
          <Input type="number" value={form.maxPrincipal} onChange={e => set('maxPrincipal', e.target.value)} className={inputCls} />
        </ProductField>
      </ProductFormSection>

      <ProductFormSection title="Repayment">
        <ProductField label="Number of Repayments" required>
          <Input type="number" value={form.numberOfRepayments} onChange={e => set('numberOfRepayments', e.target.value)} className={inputCls} />
        </ProductField>
        <ProductField label="Minimum Repayments">
          <Input type="number" value={form.minNumberOfRepayments} onChange={e => set('minNumberOfRepayments', e.target.value)} className={inputCls} />
        </ProductField>
        <ProductField label="Maximum Repayments">
          <Input type="number" value={form.maxNumberOfRepayments} onChange={e => set('maxNumberOfRepayments', e.target.value)} className={inputCls} />
        </ProductField>
        <ProductField label="Repayment Every" required>
          <Input type="number" value={form.repaymentEvery} onChange={e => set('repaymentEvery', e.target.value)} className={inputCls} />
        </ProductField>
        <ProductField label="Repayment Frequency Type" required>
          <select value={form.repaymentFrequencyType} onChange={e => set('repaymentFrequencyType', e.target.value)} className={selectCls}>
            {freqOptions.map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
          </select>
        </ProductField>
      </ProductFormSection>
    </div>
  );
}