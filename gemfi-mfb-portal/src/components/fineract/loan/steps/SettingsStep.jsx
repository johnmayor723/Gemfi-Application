import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import ProductFormSection from '@/components/fineract/product/ProductFormSection';
import ProductField from '@/components/fineract/product/ProductField';

const DAYS_IN_MONTH_OPTIONS = [
  { id: 1, value: 'Actual' },
  { id: 30, value: '30 Days' },
];
const DAYS_IN_YEAR_OPTIONS = [
  { id: 1, value: 'Actual' },
  { id: 360, value: '360 Days' },
  { id: 364, value: '364 Days' },
  { id: 365, value: '365 Days' },
];
const STRATEGY_OPTIONS = [
  { code: 'mifos-standard-strategy', name: 'Penalties, Fees, Interest, Principal order' },
  { code: 'heavensfamily-strategy', name: 'HeavensFamily Unique' },
  { code: 'creocore-strategy', name: 'Creocore Unique' },
  { code: 'rbi-india-strategy', name: 'Overdue/Due Fee/Int, Principal' },
  { code: 'principal-interest-penalties-fees-order-strategy', name: 'Principal Interest Penalties Fees Order' },
  { code: 'interest-principal-penalties-fees-order-strategy', name: 'Interest Principal Penalties Fees Order' },
];
const REPAYMENT_START_DATE_OPTIONS = [
  { id: 1, value: 'Respect First Repayment Date' },
  { id: 0, value: 'Default' },
];

export default function SettingsStep({ form, set, template }) {
  const selectCls = 'mt-1 w-full h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm';
  const tpl = (key, fallback) => template?.[key] || fallback;

  return (
    <div className="space-y-4">
      <ProductFormSection title="Days & Date Settings">
        <ProductField label="Days in Month" required>
          <select value={form.daysInMonthType} onChange={e => set('daysInMonthType', e.target.value)} className={selectCls}>
            {tpl('daysInMonthTypeOptions', DAYS_IN_MONTH_OPTIONS).map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
          </select>
        </ProductField>
        <ProductField label="Days in Year" required>
          <select value={form.daysInYearType} onChange={e => set('daysInYearType', e.target.value)} className={selectCls}>
            {tpl('daysInYearTypeOptions', DAYS_IN_YEAR_OPTIONS).map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
          </select>
        </ProductField>
        <ProductField label="Repayment Start Date Type">
          <select value={form.repaymentStartDateType} onChange={e => set('repaymentStartDateType', e.target.value)} className={selectCls}>
            {REPAYMENT_START_DATE_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
          </select>
        </ProductField>
      </ProductFormSection>

      <ProductFormSection title="Processing Strategy">
        <ProductField label="Transaction Processing Strategy" required full>
          <select value={form.transactionProcessingStrategyCode} onChange={e => set('transactionProcessingStrategyCode', e.target.value)} className={selectCls}>
            {tpl('transactionProcessingStrategyOptions', STRATEGY_OPTIONS).map(o => <option key={o.code} value={o.code}>{o.name}</option>)}
          </select>
        </ProductField>
      </ProductFormSection>

      <ProductFormSection title="Additional Options">
        {[
          ['canUseForTopup', 'Can Use for Top-up'],
          ['allowVariableInstallments', 'Allow Variable Installments'],
        ].map(([key, label]) => (
          <div key={key} className="col-span-2 flex items-center gap-3">
            <Switch checked={form[key]} onCheckedChange={v => set(key, v)} />
            <Label className="text-slate-300 text-sm cursor-pointer" onClick={() => set(key, !form[key])}>{label}</Label>
          </div>
        ))}
      </ProductFormSection>
    </div>
  );
}