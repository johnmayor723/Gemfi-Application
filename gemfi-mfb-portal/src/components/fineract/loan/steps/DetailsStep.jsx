import React from 'react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
      <div className="col-span-2 flex items-center gap-3 mt-1">
        <Switch checked={form.includeInBorrowerCycle} onCheckedChange={v => set('includeInBorrowerCycle', v)} />
        <Label className="text-slate-300 text-sm cursor-pointer" onClick={() => set('includeInBorrowerCycle', !form.includeInBorrowerCycle)}>
          Include in Borrower Cycle
        </Label>
      </div>
      <div className="col-span-2 flex items-center gap-3">
        <Switch checked={form.useBorrowerCycle} onCheckedChange={v => set('useBorrowerCycle', v)} />
        <Label className="text-slate-300 text-sm cursor-pointer" onClick={() => set('useBorrowerCycle', !form.useBorrowerCycle)}>
          Use Borrower Cycle
        </Label>
      </div>
    </ProductFormSection>
  );
}