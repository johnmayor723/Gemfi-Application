import { useState, useEffect, useCallback, useRef } from 'react';
import { fineractApi } from '@/lib/fineract';
import { getCachedEntries, setCachedEntries, getCacheKey } from '@/lib/journalEntryCache';

/**
 * Fetches journal entries with server-side pagination, sorting, and filtering.
 * @param {object} filters - { officeId, glAccountId, transactionId, entryType, fromDate, toDate, manualEntriesOnly, loanId, savingsAccountId, clientId, currencyCode }
 * @param {number} page - 0-indexed page number
 * @param {number} pageSize - records per page
 * @param {{ field: string, direction: 'ASC'|'DESC' }} sortConfig
 */
export function useJournalEntries(filters, page, pageSize, sortConfig) {
  const [entries, setEntries] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = buildParams(filters, page, pageSize, sortConfig);
      const res = await fineractApi('/journalentries', { params });
      setEntries(res?.pageItems || []);
      setTotalRecords(res?.totalFilteredRecords || res?.pageItems?.length || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters), page, pageSize, JSON.stringify(sortConfig)]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return { entries, totalRecords, loading, error, refetch: fetchEntries };
}

/**
 * Fetches ALL journal entries matching the given filters (for Trial Balance / General Ledger aggregation).
 * Paginates through the API until all records are retrieved.
 *
 * Pass `{ forceRefresh: true }` to bypass the 5-minute cache — required
 * anywhere the caller's whole point is "give me the current live state"
 * (e.g. the Reports page's "Generate"/"Regenerate" button). Without it, a
 * second click within the cache TTL silently reuses a snapshot from before
 * any server-side changes (postings, reversals) that happened in between.
 */
export async function fetchAllJournalEntries(filters, onProgress, { forceRefresh = false } = {}) {
  // Some Fineract deployments require fromDate/toDate — use a wide default if omitted.
  const effectiveFilters = { ...filters };
  if (!effectiveFilters.fromDate) effectiveFilters.fromDate = '2000-01-01';
  if (!effectiveFilters.toDate) effectiveFilters.toDate = '2099-12-31';

  const cacheKey = getCacheKey(effectiveFilters);
  if (!forceRefresh) {
    const cached = getCachedEntries(cacheKey);
    if (cached) {
      if (onProgress) onProgress(cached.length, cached.length);
      return cached;
    }
  }

  const pageSize = 200;
  let offset = 0;
  let all = [];
  let hasMore = true;

  while (hasMore) {
    const params = buildParams(effectiveFilters, 0, pageSize, null);
    params.offset = offset;
    const res = await fineractApi('/journalentries', { params });
    const items = res?.pageItems || [];
    all = all.concat(items);
    const total = res?.totalFilteredRecords || 0;
    if (onProgress) onProgress(all.length, total);
    if (items.length < pageSize || all.length >= total) {
      hasMore = false;
    } else {
      offset += pageSize;
    }
  }

  setCachedEntries(cacheKey, all);
  return all;
}

/**
 * Converts a Fineract transactionDate array [y, m, d] to a zero-padded
 * ISO-style string "YYYY-MM-DD" for correct lexicographic comparison
 * against HTML date input values.
 */
export function toISODate(arr) {
  if (!Array.isArray(arr) || arr.length < 3) return '';
  return arr.map(n => String(n).padStart(2, '0')).join('-');
}

/**
 * Fetches a single transaction's full double-entry by transactionId.
 */
export async function fetchTransactionEntries(transactionId) {
  const res = await fineractApi('/journalentries', { params: { transactionId } });
  return res?.pageItems || [];
}

function buildParams(filters, page, pageSize, sortConfig) {
  const params = {
    limit: pageSize,
    offset: page * pageSize,
    dateFormat: 'dd MMMM yyyy',
    locale: 'en',
  };

  if (sortConfig?.field) {
    params.orderBy = mapSortField(sortConfig.field);
    params.sortOrder = sortConfig.direction || 'DESC';
  } else {
    params.orderBy = 'transactionId';
    params.sortOrder = 'DESC';
  }

  if (filters) {
    if (filters.officeId) params.officeId = filters.officeId;
    if (filters.glAccountId) params.glAccountId = filters.glAccountId;
    if (filters.transactionId) params.transactionId = filters.transactionId;
    if (filters.entryType) params.entryType = filters.entryType;
    if (filters.fromDate) params.fromDate = toFineractDate(filters.fromDate);
    if (filters.toDate) params.toDate = toFineractDate(filters.toDate);
    if (filters.manualEntriesOnly !== undefined && filters.manualEntriesOnly !== null)
      params.manualEntriesOnly = filters.manualEntriesOnly;
    if (filters.loanId) params.loanId = filters.loanId;
    if (filters.savingsAccountId) params.savingsAccountId = filters.savingsAccountId;
    if (filters.clientId) params.clientId = filters.clientId;
    if (filters.currencyCode) params.currencyCode = filters.currencyCode;
  }

  return params;
}

function toFineractDate(isoDate) {
  if (!isoDate) return isoDate;
  // Accept YYYY-MM-DD (HTML date input) and convert to "dd MMMM yyyy"
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return isoDate;
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const day = parseInt(m[3], 10);
  const month = parseInt(m[2], 10);
  const year = m[1];
  return `${day} ${months[month - 1]} ${year}`;
}

function mapSortField(field) {
  const map = {
    transactionId: 'transactionId',
    transactionDate: 'transactionDate',
    glAccountCode: 'glAccountCode',
    glAccountName: 'accountName',
    amount: 'amount',
    officeName: 'officeName',
  };
  return map[field] || field;
}