import React, { useState, useCallback, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import ProductFormSection from '@/components/fineract/product/ProductFormSection';
import ProductField from '@/components/fineract/product/ProductField';

const TYPE_LABELS = { ASSET: 'Assets', LIABILITY: 'Liabilities', INCOME: 'Income', EXPENSE: 'Expenses', EQUITY: 'Equity' };

const ACCOUNTING_FIELDS = [
  // CASH (rule 2) required fields
  { key: 'savingsReferenceAccount', label: 'Saving Reference', optionKey: 'assetAccountOptions', typeLabel: 'ASSET', accrualOnly: false },
  { key: 'savingsControlAccount', label: 'Savings Control', optionKey: 'liabilityAccountOptions', typeLabel: 'LIABILITY', accrualOnly: false },
  { key: 'interestOnSavingsAccount', label: 'Interest on Savings', optionKey: 'expenseAccountOptions', typeLabel: 'EXPENSE', accrualOnly: false },
  { key: 'incomeFromFeeAccount', label: 'Income from Fees', optionKey: 'incomeAccountOptions', typeLabel: 'INCOME', accrualOnly: false },
  { key: 'incomeFromPenaltyAccount', label: 'Income from Penalties', optionKey: 'incomeAccountOptions', typeLabel: 'INCOME', accrualOnly: false },
  // Accrual (rule 3) additional fields
  { key: 'feesReceivableAccount', label: 'Fees Receivable', optionKey: 'assetAccountOptions', typeLabel: 'ASSET', accrualOnly: true },
  { key: 'penaltiesReceivableAccount', label: 'Penalties Receivable', optionKey: 'assetAccountOptions', typeLabel: 'ASSET', accrualOnly: true },
  { key: 'interestPayableAccount', label: 'Interest Payable', optionKey: 'liabilityAccountOptions', typeLabel: 'LIABILITY', accrualOnly: true },
  { key: 'writeOffAccount', label: 'Write-off Expense', optionKey: 'expenseAccountOptions', typeLabel: 'EXPENSE', accrualOnly: true },
  // Overdraft-specific — only shown/sent when allowOverdraft is true
  { key: 'overdraftPortfolioAccount', label: 'Overdraft Portfolio', optionKey: 'assetAccountOptions', typeLabel: 'ASSET', accrualOnly: true, overdraftOnly: true },
  { key: 'savingsTransferInSuspenseAccount', label: 'Savings Transfer Suspense', optionKey: 'liabilityAccountOptions', typeLabel: 'LIABILITY', accrualOnly: true, overdraftOnly: true },
  { key: 'overdraftInterestIncomeAccount', label: 'Overdraft Interest Income', optionKey: 'incomeAccountOptions', typeLabel: 'INCOME', accrualOnly: true, overdraftOnly: true },
];

export default function AccountingStep({ form, set, template, onValidationChange }) {
  const [loading, setLoading] = useState(true);

  // Use the template's accountingMappingOptions — these are pre-categorized
  // and guaranteed valid by Fineract for savings product accounting.
  const mappingOptions = template?.accountingMappingOptions || {};

  const isCashOrAccrual = form.accountingRule === '2' || form.accountingRule === '3';

  const isAccrual = form.accountingRule === '3';
  const visibleFields = isCashOrAccrual
    ? ACCOUNTING_FIELDS.filter(f => {
        if (!f.accrualOnly || isAccrual) {
          if (f.overdraftOnly) return form.allowOverdraft;
          return true;
        }
        return false;
      })
    : [];

  const validateAccounting = useCallback(() => {
    if (!isCashOrAccrual) return true;
    return visibleFields.every(field => {
      const val = form.accountingMappings?.[field.key];
      if (!val) return false;
      const options = mappingOptions[field.optionKey] || [];
      return options.some(a => String(a.id) === String(val));
    });
  }, [isCashOrAccrual, isAccrual, visibleFields, form.accountingMappings, mappingOptions]);

  useEffect(() => {
    onValidationChange?.(validateAccounting());
  }, [validateAccounting, onValidationChange]);

  useEffect(() => {
    setLoading(!template);
  }, [template]);

  const setMapping = useCallback((key, value) => {
    set('accountingMappings', { ...form.accountingMappings, [key]: value });
  }, [form.accountingMappings, set]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
        <span className="ml-2 text-sm text-slate-400">Loading Chart of Accounts…</span>
      </div>
    );
  }

  const selectCls = 'mt-1 w-full h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm';
  const isValid = validateAccounting();

  const renderGLSelect = (field) => {
    const val = form.accountingMappings?.[field.key] || '';
    const options = mappingOptions[field.optionKey] || [];
    const hasError = isCashOrAccrual && !val;

    return (
      <ProductField key={field.key} label={field.label} required={isCashOrAccrual}>
        <select value={val} onChange={e => setMapping(field.key, e.target.value)} className={`${selectCls} ${hasError ? 'border-rose-500' : ''}`}>
          <option value="">Select account ({options.length} available)</option>
          <optgroup label={TYPE_LABELS[field.typeLabel]}>
            {options.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name} ({acc.glCode})</option>
            ))}
          </optgroup>
        </select>
        {hasError && <p className="text-xs text-rose-400 mt-1">Required — please select a {TYPE_LABELS[field.typeLabel]} account</p>}
      </ProductField>
    );
  };

  const groups = [
    { title: 'Assets', fields: visibleFields.filter(f => f.typeLabel === 'ASSET') },
    { title: 'Liabilities', fields: visibleFields.filter(f => f.typeLabel === 'LIABILITY') },
    { title: 'Expenses', fields: visibleFields.filter(f => f.typeLabel === 'EXPENSE') },
    { title: 'Income', fields: visibleFields.filter(f => f.typeLabel === 'INCOME') },
  ].filter(g => g.fields.length > 0);

  return (
    <div className="space-y-4">
      <ProductFormSection title="Accounting Rule">
        <ProductField label="Accounting Rule" required>
          <select value={form.accountingRule} onChange={e => set('accountingRule', e.target.value)} className={selectCls}>
            <option value="1">NONE</option>
            <option value="2">CASH</option>
            <option value="3">ACCRUAL</option>
          </select>
        </ProductField>
      </ProductFormSection>

      {isCashOrAccrual && (
        <>
          {groups.map(g => (
            <ProductFormSection key={g.title} title={g.title}>
              {g.fields.map(renderGLSelect)}
            </ProductFormSection>
          ))}
          <div className={`text-sm px-4 py-2 rounded-lg ${isValid ? 'text-emerald-400 bg-emerald-950/30' : 'text-amber-400 bg-amber-950/30'}`}>
            {isValid ? '✓ All accounting fields validated' : 'Select a valid GL account for each field above to enable Next'}
          </div>
        </>
      )}
    </div>
  );
}