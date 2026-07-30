import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { useBankAuth } from '@/auth/AuthProvider';
export default function Navbar({ onMenu }) {
  const { user } = useBankAuth();
  return <header className="h-16 border-b bg-white flex items-center justify-between px-4 md:px-7 sticky top-0 z-20"><button onClick={onMenu} className="md:hidden p-2" aria-label="Open navigation"><Menu /></button><div className="hidden md:block"><p className="text-xs text-slate-500">Internet Banking</p><p className="font-semibold text-slate-800">Good day, {user?.fullName || user?.full_name || 'Customer'}</p></div><div className="flex items-center gap-4"><Link to="/notifications" className="relative p-2 rounded-full hover:bg-slate-100" aria-label="Notifications"><Bell size={20}/><span className="absolute top-2 right-2 w-2 h-2 bg-[hsl(var(--brand-secondary))] rounded-full" /></Link><Link to="/profile" className="w-9 h-9 rounded-full bg-[hsl(var(--primary))] text-white grid place-items-center font-semibold">{(user?.fullName || user?.full_name || 'C')[0]}</Link></div></header>;
}
