import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useBranding, isPlatformHost } from '@/lib/branding';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';

// Layout
import AppLayout from '@/components/fineract/AppLayout';

// Pages
import Connection from '@/pages/Connection';
import Dashboard from '@/pages/Dashboard';
import Clients from '@/pages/Clients';
import ClientDetail from '@/pages/ClientDetail';
import Loans from '@/pages/Loans';
import LoanDetail from '@/pages/LoanDetail';
import Savings from '@/pages/Savings';
import SavingsDetail from '@/pages/SavingsDetail';
import Groups from '@/pages/Groups';
import GroupDetail from '@/pages/GroupDetail';
import AccountingDashboard from '@/pages/accounting/AccountingDashboard';
import GLAccounts from '@/pages/accounting/GLAccounts';
import JournalEntries from '@/pages/accounting/JournalEntries';
import GLClosures from '@/pages/accounting/GLClosures';
import FinancialMappings from '@/pages/accounting/FinancialMappings';
import CapitalTransaction from '@/pages/accounting/operations/CapitalTransaction';
import ManualJournalEntry from '@/pages/accounting/operations/ManualJournalEntry';
import ExpenseEntry from '@/pages/accounting/operations/ExpenseEntry';
import OtherIncomeEntry from '@/pages/accounting/operations/OtherIncomeEntry';
import MakerCheckerSettings from '@/pages/accounting/operations/MakerCheckerSettings';
import CheckerInbox from '@/pages/accounting/operations/CheckerInbox';
import GeneralLedger from '@/pages/accounting/GeneralLedger';
import TrialBalance from '@/pages/accounting/TrialBalance';
import LoanProducts from '@/pages/products/LoanProducts';
import LoanProductWizard from '@/pages/products/LoanProductWizard';
import LoanProductDetail from '@/pages/products/LoanProductDetail';
import SavingsProducts from '@/pages/products/SavingsProducts';
import SavingsProductWizard from '@/pages/products/SavingsProductWizard';
import Charges from '@/pages/products/Charges';
import Offices from '@/pages/organization/Offices';
import Staff from '@/pages/organization/Staff';
import Currencies from '@/pages/organization/Currencies';
import Funds from '@/pages/organization/Funds';
import Users from '@/pages/system/Users';
import Roles from '@/pages/system/Roles';
import RoleDetail from '@/pages/system/RoleDetail';
import Codes from '@/pages/system/Codes';
import DataTables from '@/pages/system/DataTables';
import ApiExplorer from '@/pages/ApiExplorer';
import Transactions from '@/pages/Transactions';
import Deposit from '@/pages/Deposit';
import Reports from '@/pages/Reports';
import AuditTrail from '@/pages/AuditTrail';
import Compliance from '@/pages/Compliance';
import KycDashboard from '@/pages/KycDashboard';
import CommercialOfferings from '@/pages/CommercialOfferings';
import Agents from '@/pages/Agents';
import AgentDetail from '@/pages/AgentDetail';
import Merchants from '@/pages/Merchants';
import MerchantDetail from '@/pages/MerchantDetail';

/**
 * This app connects directly to an external Fineract API.
 * Base44 auth is not used for gating — the Connection page is the entry point.
 * Credentials are stored in localStorage and sent to the Fineract server.
 */
const AuthenticatedApp = () => {
  useAuth(); // required by platform; auth state is not used for access control

  return (
    <Routes>
      <Route path="/connection" element={<Connection />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/:id" element={<ClientDetail />} />
        <Route path="/loans" element={<Loans />} />
        <Route path="/loans/:id" element={<LoanDetail />} />
        <Route path="/savings" element={<Savings />} />
        <Route path="/savings/:id" element={<SavingsDetail />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/groups/:id" element={<GroupDetail />} />
        <Route path="/accounting/dashboard" element={<AccountingDashboard />} />
        <Route path="/accounting/gl-accounts" element={<GLAccounts />} />
        <Route path="/accounting/journal-entries" element={<JournalEntries />} />
        <Route path="/accounting/general-ledger" element={<GeneralLedger />} />
        <Route path="/accounting/trial-balance" element={<TrialBalance />} />
        <Route path="/accounting/closures" element={<GLClosures />} />
        <Route path="/accounting/financial-mappings" element={<FinancialMappings />} />
        <Route path="/accounting/operations/capital" element={<CapitalTransaction />} />
        <Route path="/accounting/operations/journal-entry" element={<ManualJournalEntry />} />
        <Route path="/accounting/operations/expense" element={<ExpenseEntry />} />
        <Route path="/accounting/operations/income" element={<OtherIncomeEntry />} />
        <Route path="/accounting/operations/maker-checker-settings" element={<MakerCheckerSettings />} />
        <Route path="/accounting/operations/checker-inbox" element={<CheckerInbox />} />
        <Route path="/products/loan" element={<LoanProducts />} />
        <Route path="/products/loan/create" element={<LoanProductWizard />} />
        <Route path="/products/loan/:id" element={<LoanProductDetail />} />
        <Route path="/products/loan/:id/edit" element={<LoanProductWizard />} />
        <Route path="/products/savings" element={<SavingsProducts />} />
        <Route path="/products/savings/create" element={<SavingsProductWizard />} />
        <Route path="/products/savings/:id/edit" element={<SavingsProductWizard />} />
        <Route path="/products/charges" element={<Charges />} />
        <Route path="/organization/offices" element={<Offices />} />
        <Route path="/organization/staff" element={<Staff />} />
        <Route path="/organization/currencies" element={<Currencies />} />
        <Route path="/organization/funds" element={<Funds />} />
        <Route path="/system/users" element={<UsersRolesGuard><Users /></UsersRolesGuard>} />
        <Route path="/system/roles" element={<UsersRolesGuard><Roles /></UsersRolesGuard>} />
        <Route path="/system/roles/:id" element={<UsersRolesGuard><RoleDetail /></UsersRolesGuard>} />
        <Route path="/system/codes" element={<Codes />} />
        <Route path="/system/datatables" element={<DataTables />} />
        <Route path="/api-explorer" element={<ApiExplorer />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/deposit" element={<Deposit />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/audit-trail" element={<AuditTrail />} />
        <Route path="/compliance" element={<Compliance />} />
        <Route path="/kyc-dashboard" element={<KycDashboard />} />
        <Route path="/commercial-offerings" element={<CommercialOfferings />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/agents/:id" element={<AgentDetail />} />
        <Route path="/merchants" element={<Merchants />} />
        <Route path="/merchants/:id" element={<MerchantDetail />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

// Guards direct navigation to Users/Roles routes the same way Sidebar hides
// their nav links - hiding the link alone doesn't stop someone typing the
// URL in directly. See Sidebar.jsx for the full rationale.
function UsersRolesGuard({ children }) {
  const branding = useBranding();
  const canManageUsersRoles = isPlatformHost(window.location.hostname) || branding.tier === 'enterprise';
  if (!canManageUsersRoles) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App