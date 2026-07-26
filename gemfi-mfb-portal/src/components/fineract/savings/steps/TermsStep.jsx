import React from 'react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import ProductFormSection from '@/components/fineract/product/ProductFormSection';
import ProductField from '@/components/fineract/product/ProductField';

export default function TermsStep({ form, set }) {
  const inputCls = 'mt-1 bg-slate-800 border-slate-700 text-white';
  return (
    <ProductFormSection title="Terms">
      <ProductField label="Nominal Annual Interest Rate" required>
        <Input type="number" step="0.01" value={form.nominalAnnualInterestRate} onChange={e => set('nominalAnnualInterestRate', e.target.value)} className={inputCls} />
      </ProductField>
      <ProductField label="Min Opening Balance">
        <Input type="number" value={form.minRequiredOpeningBalance} onChange={e => set('minRequiredOpeningBalance', e.target.value)} className={inputCls} />
      </ProductField>
      <ProductField label="Min Required Balance">
        <Input type="number" value={form.minRequiredBalance} onChange={e => set('minRequiredBalance', e.target.value)} className={inputCls} />
      </ProductField>
      <div className="col-span-2 flex items-center gap-3 mt-2">
        <Switch checked={form.enforceMinRequiredBalance} onCheckedChange={v => set('enforceMinRequiredBalance', v)} />
        <Label className="text-slate-300 text-sm cursor-pointer" onClick={() => set('enforceMinRequiredBalance', !form.enforceMinRequiredBalance)}>
          Enforce Minimum Required Balance
        </Label>
      </div>
    </ProductFormSection>
  );
}