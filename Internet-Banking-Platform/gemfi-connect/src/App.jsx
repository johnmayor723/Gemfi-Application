import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import ScrollToTop from './components/ScrollToTop';
import BankAuthProvider from '@/auth/AuthProvider';
import BankProtectedRoute from '@/auth/ProtectedRoute';
import BankLayout from '@/components/BankLayout';
import Login from '@/pages/Login';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import StartEnrollment from '@/pages/enrollment/StartEnrollment';
import VerifyOtp from '@/pages/enrollment/VerifyOtp';
import CompleteEnrollment from '@/pages/enrollment/CompleteEnrollment';
import Dashboard from '@/pages/Dashboard';
import Accounts from '@/pages/Accounts';
import Transactions from '@/pages/Transactions';
import Transfers from '@/pages/Transfers';
import Payments from '@/pages/Payments';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import Beneficiaries from '@/pages/Beneficiaries';
import Notifications from '@/pages/Notifications';
import Statements from '@/pages/Statements';
import StandingOrders from '@/pages/StandingOrders';
import BulkTransfers from '@/pages/BulkTransfers';

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <ScrollToTop />
        <BankAuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/register" element={<StartEnrollment />} />
            <Route path="/register/verify" element={<VerifyOtp />} />
            <Route path="/register/complete" element={<CompleteEnrollment />} />
            <Route element={<BankProtectedRoute />}>
              <Route element={<BankLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/accounts" element={<Accounts />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/transfers" element={<Transfers />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/beneficiaries" element={<Beneficiaries />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/statements" element={<Statements />} />
                <Route path="/standing-orders" element={<StandingOrders />} />
                <Route path="/bulk-transfers" element={<BulkTransfers />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </BankAuthProvider>
      </Router>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App
