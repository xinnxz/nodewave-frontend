'use client';

import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import type { User } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { DepartmentBadge, RoleBadge } from './status-badge';

const DEMO_ACCOUNTS = [
  { label: 'PM (Andi Pratama)', email: 'pm@nodewave.id', role: 'PM' },
  { label: 'UI/UX (Sari Dewi)', email: 'uiux@nodewave.id', role: 'UI/UX' },
  { label: 'Frontend (Budi Santoso)', email: 'frontend@nodewave.id', role: 'FE' },
  { label: 'Backend (Cahya Wijaya)', email: 'backend@nodewave.id', role: 'BE' },
  { label: 'Client Guest (PT Maju Jaya)', email: 'client@guest.com', role: 'CLIENT' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, setAuth, clearAuth } = useAuthStore();
  const [switchingEmail, setSwitchingEmail] = useState<string | null>(null);

  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/projects')
  ) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Tetap bersihkan state lokal meskipun token sudah expired
    }
    clearAuth();
    queryClient.clear();
    router.push('/login');
  };

  const handleQuickSwitch = async (email: string) => {
    if (user?.email === email) return;
    setSwitchingEmail(email);
    try {
      const res = await api.post<{
        success: boolean;
        data: { user: User; token: string };
      }>('/auth/login', {
        email,
        password: 'Password123!',
      });
      setAuth(res.data.data.user, res.data.data.token);
      await queryClient.invalidateQueries();
      router.refresh();
    } catch (err) {
      console.error('Failed to switch account', err);
    } finally {
      setSwitchingEmail(null);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 text-slate-900 focus:outline-2 focus:outline-offset-2 focus:outline-[#0052CC]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0052CC] text-sm font-bold tracking-tight text-white">
              NW
            </div>
            <div>
              <span className="block text-base font-bold tracking-tight text-slate-900">
                NodeWave
              </span>
              <span className="block text-[11px] font-medium text-slate-600">
                Deliverables Backbone
              </span>
            </div>
          </Link>

          {user && (
            <nav className="hidden items-center gap-1 md:flex" aria-label="Main Navigation">
              <Link
                href="/dashboard"
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  pathname === '/dashboard'
                    ? 'bg-slate-100 text-[#0052CC]'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                Projects Overview
              </Link>
            </nav>
          )}
        </div>

        {user && (
          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Role Switcher untuk mempermudah Evaluator menguji RBAC/ABAC/Masking */}
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1">
              <span className="text-xs font-medium text-slate-600">Quick Switch:</span>
              <select
                aria-label="Quick switch demo account"
                value={user.email}
                disabled={Boolean(switchingEmail)}
                onChange={(e) => handleQuickSwitch(e.target.value)}
                className="cursor-pointer rounded bg-white px-2 py-1 text-xs font-semibold text-slate-900 border border-slate-300 focus:outline-2 focus:outline-[#0052CC]"
              >
                {DEMO_ACCOUNTS.map((acc) => (
                  <option key={acc.email} value={acc.email}>
                    {acc.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden items-center gap-2 border-l border-slate-200 pl-3 sm:flex">
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-900">{user.name}</p>
                <div className="mt-0.5 flex items-center justify-end gap-1.5">
                  <RoleBadge role={user.role} />
                  <DepartmentBadge department={user.department} />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="min-h-[38px] rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 focus:outline-2 focus:outline-offset-2 focus:outline-[#0052CC]"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
