import { fineractApi } from '@/lib/fineract';

/** Matches the date format already used successfully by JournalEntries.jsx's create-entry call. */
export function toPostingDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

/** The organization's active currencies, as shown on the Currencies admin page. */
export async function fetchActiveCurrencies() {
  const res = await fineractApi('/currencies');
  return res?.selectedCurrencyOptions || [];
}

/**
 * Posts a single balanced debit/credit journal entry — the shape shared by
 * Capital Transactions, Expense Entry, and Other Income Entry. All three
 * differ only in which side (debit or credit) gets the Cash/Bank account
 * and which gets the Equity/Expense/Income account.
 */
export async function postSimpleJournalEntry({ officeId, transactionDate, currencyCode, debitAccountId, creditAccountId, amount, referenceNumber, narration }) {
  const body = {
    officeId: parseInt(officeId, 10),
    transactionDate: toPostingDate(transactionDate),
    currencyCode,
    locale: 'en',
    dateFormat: 'dd MMMM yyyy',
    comments: narration || undefined,
    debits: [{ glAccountId: parseInt(debitAccountId, 10), amount: parseFloat(amount) }],
    credits: [{ glAccountId: parseInt(creditAccountId, 10), amount: parseFloat(amount) }],
  };
  if (referenceNumber) body.referenceNumber = referenceNumber;
  return fineractApi('/journalentries', { method: 'POST', body });
}

/** Posts a multi-line balanced journal entry — one or more debit lines, one or more credit lines. */
export async function postJournalEntry({ officeId, transactionDate, currencyCode, debitLines, creditLines, referenceNumber, narration }) {
  const body = {
    officeId: parseInt(officeId, 10),
    transactionDate: toPostingDate(transactionDate),
    currencyCode,
    locale: 'en',
    dateFormat: 'dd MMMM yyyy',
    comments: narration || undefined,
    debits: debitLines.map(l => ({ glAccountId: parseInt(l.glAccountId, 10), amount: parseFloat(l.amount) })),
    credits: creditLines.map(l => ({ glAccountId: parseInt(l.glAccountId, 10), amount: parseFloat(l.amount) })),
  };
  if (referenceNumber) body.referenceNumber = referenceNumber;
  return fineractApi('/journalentries', { method: 'POST', body });
}
