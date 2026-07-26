import React from 'react';
import { Input } from '@/components/ui/input';
import ProductFormSection from '@/components/fineract/product/ProductFormSection';
import ProductField from '@/components/fineract/product/ProductField';

export default function DetailsStep({ form, set }) {
  const inputCls = 'mt-1 bg-slate-800 border-slate-700 text-white';
  return (
    <ProductFormSection title="Product Details">
      <ProductField label="Product Name" required>
        <Input value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} />
      </ProductField>
      <ProductField label="Short Name" required hint="Max 4 chars">
        <Input value={form.shortName} maxLength={4} onChange={e => set('shortName', e.target.value)} className={inputCls} />
      </ProductField>
      <ProductField label="Description" full>
        <Input value={form.description} onChange={e => set('description', e.target.value)} className={inputCls} />
      </ProductField>
    </ProductFormSection>
  );
}