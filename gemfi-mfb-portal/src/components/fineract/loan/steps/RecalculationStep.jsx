import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import ProductFormSection from '@/components/fineract/product/ProductFormSection';
import ProductField from '@/components/fineract/product/ProductField';

const COMPOUNDING_OPTIONS = [
  { id: 0, value: 'None' },
  { id: 2, value: 'Fee' },
  { id: 1, value: 'Interest' },
  { id: 3, value: 'Fee and Interest' },
];
const RESCHEDULE_OPTIONS = [
  { id: 3, value: 'Reduce EMI Amount' },
  { id: 2, value: 'Reduce Number of Installments' },
  { id: 1, value: 'Reschedule Next Repayments' },
];
const PRECLOSURE_OPTIONS = [
  { id: 1, value: 'Till Preclose Date' },
  { id: 2, value: 'Till Rest Frequency Date' },
];
const FREQ_OPTIONS = [
  { id: 1, value: 'Same as Repayment Period' },
  { id: 2, value: 'Daily' },
  { id: 3, value: 'Weekly' },
  { id: 4, value: 'Monthly' },
];

export default function RecalculationStep({ form, set, template }) {
  const selectCls = 'mt-1 w-full h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm';
  const tpl = (key, fallback) => template?.[key] || fallback;
  const enabled = form.isInterestRecalculationEnabled;

  return (
    <ProductFormSection title="Interest Recalculation">
      <div className="col-span-2 flex items-center gap-3 mb-2">
        <Switch checked={enabled} onCheckedChange={v => set('isInterestRecalculationEnabled', v)} />
        <Label className="text-slate-300 text-sm cursor-pointer" onClick={() => set('isInterestRecalculationEnabled', !enabled)}>
          Enable Interest Recalculation
        </Label>
      </div>
      {enabled && (
        <>
          <ProductField label="Compounding Type" required>
            <select value={form.interestRecalculationCompoundingType} onChange={e => set('interestRecalculationCompoundingType', e.target.value)} className={selectCls}>
              {tpl('interestRecalculationCompoundingTypeOptions', COMPOUNDING_OPTIONS).map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
            </select>
          </ProductField>
          <ProductField label="Reschedule Strategy" required>
            <select value={form.rescheduleStrategyType} onChange={e => set('rescheduleStrategyType', e.target.value)} className={selectCls}>
              {tpl('rescheduleStrategyTypeOptions', RESCHEDULE_OPTIONS).map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
            </select>
          </ProductField>
          <ProductField label="Pre-closure Interest Calculation" required>
            <select value={form.preClosureInterestCalculationStrategy} onChange={e => set('preClosureInterestCalculationStrategy', e.target.value)} className={selectCls}>
              {tpl('preClosureInterestCalculationStrategyOptions', PRECLOSURE_OPTIONS).map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
            </select>
          </ProductField>
          {form.interestRecalculationCompoundingType !== '0' && (
            <ProductField label="Recalculation Frequency" required>
              <select value={form.interestRecalculationFrequencyType} onChange={e => set('interestRecalculationFrequencyType', e.target.value)} className={selectCls}>
                {tpl('interestRecalculationFrequencyTypeOptions', FREQ_OPTIONS).map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
              </select>
            </ProductField>
          )}
        </>
      )}
    </ProductFormSection>
  );
}