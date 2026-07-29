import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Users, CreditCard, PiggyBank, Building2, LayoutDashboard,
  Landmark, BookOpen, Settings, UsersRound, Terminal, ChevronDown,
  ChevronRight, Package, Shield, Globe, DollarSign, FileText,
  Briefcase, FolderOpen, X, Menu, ArrowLeftRight, BarChart3, ShieldCheck,
  UserCheck, ScrollText, Database, ArrowDownLeft, ScanFace, Scale,
  Wallet, PenSquare, Receipt, TrendingUp, Inbox, Sparkles
} from 'lucide-react';
import GemfiLogo from '@/components/fineract/GemfiLogo';

const navSections = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    ]
  },
  {
    label: 'Core Banking',
    items: [
      { label: 'Clients', path: '/clients', icon: Users },
      { label: 'Groups', path: '/groups', icon: UsersRound },
      { label: 'Loans', path: '/loans', icon: CreditCard },
      { label: 'Savings', path: '/savings', icon: PiggyBank },
      { label: 'Users', path: '/system/users', icon: UserCheck },
      { label: 'Roles & Permissions', path: '/system/roles', icon: Shield },
    ]
  },
  {
    label: 'Organization',
    items: [
      { label: 'Offices', path: '/organization/offices', icon: Building2 },
      { label: 'Staff', path: '/organization/staff', icon: Briefcase },
      { label: 'Currencies', path: '/organization/currencies', icon: Globe },
      { label: 'Fund Management', path: '/organization/funds', icon: Landmark },
    ]
  },
  {
    label: 'Products',
    items: [
      { label: 'Loan Products', path: '/products/loan', icon: Package },
      { label: 'Savings Products', path: '/products/savings', icon: Package },
      { label: 'Charges', path: '/products/charges', icon: DollarSign },
    ]
  },
  {
    label: 'Accounting',
    items: [
      { label: 'Dashboard', path: '/accounting/dashboard', icon: LayoutDashboard },
      { label: 'Trial Balance', path: '/accounting/journal-entries', icon: FileText },
      { label: 'General Ledger', path: '/accounting/general-ledger', icon: BookOpen },
      { label: 'Chart of Accounts', path: '/accounting/gl-accounts', icon: ArrowLeftRight },
      { label: 'Trial Balance (Legacy)', path: '/accounting/trial-balance', icon: Scale, disabled: true },
      { label: 'Financial Reports', path: '/reports', icon: BarChart3 },
      { label: 'GL Closures', path: '/accounting/closures', icon: FolderOpen },
      { label: 'Financial Mappings', path: '/accounting/financial-mappings', icon: DollarSign },
    ]
  },
  {
    label: 'Accounting Operations',
    items: [
      { label: 'Capital Transactions', path: '/accounting/operations/capital', icon: Wallet },
      { label: 'Manual Journal Entry', path: '/accounting/operations/journal-entry', icon: PenSquare },
      { label: 'Expense Entry', path: '/accounting/operations/expense', icon: Receipt },
      { label: 'Other Income Entry', path: '/accounting/operations/income', icon: TrendingUp },
      { label: 'Maker-Checker Settings', path: '/accounting/operations/maker-checker-settings', icon: ShieldCheck },
      { label: 'Checker Inbox', path: '/accounting/operations/checker-inbox', icon: Inbox },
    ]
  },
  {
    label: 'Operations',
    items: [
      { label: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
      { label: 'Deposit', path: '/deposit', icon: ArrowDownLeft },
      { label: 'Reports', path: '/reports', icon: BarChart3 },
      { label: 'Audit Trail', path: '/audit-trail', icon: ScrollText },
      { label: 'Compliance', path: '/compliance', icon: ShieldCheck },
      { label: 'KYC Dashboard', path: '/kyc-dashboard', icon: ScanFace },
    ]
  },
  {
    label: 'Administration',
    items: [
      { label: 'Codes', path: '/system/codes', icon: ScrollText },
      { label: 'Data Tables', path: '/system/datatables', icon: Database },
    ]
  },
  {
    label: 'Settings',
    items: [
      { label: 'Connection', path: '/connection', icon: Settings },
      { label: 'API Explorer', path: '/api-explorer', icon: Terminal },
    ]
  },
  {
    label: 'Sales',
    items: [
      { label: 'Commercial Offerings', path: '/commercial-offerings', icon: Sparkles },
    ]
  }
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = React.useState({});

  const toggle = (label) => {
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-slate-950 border-r border-slate-800 flex flex-col
        transform transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <GemfiLogo className="w-9 h-9 flex-shrink-0" />
            <div className="leading-tight">
              <div className="text-base font-bold text-white tracking-tight">Gemfi MFB</div>
              <div className="text-[10px] text-slate-500 italic">...growing businesses</div>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {navSections.map(section => {
            const isCollapsed = collapsed[section.label];
            return (
              <div key={section.label}>
                <button
                  onClick={() => toggle(section.label)}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300"
                >
                  {section.label}
                  {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {!isCollapsed && (
                  <div className="space-y-0.5 mb-2">
                    {section.items.map(item => {
                      const Icon = item.icon;
                      const active = location.pathname === item.path;
                      if (item.disabled) {
                        return (
                          <div
                            key={item.path}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-600 cursor-not-allowed"
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            {item.label}
                            <span className="ml-auto text-[9px] uppercase tracking-wider text-slate-700">Off</span>
                          </div>
                        );
                      }
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={onClose}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                            active
                              ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-600">
          Gemfi Microfinance Bank · Fineract Console
        </div>
      </aside>
    </>
  );
}