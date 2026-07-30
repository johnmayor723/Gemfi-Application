import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { isConfigured } from '@/lib/fineract';
import { useBranding } from '@/lib/branding';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const branding = useBranding();
  const urlParams = new URLSearchParams(window.location.search);

  if (!isConfigured()) {
    return <Navigate to="/connection" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-950 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm">{branding.companyName} MFB Console</span>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}