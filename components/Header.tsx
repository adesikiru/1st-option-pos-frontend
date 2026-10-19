'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { api, getStoredUser } from '@/lib/api';
import { User } from '@/lib/types';

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  if (pathname === '/login') return null;

  const baseNavItems = [
    { label: 'POS Terminal', href: '/pos', icon: ShoppingCart, highlight: true },
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Products', href: '/products', icon: Package },
    { label: 'Inventory', href: '/inventory', icon: Boxes },
    { label: 'Sales History', href: '/sales', icon: Receipt },
    { label: 'Suppliers', href: '/suppliers', icon: Truck },
    { label: 'CSV Import', href: '/imports', icon: FileSpreadsheet },
    { label: 'Reports', href: '/reports', icon: BarChart3 },
  ];

  const navItems = user?.role === 'ADMIN'
    ? [...baseNavItems, { label: 'Users', href: '/users', icon: UserIcon }]
    : baseNavItems;

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    MANAGER: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    INVENTORY_OFFICER: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    CASHIER: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Flame className="w-6 h-6 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  1st Option POS
                </span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Mart
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-none">1st Option Energy Mart</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    item.highlight
                      ? isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                      : isActive
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.highlight && !isActive ? 'text-emerald-400' : ''}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User profile & Logout */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm font-semibold text-slate-200 leading-tight">
                    {user.name}
                  </span>
                  <span
                    className={`inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded border mt-0.5 ${
                      roleColors[user.role] || 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {user.role.replace('_', ' ')}
                  </span>
                </div>
                <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shadow-inner">
                  <UserIcon className="w-4 h-4" />
                </div>
                <button
                  onClick={() => api.logout()}
                  title="Sign out"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-md"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-800/80 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
