import React from 'react';
import { Input } from '@/components/ui/input';
import ProductFormSection from '@/components/fineract/product/ProductFormSection';
import ProductField from '@/components/fineract/product/ProductField';

export default function CurrencyStep({ form, set, template }) {
  const inputCls = 'mt-1 bg-slate-800 border-slate-700 text-white';
  const selectCls = 'mt-1 w-full h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm';
  const currencyOptions = template?.currencyOptions || [{ code: 'USD', name: 'US Dollar' }];

  return (
    <ProductFormSection title="Currency">
      <ProductField label="Currency" required>
        <select value={form.currencyCode} onChange={e => set('currencyCode', e.target.value)} className={selectCls}>
          {currencyOptions.map(c => (
            <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
          ))}
        </select>
      </ProductField>
      <ProductField label="Digits After Decimal" required>
        <Input type="number" value={form.digitsAfterDecimal} onChange={e => set('digitsAfterDecimal', e.target.value)} className={inputCls} />
      </ProductField>
      <ProductField label="In Multiples Of">
        <Input type="number" value={form.inMultiplesOf} onChange={e => set('inMultiplesOf', e.target.value)} className={inputCls} />
      </ProductField>
    </ProductFormSection>
  );
}