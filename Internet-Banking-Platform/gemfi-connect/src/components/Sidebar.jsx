import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, WalletCards, ReceiptText, ArrowLeftRight, Repeat, Layers, Users, Landmark, FileText, Bell, UserRound, ShieldCheck, LogOut, X } from 'lucide-react';
import { useBankAuth } from '@/auth/AuthProvider';
import Logo from '@/components/Logo';
const links = [
  ['Dashboard', '/', LayoutDashboard],
  ['Accounts', '/accounts', WalletCards],
  ['Transactions', '/transactions', ReceiptText],
  ['Transfers', '/transfers', ArrowLeftRight],
  ['Standing orders', '/standing-orders', Repeat],
  ['Bulk transfers', '/bulk-transfers', Layers],
  ['Beneficiaries', '/beneficiaries', Users],
  ['Payments', '/payments', Landmark],
  ['Statements', '/statements', FileText],
  ['Notifications', '/notifications', Bell],
  ['Profile', '/profile', UserRound],
  ['Security', '/settings', ShieldCheck],
];
export default function Sidebar({ open, onClose }) {
  const { signOut } = useBankAuth();
  return (
    <aside className={`fixed md:sticky top-0 z-40 h-screen w-64 bg-[#252323] text-white flex flex-col transition-transform ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      <div className="h-20 px-5 flex items-center justify-between bg-white shrink-0">
        <Logo tagline className="text-lg" />
        <button onClick={onClose} className="md:hidden text-slate-700"><X /></button>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {links.map(([label, to, Icon]) => (
          <NavLink key={to} to={to} end={to === '/'} onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition ${isActive ? 'bg-[#ff832e] text-white' : 'text-slate-300 hover:bg-white/10'}`}>
            <Icon size={19} />{label}
          </NavLink>
        ))}
      </nav>
      <button onClick={signOut} className="shrink-0 m-3 flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/10">
        <LogOut size={19} />Logout
      </button>
    </aside>
  );
}
