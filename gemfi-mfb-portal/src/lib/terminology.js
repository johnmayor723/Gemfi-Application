import { useBranding } from '@/lib/branding';

/**
 * UI-only label set per institution type. Does not change the underlying
 * GemFi Core (Fineract) product configuration - a cooperative or loan
 * company tenant still runs on the same savings/loan product types as a
 * bank tenant, just relabeled. Cooperatives are explicitly NOT
 * deposit-taking, so "Savings"/"Deposit" never appear in their UI -
 * "Contributions"/"Contribute" instead. Loan companies don't take
 * member contributions or savings at all, so those nav items are hidden
 * rather than relabeled (see showSavings).
 */
const TERMINOLOGY = {
  bank: {
    clients: 'Clients',
    clientSingular: 'Client',
    savings: 'Savings',
    savingsAccounts: 'Savings Accounts',
    savingsProducts: 'Savings Products',
    deposit: 'Deposit',
    depositDescription: 'Post a deposit to an active savings account',
    showSavings: true,
  },
  cooperative: {
    clients: 'Members',
    clientSingular: 'Member',
    savings: 'Contributions',
    savingsAccounts: 'Contribution Accounts',
    savingsProducts: 'Contribution Products',
    deposit: 'Contribute',
    depositDescription: "Post a contribution to an active member's contribution account",
    showSavings: true,
  },
  loan_company: {
    clients: 'Borrowers',
    clientSingular: 'Borrower',
    savings: 'Savings',
    savingsAccounts: 'Savings Accounts',
    savingsProducts: 'Savings Products',
    deposit: 'Deposit',
    depositDescription: 'Post a deposit to an active savings account',
    showSavings: false,
  },
};

export function terminologyFor(institutionType) {
  return TERMINOLOGY[institutionType] || TERMINOLOGY.bank;
}

export function useTerminology() {
  const branding = useBranding();
  return terminologyFor(branding.institutionType);
}
