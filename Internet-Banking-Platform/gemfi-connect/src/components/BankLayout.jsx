import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
export default function BankLayout() {
  const [open,setOpen]=useState(false);
  return <div className="min-h-screen bg-[#f5f7f6] md:grid md:grid-cols-[256px_1fr]"><Sidebar open={open} onClose={()=>setOpen(false)}/><div className="min-w-0"><Navbar onMenu={()=>setOpen(true)}/><main className="p-4 md:p-7 max-w-7xl mx-auto"><Outlet/></main></div>{open&&<button aria-label="Close navigation" onClick={()=>setOpen(false)} className="fixed inset-0 bg-black/40 z-30 md:hidden"/>}</div>;
}