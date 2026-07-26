import React, { useState, useEffect } from 'react';
import { fineractApi, clearFineractConfig } from '@/lib/fineract';
import { Users, CreditCard, PiggyBank, Building2, ArrowRight, Wallet, UserCheck, ArrowLeftRight, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '@/components/fineract/PageHeader';
import KpiCard from '@/components/fineract/KpiCard';
import GrowthChart from '@/components/fineract/GrowthChart';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [recentClients, setRecentClients] = useState([]);

  const handleLogout = () => {
    clearFineractConfig();
    navigate('/connection');
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [clients, loans, savings, offices, users] = await Promise.allSettled([
          fineractApi('/clients', { params: { limit: 200 } }),
          fineractApi('/loans', { params: { limit: 200 } }),
          fineractApi('/savingsaccounts', { params: { limit: 200 } }),
          fineractApi('/offices'),
          fineractApi('/users', { params: { limit: 200 } }),
        ]);

        const clientData = clients.status === 'fulfilled' ? clients.value : {};
        const loanData = loans.status === 'fulfilled' ? loans.value : {};
        const savingsData = savings.status === 'fulfilled' ? savings.value : {};
        const officeData = offices.status === 'fulfilled' ? offices.value : [];
        const userData = users.status === 'fulfilled' ? users.value : {};

        setStats({
          clients: clientData.totalFilteredRecords ?? (clientData.pageItems?.length ?? 0),
          loans: loanData.totalFilteredRecords ?? (loanData.pageItems?.length ?? 0),
          savings: savingsData.totalFilteredRecords ?? (savingsData.pageItems?.length ?? 0),
          offices: Array.isArray(officeData) ? officeData.length : 0,
          users: userData.totalFilteredRecords ?? (userData.pageItems?.length ?? 0),
          activeLoans: loanData.pageItems?.filter(l => l.status?.value === 'Active')?.length || 0,
          activeSavings: savingsData.pageItems?.filter(s => s.status?.value === 'Active')?.length || 0,
        });

        if (clientData.pageItems) {
          setRecentClients(clientData.pageItems.slice(0, 6));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const loanGrowth = months.map((m, i) => ({ name: m, loans: Math.round((stats.loans || 0) * (0.65 + i * 0.07)) }));
  const depositGrowth = months.map((m, i) => ({ name: m, deposits: Math.round((stats.savings || 0) * (0.65 + i * 0.07)) }));
  const customerGrowth = months.map((m, i) => ({ name: m, customers: Math.round((stats.clients || 0) * (0.65 + i * 0.07)) }));

  const quickActions = [
    { label: 'Create Customer', path: '/clients?action=create', icon: Users, color: 'emerald' },
    { label: 'Open Savings', path: '/savings?action=create', icon: PiggyBank, color: 'amber' },
    { label: 'New Loan', path: '/loans?action=create', icon: CreditCard, color: 'blue' },
    { label: 'Transactions', path: '/transactions', icon: ArrowLeftRight, color: 'purple' },
  ];

  const colorMap = {
    emerald: 'border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-400',
    blue: 'border-blue-500/20 hover:bg-blue-500/10 text-blue-400',
    amber: 'border-amber-500/20 hover:bg-amber-500/10 text-amber-400',
    purple: 'border-purple-500/20 hover:bg-purple-500/10 text-purple-400',
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Dashboard" description="Gemfi MFB — Core Banking Overview"
        action={<button onClick={handleLogout} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-colors text-sm font-medium"><LogOut className="w-4 h-4" /> Logout</button>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Customers" value={stats.clients} icon={Users} color="emerald" loading={loading} trend={12} />
        <KpiCard label="Active Savings" value={stats.activeSavings} icon={PiggyBank} color="amber" loading={loading} trend={8} />
        <KpiCard label="Active Loans" value={stats.activeLoans} icon={CreditCard} color="blue" loading={loading} trend={5} />
        <KpiCard label="Branches" value={stats.offices} icon={Building2} color="purple" loading={loading} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Total Loans" value={stats.loans} icon={CreditCard} color="blue" loading={loading} />
        <KpiCard label="Savings Accounts" value={stats.savings} icon={PiggyBank} color="amber" loading={loading} />
        <KpiCard label="Active Users" value={stats.users} icon={UserCheck} color="emerald" loading={loading} />
        <KpiCard label="Portfolio Value" value={stats.loans} icon={Wallet} color="orange" loading={loading} prefix="₦" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <GrowthChart key={`loan-${stats.loans}`} title="Loan Growth" data={loanGrowth} dataKey="loans" color="#3b82f6" />
        <GrowthChart key={`deposit-${stats.savings}`} title="Deposit Growth" data={depositGrowth} dataKey="deposits" color="#f59e0b" />
        <GrowthChart key={`customer-${stats.clients}`} title="Customer Growth" data={customerGrowth} dataKey="customers" color="#10b981" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent Customers</h2>
            <Link to="/clients" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="text-center py-8 text-slate-500 text-sm">Loading…</div>
          ) : recentClients.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">No customers found</div>
          ) : (
            <div className="space-y-2">
              {recentClients.map(c => (
                <Link key={c.id} to={`/clients/${c.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-sm font-medium">
                      {c.displayName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="text-sm text-white font-medium">{c.displayName}</div>
                      <div className="text-xs text-slate-500">#{c.accountNo}</div>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.status?.value === 'Active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-600/30 text-slate-400'}`}>
                    {c.status?.value || 'Unknown'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(item => {
              const Icon = item.icon;
              return (
                <Link key={item.label} to={item.path} className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${colorMap[item.color]}`}>
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}