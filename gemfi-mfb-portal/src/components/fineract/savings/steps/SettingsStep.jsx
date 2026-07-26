import React from 'react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import ProductFormSection from '@/components/fineract/product/ProductFormSection';
import ProductField from '@/components/fineract/product/ProductField';

const LOCKIN_TYPE_OPTIONS = [
  { id: 0, value: 'Days' },
  { id: 1, value: 'Weeks' },
  { id: 2, value: 'Months' },
  { id: 3, value: 'Years' },
];

export default function SettingsStep({ form, set, template }) {
  const inputCls = 'mt-1 bg-slate-800 border-slate-700 text-white';
  const selectCls = 'mt-1 w-full h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm';
  const lockinOptions = template?.lockinPeriodFrequencyTypeOptions || template?.termFrequencyTypeOptions || LOCKIN_TYPE_OPTIONS;

  return (
    <div className="space-y-4">
      <ProductFormSection title="Overdraft Settings">
        <div className="col-span-2 flex items-center gap-3">
          <Switch checked={form.allowOverdraft} onCheckedChange={v => set('allowOverdraft', v)} />
          <Label className="text-slate-300 text-sm cursor-pointer" onClick={() => set('allowOverdraft', !form.allowOverdraft)}>
            Allow Overdraft
          </Label>
        </div>
        {form.allowOverdraft && (
          <>
            <ProductField label="Overdraft Limit">
              <Input type="number" value={form.overdraftLimit} onChange={e => set('overdraftLimit', e.target.value)} className={inputCls} />
            </ProductField>
            <ProductField label="Min Overdraft for Interest Calc">
              <Input type="number" value={form.minOverdraftForInterestCalculation} onChange={e => set('minOverdraftForInterestCalculation', e.target.value)} className={inputCls} />
            </ProductField>
          </>
        )}
      </ProductFormSection>

      <ProductFormSection title="Additional Settings">
        <div className="col-span-2 flex items-center gap-3">
          <Switch checked={form.withdrawalFeeForTransfers} onCheckedChange={v => set('withdrawalFeeForTransfers', v)} />
          <Label className="text-slate-300 text-sm cursor-pointer" onClick={() => set('withdrawalFeeForTransfers', !form.withdrawalFeeForTransfers)}>
            Withdrawal Fee for Transfers
          </Label>
        </div>
        <ProductField label="Lock-in Period Frequency">
          <Input type="number" value={form.lockinPeriodFrequency} onChange={e => set('lockinPeriodFrequency', e.target.value)} className={inputCls} />
        </ProductField>
        <ProductField label="Lock-in Period Type">
          <select value={form.lockinPeriodFrequencyType} onChange={e => set('lockinPeriodFrequencyType', e.target.value)} className={selectCls}>
            <option value="">Select type</option>
            {lockinOptions.map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
          </select>
        </ProductField>
      </ProductFormSection>
    </div>
  );
}