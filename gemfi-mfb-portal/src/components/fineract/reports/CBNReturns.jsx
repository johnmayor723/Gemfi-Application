import React, { useMemo } from 'react';
import RegulatoryDisclosureBanner from '@/components/fineract/reports/RegulatoryDisclosureBanner';
import BalanceSheetSection from '@/components/fineract/reports/BalanceSheetSection';
import IncomeStatementSection from '@/components/fineract/reports/IncomeStatementSection';
import LoanClassificationSection from '@/components/fineract/reports/LoanClassificationSection';
import LiquidityRatioSection from '@/components/fineract/reports/LiquidityRatioSection';
import { buildBalanceSheet } from '@/lib/reportCalculations';

export default function CBNReturns({ glAccounts, journalEntries, activeLoans, savingsAccounts, asOfDate }) {
  const balanceSheet = useMemo(
    () => buildBalanceSheet(glAccounts, journalEntries, asOfDate),
    [glAccounts, journalEntries, asOfDate],
  );

  const totalDepositLiabilities = useMemo(
    () => savingsAccounts
      .filter(a => a.status?.value?.toLowerCase() === 'active')
      .reduce((s, a) => s + (a.accountBalance || 0), 0),
    [savingsAccounts],
  );

  return (
    <div className="space-y-8">
      <RegulatoryDisclosureBanner />
      <BalanceSheetSection balanceSheet={balanceSheet} asOfDate={asOfDate} />
      <IncomeStatementSection
        glAccounts={glAccounts}
        journalEntries={journalEntries}
        defaultToDate={asOfDate}
        title="Income Statement"
        filenamePrefix="cbn_income_statement"
      />
      <LoanClassificationSection activeLoans={activeLoans} asOfDate={asOfDate} totalEquity={balanceSheet.totalEquity} />
      <LiquidityRatioSection balanceSheet={balanceSheet} totalDepositLiabilities={totalDepositLiabilities} asOfDate={asOfDate} />
    </div>
  );
}
