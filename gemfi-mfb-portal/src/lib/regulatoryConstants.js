/**
 * CBN / NDIC regulatory constants used by the Reports module.
 *
 * These figures are sourced from published CBN and NDIC guidance (see citations
 * below) rather than from any report template already configured in this
 * Fineract instance — none exists yet. They are kept in one file, on purpose,
 * so the bank's compliance team can audit and correct them in a single place
 * before any of these numbers are relied on for an actual regulatory
 * submission. Guidelines get amended; treat every figure here as "best known
 * published value as of the last time someone checked", not as a live feed
 * from CBN/NDIC.
 */

/**
 * Minimum Capital Adequacy Ratio for microfinance banks.
 * Source: CBN Regulatory and Supervisory Framework for MFBs — "the minimum
 * Capital Adequacy Ratio for each Micro-Finance Institution shall be 10%."
 */
export const CBN_MIN_CAPITAL_ADEQUACY_RATIO = 0.10;

/**
 * Minimum Liquidity Ratio for microfinance banks (of deposit liabilities),
 * of which at least 5 percentage points must be held in Treasury Bills.
 * Source: CBN Regulatory and Supervisory Framework for MFBs.
 */
export const CBN_MIN_LIQUIDITY_RATIO = 0.20;
export const CBN_MIN_TBILL_SHARE_OF_DEPOSITS = 0.05;

/**
 * Loan / risk-asset classification buckets for the Portfolio-at-Risk section.
 * The 90 / 180 / 360-day boundaries for Substandard / Doubtful / Lost are
 * consistently documented across CBN prudential guidance. The "Watch-listed"
 * band (1–89 days) and its indicative provisioning rate are a conservative
 * placeholder pending confirmation against the current circular — everything
 * else here is the standard classification used across Nigerian banking.
 */
export const LOAN_CLASSIFICATION_BUCKETS = [
  { key: 'performing', label: 'Performing', minDays: 0, maxDays: 0, provisionRate: 0.01, note: 'General provision on performing loans' },
  { key: 'watch', label: 'Watch-listed', minDays: 1, maxDays: 89, provisionRate: 0.05, note: 'Indicative — confirm current CBN threshold for MFBs' },
  { key: 'substandard', label: 'Substandard', minDays: 90, maxDays: 179, provisionRate: 0.10, note: '90–179 days past due' },
  { key: 'doubtful', label: 'Doubtful', minDays: 180, maxDays: 359, provisionRate: 0.50, note: '180–359 days past due' },
  { key: 'lost', label: 'Lost', minDays: 360, maxDays: Infinity, provisionRate: 1.00, note: '360+ days past due' },
];

/**
 * Maximum deposit insurance coverage per depositor for microfinance banks.
 * Source: NDIC — reviewed upward from N200,000 to N2,000,000 per depositor
 * (NDIC MFB coverage review; NDIC payouts to failed-MFB depositors reference
 * the N2,000,000 ceiling).
 */
export const NDIC_MAX_INSURED_DEPOSIT_PER_DEPOSITOR = 2_000_000;

/**
 * Flat-rate deposit insurance premium for MFBs, assessed annually on the
 * preceding year's certified deposit liabilities.
 * Source: NDIC — "8/16 of 1% (i.e. 0.5%, 50 basis points) of certified
 * deposit liabilities for the preceding year."
 */
export const NDIC_PREMIUM_RATE = 0.005;

export const REGULATORY_ASSUMPTIONS_NOTE =
  'Figures on this page (loan classification thresholds, CAR/liquidity minimums, ' +
  'NDIC coverage limit and premium rate) are drawn from publicly published CBN and ' +
  'NDIC guidance, not from a report template on file with either regulator. ' +
  'Verify every threshold against the current circular before this is used for an ' +
  'actual submission.';
