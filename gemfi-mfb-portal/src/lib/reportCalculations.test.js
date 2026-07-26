import { describe, it, expect } from 'vitest';
import { buildIncomeStatement, buildBalanceSheet, buildReconciliationReport } from '@/lib/reportCalculations';

const ASSET = 1;
const LIABILITY = 2;
const EQUITY = 3;
const INCOME = 4;
const EXPENSE = 5;

let nextAccountId = 1;
function makeAccount(typeId, name) {
  const id = nextAccountId++;
  return { id, glCode: String(1000 + id), name: name || `acc-${id}`, type: { id: typeId }, usage: { id: 2 } };
}

function entry(glAccountId, side, amount, date = [2026, 3, 15]) {
  return { glAccountId, amount, entryType: { value: side }, transactionDate: date };
}

describe('buildIncomeStatement', () => {
  it('normal income and expenses produce a profit', () => {
    const income = makeAccount(INCOME, 'Interest Income');
    const expense = makeAccount(EXPENSE, 'Bank Charges');
    const glAccounts = [income, expense];
    const journalEntries = [
      entry(income.id, 'CREDIT', 1000),
      entry(expense.id, 'DEBIT', 400),
    ];

    const stmt = buildIncomeStatement(glAccounts, journalEntries, '2026-01-01', '2026-12-31');

    expect(stmt.totalIncome).toBeCloseTo(1000);
    expect(stmt.totalExpense).toBeCloseTo(400);
    expect(stmt.netProfit).toBeCloseTo(600);
    expect(stmt.income[0].balance).toBeCloseTo(1000);
    expect(stmt.expense[0].balance).toBeCloseTo(400);
  });

  it('a reversed income account still contributes its magnitude to Total Income', () => {
    const income = makeAccount(INCOME, 'Interest Income');
    const expense = makeAccount(EXPENSE, 'Bank Charges');
    const glAccounts = [income, expense];
    const journalEntries = [
      // More debit than credit on an Income account -> raw balance is negative ("reversed").
      entry(income.id, 'DEBIT', 1200),
      entry(income.id, 'CREDIT', 200),
      entry(expense.id, 'DEBIT', 400),
    ];

    const stmt = buildIncomeStatement(glAccounts, journalEntries, '2026-01-01', '2026-12-31');

    expect(stmt.income[0].balance).toBeCloseTo(-1000); // true signed balance — this is what the UI flags "(reversed)"
    expect(stmt.totalIncome).toBeCloseTo(1000); // but the total is the normalized magnitude
    expect(stmt.netProfit).toBeCloseTo(600); // 1000 - 400, not -1000 - 400
  });

  it('a reversed expense account still contributes its magnitude to Total Expenses', () => {
    const income = makeAccount(INCOME, 'Interest Income');
    const expense = makeAccount(EXPENSE, 'Bank Charges');
    const glAccounts = [income, expense];
    const journalEntries = [
      entry(income.id, 'CREDIT', 1000),
      // More credit than debit on an Expense account -> raw balance is negative ("reversed").
      entry(expense.id, 'CREDIT', 500),
      entry(expense.id, 'DEBIT', 100),
    ];

    const stmt = buildIncomeStatement(glAccounts, journalEntries, '2026-01-01', '2026-12-31');

    expect(stmt.expense[0].balance).toBeCloseTo(-400);
    expect(stmt.totalExpense).toBeCloseTo(400);
    expect(stmt.netProfit).toBeCloseTo(600);
  });

  it('mixed normal and reversed balances across multiple accounts', () => {
    const incomeA = makeAccount(INCOME, 'Interest Income');
    const incomeB = makeAccount(INCOME, 'Fee Income');
    const expenseA = makeAccount(EXPENSE, 'Bank Charges');
    const expenseB = makeAccount(EXPENSE, 'Office Expense');
    const glAccounts = [incomeA, incomeB, expenseA, expenseB];
    const journalEntries = [
      entry(incomeA.id, 'CREDIT', 1000),
      entry(incomeB.id, 'DEBIT', 1200),
      entry(incomeB.id, 'CREDIT', 900), // reversed: raw -300
      entry(expenseA.id, 'DEBIT', 400),
      entry(expenseB.id, 'CREDIT', 150),
      entry(expenseB.id, 'DEBIT', 50), // reversed: raw -100
    ];

    const stmt = buildIncomeStatement(glAccounts, journalEntries, '2026-01-01', '2026-12-31');

    expect(stmt.totalIncome).toBeCloseTo(1300); // 1000 + |{-300}|
    expect(stmt.totalExpense).toBeCloseTo(500); // 400 + |{-100}|
    expect(stmt.netProfit).toBeCloseTo(800);
  });

  it('loss scenario: expenses exceed income', () => {
    const income = makeAccount(INCOME, 'Interest Income');
    const expense = makeAccount(EXPENSE, 'Bank Charges');
    const glAccounts = [income, expense];
    const journalEntries = [
      entry(income.id, 'CREDIT', 400),
      entry(expense.id, 'DEBIT', 1000),
    ];

    const stmt = buildIncomeStatement(glAccounts, journalEntries, '2026-01-01', '2026-12-31');

    expect(stmt.totalIncome).toBeCloseTo(400);
    expect(stmt.totalExpense).toBeCloseTo(1000);
    expect(stmt.netProfit).toBeCloseTo(-600);
  });
});

describe('buildBalanceSheet', () => {
  it('a clean balance sheet reconciles exactly', () => {
    const asset = makeAccount(ASSET, 'Cash');
    const liability = makeAccount(LIABILITY, 'Savings Deposits');
    const equity = makeAccount(EQUITY, 'Share Capital');
    const glAccounts = [asset, liability, equity];
    const journalEntries = [
      entry(asset.id, 'DEBIT', 1000),
      entry(liability.id, 'CREDIT', 600),
      entry(equity.id, 'CREDIT', 400),
    ];

    const sheet = buildBalanceSheet(glAccounts, journalEntries, '2026-12-31');

    expect(sheet.totalAssets).toBeCloseTo(1000);
    expect(sheet.totalLiabilities).toBeCloseTo(600);
    expect(sheet.totalEquity).toBeCloseTo(400);
    expect(sheet.difference).toBeCloseTo(0);
    expect(sheet.isBalanced).toBe(true);
  });

  it('positive equity from normal Equity postings', () => {
    const asset = makeAccount(ASSET, 'Cash');
    const equity = makeAccount(EQUITY, 'Share Capital');
    const glAccounts = [asset, equity];
    const journalEntries = [
      entry(asset.id, 'DEBIT', 500),
      entry(equity.id, 'CREDIT', 500),
    ];

    const sheet = buildBalanceSheet(glAccounts, journalEntries, '2026-12-31');

    expect(sheet.totalEquity).toBeCloseTo(500);
    expect(sheet.totalEquity).toBeGreaterThan(0);
  });

  it('negative equity from accumulated losses is real, not normalized away', () => {
    const asset = makeAccount(ASSET, 'Cash');
    const equity = makeAccount(EQUITY, 'Share Capital');
    const income = makeAccount(INCOME, 'Interest Income');
    const expense = makeAccount(EXPENSE, 'Operating Expense');
    const glAccounts = [asset, equity, income, expense];
    const journalEntries = [
      entry(asset.id, 'DEBIT', 2000),
      entry(equity.id, 'CREDIT', 400),
      entry(income.id, 'CREDIT', 100),
      entry(expense.id, 'DEBIT', 2000), // big loss: net income = 100 - 2000 = -1900
    ];

    const sheet = buildBalanceSheet(glAccounts, journalEntries, '2026-12-31');

    // 400 (real equity) + (-1900) (true signed net loss) = -1500: a genuine
    // accumulated-loss condition, must NOT be normalized to +1500.
    expect(sheet.totalEquity).toBeCloseTo(-1500);
  });

  it('a reversed Liability account still reconciles to zero using true signed totals', () => {
    // Two legitimate, separately-balanced transactions. The second is a large
    // drawdown against the liability, big enough that the liability's net
    // balance for the period is negative ("reversed") — a real, valid
    // outcome, not a data error. Total debits (1000+1300=2300) equal total
    // credits (1300+1000=2300), so per double-entry accounting this MUST
    // reconcile to zero regardless of any single account's natural sign —
    // proving the fix: normalizing that reversed account away would have
    // broken this identity by 2x its magnitude (see buildBalanceSheet).
    const asset = makeAccount(ASSET, 'Cash');
    const liability = makeAccount(LIABILITY, 'Savings Deposits');
    const glAccounts = [asset, liability];
    const journalEntries = [
      entry(asset.id, 'DEBIT', 1000),
      entry(liability.id, 'CREDIT', 1000),
      entry(liability.id, 'DEBIT', 1300),
      entry(asset.id, 'CREDIT', 1300),
    ];

    const sheet = buildBalanceSheet(glAccounts, journalEntries, '2026-12-31');

    expect(sheet.liabilities[0].balance).toBeCloseTo(-300); // true signed — UI flags "(reversed)"
    expect(sheet.totalLiabilities).toBeCloseTo(-300); // NOT normalized to +300
    expect(sheet.totalAssets).toBeCloseTo(-300);
    expect(sheet.difference).toBeCloseTo(0);
    expect(sheet.isBalanced).toBe(true);
  });

  it('reproduces the exact live-instance case: a reversed Asset account still reconciles', () => {
    // Modeled directly on the real discrepancy found against a live Fineract
    // instance: a "CBN" cash account received 50,000 (deposit) and paid out
    // 100,000 (withdrawal against a liability), netting -50,000 for the
    // period — reversed, but real. Normalizing it (the old, wrong behavior)
    // shifted Total Assets by 2x that amount and produced a false ₦100,000
    // variance against an otherwise-perfectly-balanced ledger.
    const asset = makeAccount(ASSET, 'CBN');
    const liability = makeAccount(LIABILITY, 'Savings Deposits');
    const glAccounts = [asset, liability];
    const journalEntries = [
      entry(asset.id, 'DEBIT', 50000),
      entry(liability.id, 'CREDIT', 50000),
      entry(liability.id, 'DEBIT', 100000),
      entry(asset.id, 'CREDIT', 100000),
    ];

    const sheet = buildBalanceSheet(glAccounts, journalEntries, '2026-12-31');

    expect(sheet.assets[0].balance).toBeCloseTo(-50000); // true signed — UI flags "(reversed)"
    expect(sheet.totalAssets).toBeCloseTo(-50000); // NOT normalized to +50,000
    expect(sheet.totalLiabilities).toBeCloseTo(-50000);
    expect(sheet.difference).toBeCloseTo(0);
    expect(sheet.isBalanced).toBe(true);
  });

  it('a genuine mismatch still reports Out of Balance with the real variance', () => {
    const asset = makeAccount(ASSET, 'Cash');
    const liability = makeAccount(LIABILITY, 'Savings Deposits');
    const equity = makeAccount(EQUITY, 'Share Capital');
    const glAccounts = [asset, liability, equity];
    const journalEntries = [
      entry(asset.id, 'DEBIT', 1000),
      entry(liability.id, 'CREDIT', 500),
      entry(equity.id, 'CREDIT', 300),
    ];

    const sheet = buildBalanceSheet(glAccounts, journalEntries, '2026-12-31');

    expect(sheet.isBalanced).toBe(false);
    expect(sheet.difference).toBeCloseTo(200);
  });
});

describe('buildReconciliationReport', () => {
  it('accounts for every GL account exactly once, including zero-balance ones', () => {
    const asset = makeAccount(ASSET, 'Cash');
    const liability = makeAccount(LIABILITY, 'Savings Deposits');
    const dormant = makeAccount(ASSET, 'Dormant Account'); // never posted to
    const glAccounts = [asset, liability, dormant];
    const journalEntries = [
      entry(asset.id, 'DEBIT', 500),
      entry(liability.id, 'CREDIT', 500),
    ];

    const report = buildReconciliationReport(glAccounts, journalEntries, '2026-12-31');

    expect(report.accountRows).toHaveLength(3);
    const dormantRow = report.accountRows.find(a => a.id === dormant.id);
    expect(dormantRow.balance).toBe(0);
    expect(dormantRow.status).toBe('Included');
  });

  it('flags an account with no recognized type as Misclassified', () => {
    const asset = makeAccount(ASSET, 'Cash');
    const unknown = { id: nextAccountId++, glCode: '9999', name: 'Suspense', type: {}, usage: { id: 2 } };
    const glAccounts = [asset, unknown];
    const journalEntries = [entry(asset.id, 'DEBIT', 100)];

    const report = buildReconciliationReport(glAccounts, journalEntries, '2026-12-31');

    const row = report.accountRows.find(a => a.id === unknown.id);
    expect(row.status).toBe('Misclassified');
  });

  it('excludes Income/Expense from Balance Sheet lines but reports them with a reason', () => {
    const income = makeAccount(INCOME, 'Interest Income');
    const glAccounts = [income];
    const journalEntries = [entry(income.id, 'CREDIT', 100)];

    const report = buildReconciliationReport(glAccounts, journalEntries, '2026-12-31');

    const row = report.accountRows.find(a => a.id === income.id);
    expect(row.status).toBe('Excluded from BS lines');
    expect(row.reason).toMatch(/Current Year Earnings/);
  });

  it('detects an orphaned journal entry whose GL account no longer exists', () => {
    const asset = makeAccount(ASSET, 'Cash');
    const glAccounts = [asset];
    const journalEntries = [
      entry(asset.id, 'DEBIT', 500),
      { glAccountId: 999999, amount: 500, entryType: { value: 'CREDIT' }, transactionDate: [2026, 3, 15], transactionId: 'TXN-ORPHAN' },
    ];

    const report = buildReconciliationReport(glAccounts, journalEntries, '2026-12-31');

    expect(report.orphanEntries).toHaveLength(1);
    expect(report.orphanEntries[0].transactionId).toBe('TXN-ORPHAN');
    // The ledger-wide check still sees both sides and balances...
    expect(report.ledger.isLedgerBalanced).toBe(true);
    // ...but the Balance Sheet itself is missing the orphan's credit entirely.
    expect(report.totalAssets).toBeCloseTo(500);
    expect(report.isBalanced).toBe(false);
  });

  it('flags a genuinely unbalanced journal entry in the ledger-wide check', () => {
    const asset = makeAccount(ASSET, 'Cash');
    const liability = makeAccount(LIABILITY, 'Savings Deposits');
    const glAccounts = [asset, liability];
    const journalEntries = [
      entry(asset.id, 'DEBIT', 500),
      entry(liability.id, 'CREDIT', 450), // short by 50 — an unbalanced posting
    ];

    const report = buildReconciliationReport(glAccounts, journalEntries, '2026-12-31');

    expect(report.ledger.isLedgerBalanced).toBe(false);
    expect(report.ledger.difference).toBeCloseTo(50);
  });
});
