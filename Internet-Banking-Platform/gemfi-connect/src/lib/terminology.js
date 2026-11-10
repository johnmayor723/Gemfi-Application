import { useBranding } from '@/lib/branding';

/**
 * UI-only label set per institution type - mirrors
 * gemfi-mfb-portal/src/lib/terminology.js. Doesn't change the
 * underlying GemFi Core (Fineract) product configuration.
 * Cooperatives are explicitly NOT deposit-taking, so
 * "savings"/"deposit" never appear in their copy here either -
 * "contribution"/"contribute" instead. Loan companies don't take
 * member contributions or savings at all.
 */
const TERMINOLOGY = {
  bank: {
    accountsDescription: 'View your savings and loan accounts.',
  },
  cooperative: {
    accountsDescription: 'View your contribution and loan accounts.',
  },
  loan_company: {
    accountsDescription: 'View your loan accounts.',
  },
};

export function terminologyFor(institutionType) {
  return TERMINOLOGY[institutionType] || TERMINOLOGY.bank;
}

export function useTerminology() {
  const branding = useBranding();
  return terminologyFor(branding.institutionType);
}
