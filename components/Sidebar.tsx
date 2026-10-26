'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShoppingCart,
  LayoutDashboard,
  Package,
  Boxes,
  Receipt,
  FileSpreadsheet,
  Truck,
  BarChart3,
  LogOut,
  User as UserIcon,
  Flame,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { api, getStoredUser } from '@/lib/api';
import { User } from '@/lib/types';

interface SidebarProps {
  children: React.ReactNode;
}

export default function SidebarLayout({ children }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const refreshUser = useCallback(() => {
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    refreshUser();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === 'token') {
        refreshUser();
      }
    };
    const handleAuthChange = () => refreshUser();

    window.addEventListener('storage', handleStorage);
    window.addEventListener('auth-changed', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('auth-changed', handleAuthChange);
    };
  }, [refreshUser]);

  useEffect(() => {
    refreshUser();
    setMobileOpen(false);
  }, [pathname, refreshUser]);

  // If on login page, render children without sidebar
  if (pathname === '/login') {
    return <>{children}</>;
  }

  const roleColors: Record<string, { bg: string; text: string; border: string }> = {
    ADMIN: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
    MANAGER: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
    INVENTORY_OFFICER: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
    CASHIER: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  };

  const navSections = [
    {
      title: 'OPERATIONS',
      items: [
        {
          label: 'POS Terminal',
          href: '/pos',
          icon: ShoppingCart,
          badge: 'Live',
          highlight: true,
          desc: 'Checkout register',
        },
        {
          label: 'Dashboard',
          href: '/dashboard',
          icon: LayoutDashboard,
          desc: 'Daily overview & KPIs',
        },
        {
          label: 'Sales History',
          href: '/sales',
          icon: Receipt,
          desc: 'Receipts & audits',
        },
      ],
    },
    {
      title: 'INVENTORY & CATALOG',
      items: [
        {
          label: 'Products',
          href: '/products',
          icon: Package,
          desc: 'QuickBooks items list',
        },
        {
          label: 'Inventory',
          href: '/inventory',
          icon: Boxes,
          desc: 'Stock counts & adjustments',
        },
        {
          label: 'Suppliers',
          href: '/suppliers',
          icon: Truck,
          desc: 'Vendors & stock receipts',
        },
        {
          label: 'CSV Import',
          href: '/imports',
          icon: FileSpreadsheet,
          desc: 'Bulk batch upload',
        },
      ],
    },
    {
      title: 'FINANCE & REPORTS',
      items: [
        {
          label: 'Reports & Analytics',
          href: '/reports',
          icon: BarChart3,
          desc: 'Item & Inventory summaries',
        },
      ],
    },
  ];

  if (user?.role === 'ADMIN') {
    navSections.push({
      title: 'MANAGEMENT',
      items: [
        {
          label: 'Staff Users',
          href: '/users',
          icon: UserIcon,
          desc: 'Cashiers & access control',
        },
      ],
    });
  }

  const roleStyle = user?.role
    ? roleColors[user.role] || { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700' }
    : { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700' };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 border-r border-slate-800/80 select-none">
      {/* Brand Header */}
      <div className="p-5 pb-4 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-transparent">
        <Link href="/dashboard" className="flex items-center gap-3.5 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform shrink-0 ring-1 ring-emerald-400/40">
            <Flame className="w-6 h-6 text-slate-950 fill-slate-950" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent truncate">
                1st Option POS
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 truncate">Energy Mart • Store #1</p>
          </div>
        </Link>
      </div>

      {/* Chunky Quick POS Banner */}
      <div className="px-4 pt-4">
        <Link
          href="/pos"
          className={`flex items-center justify-between p-3.5 rounded-2xl transition-all shadow-md active:scale-[0.98] ${
            pathname === '/pos'
              ? 'bg-emerald-600 text-white shadow-emerald-900/40 ring-2 ring-emerald-400'
              : 'bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${pathname === '/pos' ? 'bg-emerald-700 text-white' : 'bg-emerald-500/20 text-emerald-400'}`}>
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">POS Terminal</p>
              <p className="text-[11px] text-emerald-300/80">Press for register</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 uppercase tracking-wider">
            F2
          </span>
        </Link>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 thin-scroll">
        {navSections.map((sec) => (
          <div key={sec.title} className="space-y-1.5">
            <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase px-3 mb-2">
              {sec.title}
            </p>
            <div className="space-y-1">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-slate-800/90 text-white font-semibold shadow-inner border border-slate-700/80 ring-1 ring-white/10'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                      </div>
                      <div className="min-w-0 text-left">
                        <p className={`text-sm leading-tight truncate ${isActive ? 'text-white' : ''}`}>
                          {item.label}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate leading-none mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Profile & Sign Out Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
        {user ? (
          <div className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-sm shrink-0 shadow-inner">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate leading-tight">
                  {user.name}
                </p>
                <span
                  className={`inline-block text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded border mt-0.5 ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
                >
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            </div>
            <button
              onClick={() => api.logout()}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-md"
          >
            Sign In
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      {/* Mobile Top Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-slate-950 text-white border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-md">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center">
            <Flame className="w-4 h-4 text-slate-950 fill-slate-950" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight">1st Option POS</span>
            <span className="ml-1.5 text-[9px] uppercase px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Mart
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/pos"
            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs flex items-center gap-1.5"
          >
            <ShoppingCart className="w-3.5 h-3.5" /> POS
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Chunky Sidebar */}
      <aside className="hidden lg:block w-72 h-screen sticky top-0 shrink-0 shadow-2xl z-30">
        {sidebarContent}
      </aside>

      {/* Main Page Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
