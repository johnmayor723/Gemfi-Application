import { useState, useCallback } from 'react';
import { fineractApi } from '@/lib/fineract';
import { fetchAllJournalEntries } from '@/hooks/useJournalEntries';

async function fetchAllSavingsAccounts(onProgress) {
  const pageSize = 200;
  let offset = 0;
  let all = [];
  let hasMore = true;
  while (hasMore) {
    const res = await fineractApi('/savingsaccounts', { params: { limit: pageSize, offset } });
    const items = res?.pageItems || [];
    all = all.concat(items);
    const total = res?.totalFilteredRecords || items.length;
    if (onProgress) onProgress(all.length, total);
    if (items.length < pageSize || all.length >= total) hasMore = false;
    else offset += pageSize;
  }
  return all;
}

async function fetchActiveLoansWithSchedule(onProgress) {
  const pageSize = 200;
  let offset = 0;
  let all = [];
  let hasMore = true;
  while (hasMore) {
    const res = await fineractApi('/loans', { params: { limit: pageSize, offset } });
    const items = res?.pageItems || [];
    all = all.concat(items);
    const total = res?.totalFilteredRecords || items.length;
    if (items.length < pageSize || all.length >= total) hasMore = false;
    else offset += pageSize;
  }

  const active = all.filter(l => l.status?.value?.toLowerCase() === 'active');
  if (onProgress) onProgress(0, active.length);
  if (active.length === 0) return [];

  // Fetch each active loan's repayment schedule (needed for days-past-due
  // classification) in small concurrent batches rather than one at a time.
  const detailed = [];
  const batchSize = 10;
  for (let i = 0; i < active.length; i += batchSize) {
    const batch = active.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(l => fineractApi(`/loans/${l.id}?associations=repaymentSchedule`))
    );
    results.forEach((r, idx) => {
      detailed.push(r.status === 'fulfilled' && r.value ? r.value : batch[idx]);
    });
    if (onProgress) onProgress(detailed.length, active.length);
  }
  return detailed;
}

/**
 * Fetches every data source the CBN / NDIC / Profit & Income reports need —
 * chart of accounts, full journal entry history through asOfDate, all active
 * loans (with repayment schedules, for aging), and every savings account.
 * Fetched once per "Generate" click and shared across all report tabs so
 * switching tabs doesn't re-fetch the same data.
 */
export function useReportingData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);

  const generate = useCallback(async (asOfDate) => {
    setLoading(true);
    setError(null);
    try {
      setProgress({ stage: 'Chart of accounts', loaded: 0, total: 0 });
      const glAccounts = await fineractApi('/glaccounts');

      // forceRefresh: true — this hook's whole purpose is a live snapshot on
      // demand; a same-day "Regenerate" click must never silently reuse a
      // cached fetch from before a posting/reversal that happened in between.
      const journalEntries = await fetchAllJournalEntries(
        { toDate: asOfDate },
        (loaded, total) => setProgress({ stage: 'Journal entries', loaded, total }),
        { forceRefresh: true },
      );

      const savingsAccounts = await fetchAllSavingsAccounts(
        (loaded, total) => setProgress({ stage: 'Savings accounts', loaded, total }),
      );

      const activeLoans = await fetchActiveLoansWithSchedule(
        (loaded, total) => setProgress({ stage: 'Loan portfolio', loaded, total }),
      );

      setData({
        glAccounts: Array.isArray(glAccounts) ? glAccounts : [],
        journalEntries,
        savingsAccounts,
        activeLoans,
        asOfDate,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }, []);

  return { data, loading, progress, error, generate };
}
