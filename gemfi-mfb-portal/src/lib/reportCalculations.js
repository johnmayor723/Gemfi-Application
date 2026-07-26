import { toISODate } from '@/hooks/useJournalEntries';
import { LOAN_CLASSIFICATION_BUCKETS } from '@/lib/regulatoryConstants';

const GL_TYPE = { ASSET: 1, LIABILITY: 2, EQUITY: 3, INCOME: 4, EXPENSE: 5 };
const GL_TYPE_LABEL = { 1: 'Asset', 2: 'Liability', 3: 'Equity', 4: 'Income', 5: 'Expense' };
const CREDIT_NATURAL_TYPES = new Set([GL_TYPE.LIABILITY, GL_TYPE.EQUITY, GL_TYPE.INCOME]);

const isDebitEntry = (e) => e.entryType?.value?.toLowerCase() === 'debit' || e.entryType?.id === 1;

/**
 * Sums each row's magnitude rather than its signed balance. Used for Income
 * Statement totals: an Income or Expense account that posted "reversed"
 * (opposite its natural Cr/Dr direction — see aggregateGlMovement) still
 * represents real activity in that account. Its magnitude belongs in the
 * total; only its *sign* is anomalous, and that's surfaced separately as a
 * per-row "(reversed)" flag, not by letting it invert the total.
 */
const sumNormalized = (rows) => rows.reduce((s, r) => s + Math.abs(r.balance), 0);

/**
 * Sums debit/credit movement per GL account from a flat list of journal
 * entries, restricted to an optional [fromDate, toDate] window (inclusive,
 * ISO "YYYY-MM-DD" strings). Returns the natural-balance-signed amount per
 * account: Asset/Expense accounts are debit-natural, Liability/Equity/Income
 * accounts are credit-natural.
 */
function aggregateGlMovement(glAccounts, journalEntries, { fromDate, toDate, typeIds } = {}) {
  const byId = new Map(glAccounts.map(a => [String(a.id), a]));
  const totals = new Map();

  for (const e of journalEntries) {
    const acc = byId.get(String(e.glAccountId));
    if (!acc) continue;
    const typeId = acc.type?.id;
    if (typeIds && !typeIds.includes(typeId)) continue;

    const entryDate = toISODate(e.transactionDate);
    if (fromDate && entryDate < fromDate) continue;
    if (toDate && entryDate > toDate) continue;

    const bucket = totals.get(acc.id) || { debit: 0, credit: 0 };
    if (isDebitEntry(e)) bucket.debit += e.amount || 0;
    else bucket.credit += e.amount || 0;
    totals.set(acc.id, bucket);
  }

  return glAccounts
    .filter(a => !typeIds || typeIds.includes(a.type?.id))
    .map(a => {
      const t = totals.get(a.id) || { debit: 0, credit: 0 };
      const balance = CREDIT_NATURAL_TYPES.has(a.type?.id) ? t.credit - t.debit : t.debit - t.credit;
      return { id: a.id, glCode: a.glCode, name: a.name, typeId: a.type?.id, debit: t.debit, credit: t.credit, balance };
    })
    .filter(row => Math.abs(row.balance) > 0.005 || Math.abs(row.debit) > 0 || Math.abs(row.credit) > 0);
}

/**
 * Statement of Assets & Liabilities — cumulative balances from inception
 * through asOfDate. Includes accumulated Income/Expense as a "Net Income
 * (current period, not yet closed to equity)" line inside Equity — Fineract
 * never auto-posts a closing entry sweeping Income/Expense into retained
 * earnings, so without this the balance sheet is always out of balance by
 * exactly the ledger's accumulated net income.
 */
export function buildBalanceSheet(glAccounts, journalEntries, asOfDate) {
  const rows = aggregateGlMovement(glAccounts, journalEntries, {
    toDate: asOfDate,
    typeIds: [GL_TYPE.ASSET, GL_TYPE.LIABILITY, GL_TYPE.EQUITY, GL_TYPE.INCOME, GL_TYPE.EXPENSE],
  });

  const assets = rows.filter(r => r.typeId === GL_TYPE.ASSET).sort((a, b) => String(a.glCode).localeCompare(String(b.glCode)));
  const liabilities = rows.filter(r => r.typeId === GL_TYPE.LIABILITY).sort((a, b) => String(a.glCode).localeCompare(String(b.glCode)));
  const equityAccounts = rows.filter(r => r.typeId === GL_TYPE.EQUITY).sort((a, b) => String(a.glCode).localeCompare(String(b.glCode)));

  // Net Income/(Loss) folded into Equity stays TRUE signed — a genuine
  // accumulated loss must actually reduce Equity (that's real information,
  // see "Accumulated Losses" below), so it is never normalized away.
  const totalIncome = rows.filter(r => r.typeId === GL_TYPE.INCOME).reduce((s, r) => s + r.balance, 0);
  const totalExpense = rows.filter(r => r.typeId === GL_TYPE.EXPENSE).reduce((s, r) => s + r.balance, 0);
  const netIncome = totalIncome - totalExpense;

  const equity = Math.abs(netIncome) > 0.005
    ? [...equityAccounts, {
        id: 'net-income',
        glCode: '—',
        name: netIncome >= 0 ? 'Net Income (current period, not yet closed to equity)' : 'Net Loss (current period, not yet closed to equity)',
        typeId: GL_TYPE.EQUITY,
        balance: netIncome,
      }]
    : equityAccounts;

  // Deliberately TRUE signed totals, not normalized (unlike the Income
  // Statement). Assets = Liabilities + Equity is a real double-entry
  // identity: normalizing any single reversed account's magnitude into a
  // section total shifts that total by 2x the account's amount relative to
  // what the ledger's actual debits/credits produced, breaking the identity
  // by exactly that much. (Verified directly: a live instance with one
  // reversed Asset account balanced to zero variance with true signed
  // totals, and was off by 2x that account's balance once normalized.)
  // Individual rows still display as a positive magnitude with a
  // "(reversed)" badge — see BalanceSheetSection.jsx — that's cosmetic and
  // doesn't touch this math.
  const totalAssets = assets.reduce((s, r) => s + r.balance, 0);
  const totalLiabilities = liabilities.reduce((s, r) => s + r.balance, 0);
  const totalEquity = equityAccounts.reduce((s, r) => s + r.balance, 0) + netIncome;
  const difference = totalAssets - (totalLiabilities + totalEquity);

  return { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity, netIncome, isBalanced: Math.abs(difference) < 0.01, difference };
}

/**
 * Full diagnostic behind the Balance Sheet's headline Assets/Liabilities/
 * Equity/Variance figures — every GL account exactly once (including
 * zero-balance and unrecognized-type accounts, so nothing is silently
 * missing), a whole-ledger debit/credit check independent of account type
 * or even whether the account still exists in the current chart of
 * accounts, and any "orphan" journal entries whose glAccountId doesn't
 * match a currently-fetched GL account — aggregateGlMovement silently
 * drops those, which would be a genuine (not cosmetic) source of
 * Assets ≠ Liabilities + Equity if any exist.
 */
export function buildReconciliationReport(glAccounts, journalEntries, asOfDate) {
  const byId = new Map(glAccounts.map(a => [String(a.id), a]));

  let totalDebit = 0;
  let totalCredit = 0;
  const orphanEntries = [];
  const perAccountTotals = new Map();

  for (const e of journalEntries) {
    const entryDate = toISODate(e.transactionDate);
    if (asOfDate && entryDate && entryDate > asOfDate) continue;

    const debit = isDebitEntry(e);
    if (debit) totalDebit += e.amount || 0;
    else totalCredit += e.amount || 0;

    const acc = byId.get(String(e.glAccountId));
    if (!acc) {
      orphanEntries.push({
        transactionId: e.transactionId,
        glAccountId: e.glAccountId,
        glAccountCode: e.glAccountCode,
        glAccountName: e.glAccountName || e.accountName,
        amount: e.amount,
        side: debit ? 'Debit' : 'Credit',
        transactionDate: e.transactionDate,
      });
      continue;
    }

    const bucket = perAccountTotals.get(acc.id) || { debit: 0, credit: 0 };
    if (debit) bucket.debit += e.amount || 0;
    else bucket.credit += e.amount || 0;
    perAccountTotals.set(acc.id, bucket);
  }

  const ledgerDifference = totalDebit - totalCredit;

  const accountRows = glAccounts.map(a => {
    const t = perAccountTotals.get(a.id) || { debit: 0, credit: 0 };
    const typeId = a.type?.id;
    const balance = CREDIT_NATURAL_TYPES.has(typeId) ? t.credit - t.debit : t.debit - t.credit;

    let status = 'Included';
    let reason = `${GL_TYPE_LABEL[typeId] || 'Unknown'} — included in the Balance Sheet`;
    if (typeId === GL_TYPE.INCOME || typeId === GL_TYPE.EXPENSE) {
      status = 'Excluded from BS lines';
      reason = `${GL_TYPE_LABEL[typeId]} — never shown as its own Balance Sheet line; flows in only via Current Year Earnings`;
    } else if (!GL_TYPE_LABEL[typeId]) {
      status = 'Misclassified';
      reason = `No recognized account type (type.id = ${typeId ?? 'missing'}) — excluded from every report until this account is assigned Asset/Liability/Equity/Income/Expense`;
    }

    return { id: a.id, glCode: a.glCode, name: a.name, typeId, typeLabel: GL_TYPE_LABEL[typeId] || 'Unrecognized', debit: t.debit, credit: t.credit, balance, status, reason };
  });

  const balanceSheet = buildBalanceSheet(glAccounts, journalEntries, asOfDate);

  return {
    totalAssets: balanceSheet.totalAssets,
    totalLiabilities: balanceSheet.totalLiabilities,
    totalEquity: balanceSheet.totalEquity,
    currentYearProfitLoss: balanceSheet.netIncome,
    variance: balanceSheet.difference,
    isBalanced: balanceSheet.isBalanced,
    accountRows,
    ledger: {
      totalDebit,
      totalCredit,
      difference: ledgerDifference,
      isLedgerBalanced: Math.abs(ledgerDifference) < 0.01,
    },
    orphanEntries,
  };
}

/**
 * Income Statement — movement strictly within [fromDate, toDate].
 *
 * Total Income and Total Expenses are sums of each account's *normalized*
 * balance (its natural-direction magnitude — see sumNormalized), not its raw
 * signed balance. An Income account that posted "reversed" (more debit than
 * credit within the period) still represents real income activity; letting
 * its negative raw balance subtract from Total Income would make Net
 * Profit/(Loss) reflect a sign anomaly rather than the actual result of the
 * period. The anomaly itself is still visible — each row carries its true
 * signed `balance`, which the UI flags "(reversed)" — this normalization
 * only affects what gets summed into the totals.
 */
export function buildIncomeStatement(glAccounts, journalEntries, fromDate, toDate) {
  const rows = aggregateGlMovement(glAccounts, journalEntries, {
    fromDate, toDate,
    typeIds: [GL_TYPE.INCOME, GL_TYPE.EXPENSE],
  });

  const income = rows.filter(r => r.typeId === GL_TYPE.INCOME).sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
  const expense = rows.filter(r => r.typeId === GL_TYPE.EXPENSE).sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));

  const totalIncome = sumNormalized(income);
  const totalExpense = sumNormalized(expense);

  return { income, expense, totalIncome, totalExpense, netProfit: totalIncome - totalExpense };
}

/**
 * Days past due for a loan, based on the oldest unpaid installment in its
 * repayment schedule (association=repaymentSchedule), as of asOfDate.
 * Returns 0 for loans with no overdue installments.
 */
export function computeDaysPastDue(loan, asOfDate) {
  const periods = loan?.repaymentSchedule?.periods || [];
  const asOfMs = new Date(asOfDate).getTime();

  let oldestOverdueMs = null;
  for (const p of periods) {
    if (p.complete || !p.dueDate || p.period == null) continue;
    const dueIso = toISODate(p.dueDate);
    if (!dueIso) continue;
    const dueMs = new Date(dueIso).getTime();
    if (dueMs < asOfMs && (oldestOverdueMs === null || dueMs < oldestOverdueMs)) {
      oldestOverdueMs = dueMs;
    }
  }
  if (oldestOverdueMs === null) return 0;
  return Math.floor((asOfMs - oldestOverdueMs) / 86400000);
}

export function classifyDaysPastDue(daysPastDue) {
  return LOAN_CLASSIFICATION_BUCKETS.find(b => daysPastDue >= b.minDays && daysPastDue <= b.maxDays)
    || LOAN_CLASSIFICATION_BUCKETS[LOAN_CLASSIFICATION_BUCKETS.length - 1];
}

/** Portfolio-at-Risk classification across a set of active loans (with repaymentSchedule loaded). */
export function buildLoanPortfolioClassification(loans, asOfDate) {
  const buckets = new Map(LOAN_CLASSIFICATION_BUCKETS.map(b => [b.key, { ...b, count: 0, outstanding: 0 }]));

  for (const loan of loans) {
    const daysPastDue = computeDaysPastDue(loan, asOfDate);
    const bucket = classifyDaysPastDue(daysPastDue);
    const outstanding = loan.summary?.totalOutstanding ?? 0;
    const entry = buckets.get(bucket.key);
    entry.count += 1;
    entry.outstanding += outstanding;
  }

  const rows = Array.from(buckets.values()).map(b => ({ ...b, requiredProvision: b.outstanding * b.provisionRate }));
  const totalLoans = rows.reduce((s, r) => s + r.count, 0);
  const totalOutstanding = rows.reduce((s, r) => s + r.outstanding, 0);
  const totalProvision = rows.reduce((s, r) => s + r.requiredProvision, 0);
  const parOutstanding = rows.filter(r => r.key !== 'performing' && r.key !== 'watch').reduce((s, r) => s + r.outstanding, 0);

  return {
    rows,
    totalLoans,
    totalOutstanding,
    totalProvision,
    parOutstanding,
    parRatio: totalOutstanding > 0 ? parOutstanding / totalOutstanding : 0,
  };
}

/** Groups active savings balances by depositor (clientId) and splits insured/uninsured per the coverage limit. */
export function computeInsuredDeposits(savingsAccounts, coverageLimit) {
  const byClient = new Map();
  for (const a of savingsAccounts) {
    if (a.status?.value?.toLowerCase() !== 'active') continue;
    const key = a.clientId ?? `group-${a.groupId}`;
    const entry = byClient.get(key) || { clientId: a.clientId, clientName: a.clientName || a.groupName || '—', total: 0, accounts: 0 };
    entry.total += a.accountBalance || 0;
    entry.accounts += 1;
    byClient.set(key, entry);
  }

  const depositors = Array.from(byClient.values()).map(d => ({
    ...d,
    insured: Math.min(d.total, coverageLimit),
    uninsured: Math.max(0, d.total - coverageLimit),
  })).sort((a, b) => b.total - a.total);

  const totalDeposits = depositors.reduce((s, d) => s + d.total, 0);
  const totalInsured = depositors.reduce((s, d) => s + d.insured, 0);
  const totalUninsured = depositors.reduce((s, d) => s + d.uninsured, 0);
  const fullyCoveredCount = depositors.filter(d => d.uninsured === 0).length;

  return {
    depositors,
    totalDeposits,
    totalInsured,
    totalUninsured,
    fullyCoveredCount,
    fullyCoveredPct: depositors.length > 0 ? fullyCoveredCount / depositors.length : 0,
  };
}

export function computeNdicPremium(totalDepositLiabilities, rate) {
  return totalDepositLiabilities * rate;
}

export function computeCapitalAdequacyRatio(totalEquity, totalRiskAssets) {
  return totalRiskAssets > 0 ? totalEquity / totalRiskAssets : null;
}

export function computeLiquidityRatio(liquidAssetsTotal, totalDepositLiabilities) {
  return totalDepositLiabilities > 0 ? liquidAssetsTotal / totalDepositLiabilities : null;
}
