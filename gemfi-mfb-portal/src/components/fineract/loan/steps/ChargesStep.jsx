import React from 'react';
import ProductFormSection from '@/components/fineract/product/ProductFormSection';

export default function ChargesStep({ form, set, template }) {
  const chargeOptions = template?.chargeOptions || [];

  const toggleCharge = (chargeId) => {
    set('charges', form.charges.includes(chargeId)
      ? form.charges.filter(id => id !== chargeId)
      : [...form.charges, chargeId]);
  };

  return (
    <ProductFormSection title="Charges">
      {chargeOptions.length === 0 ? (
        <p className="col-span-2 text-sm text-slate-500 text-center py-4">No charges available</p>
      ) : (
        <div className="col-span-2 space-y-2">
          {chargeOptions.map(charge => (
            <label key={charge.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 cursor-pointer hover:bg-slate-800">
              <input
                type="checkbox"
                checked={form.charges.includes(charge.id)}
                onChange={() => toggleCharge(charge.id)}
                className="w-4 h-4 accent-emerald-600"
              />
              <div className="flex-1">
                <p className="text-sm text-white">{charge.name}</p>
                <p className="text-xs text-slate-400">
                  {charge.amount} {charge.currency?.code || ''} · {charge.chargeTimeType?.value || ''} · {charge.chargeCalculationType?.value || ''}
                </p>
              </div>
            </label>
          ))}
        </div>
      )}
    </ProductFormSection>
  );
}