'use client';

import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut, RefreshCw, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const DEMO_PERSONAS = [
  {
    name: 'Andi Pratama',
    role: 'PM',
    roleLabel: 'Product Manager',
    email: 'pm@nodewave.id',
    dept: 'PRODUCT',
    avatar: '/assets/avatars/avatar-ns.svg',
  },
  {
    name: 'Siti Rahma',
    role: 'INTERNAL_MEMBER',
    roleLabel: 'UI/UX Designer',
    email: 'uiux@nodewave.id',
    dept: 'UIUX',
    avatar: '/assets/avatars/avatar-sr.svg',
  },
  {
    name: 'Budi Santoso',
    role: 'INTERNAL_MEMBER',
    roleLabel: 'Frontend Engineer',
    email: 'frontend@nodewave.id',
    dept: 'FRONTEND',
    avatar: '/assets/avatars/avatar-bs.svg',
  },
  {
    name: 'Eko Wijaya',
    role: 'INTERNAL_MEMBER',
    roleLabel: 'Backend Engineer',
    email: 'backend@nodewave.id',
    dept: 'BACKEND',
    avatar: '/assets/avatars/avatar-ew.svg',
  },
  {
    name: 'PT Maju Jaya',
    role: 'CLIENT_GUEST',
    roleLabel: 'Client Guest',
    email: 'client@guest.com',
    dept: 'CLIENT',
    avatar: '/assets/avatars/avatar-nw.svg',
  },
];

export function getPersonaAvatar(email?: string, name?: string): string {
  if (!email && !name) return '/assets/avatars/avatar-ns.svg';
  const val = `${email || ''} ${name || ''}`.toLowerCase();
  if (val.includes('budi') || val.includes('frontend')) return '/assets/avatars/avatar-bs.svg';
  if (val.includes('eko') || val.includes('backend')) return '/assets/avatars/avatar-ew.svg';
  if (val.includes('siti') || val.includes('uiux')) return '/assets/avatars/avatar-sr.svg';
  if (val.includes('andi') || val.includes('niko') || val.includes('pm'))
    return '/assets/avatars/avatar-ns.svg';
  return '/assets/avatars/avatar-nw.svg';
}

interface SidebarProps {
  current: 'dashboard' | 'kanban';
  projectId?: string;
  onOpenStandupAI?: () => void;
}

export function Sidebar({ current, projectId, onOpenStandupAI }: SidebarProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, setAuth, clearAuth } = useAuthStore();
  const [isSwitching, setIsSwitching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleQuickSwitch = async (targetEmail: string) => {
    if (isSwitching || user?.email === targetEmail) return;
    setIsSwitching(true);
    try {
      const res = await api.post('/auth/quick-switch', { email: targetEmail });
      const { user: newUser, token } = res.data.data;
      setAuth(newUser, token);
      queryClient.clear();
      router.refresh();
    } catch {
      // Ignored
    } finally {
      setIsSwitching(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignored
    }
    clearAuth();
    queryClient.clear();
    router.push('/login');
  };

  const kanbanHref = projectId ? `/projects/${projectId}` : '/dashboard';
  const activeAvatar = getPersonaAvatar(user?.email, user?.name);

  return (
    <aside className="w-60 shrink-0 flex flex-col justify-between border-r border-slate-200/80 bg-white p-4 text-xs select-none shadow-2xs">
      <div className="space-y-4">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-1">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="relative h-8 w-8 shrink-0">
              <Image
                src="/nodewave-logo.png"
                alt="NodeWave Logo"
                width={32}
                height={32}
                className="h-full w-full object-contain filter drop-shadow-xs"
                priority
              />
            </div>
            <div className="min-w-0">
              <span className="text-base font-bold tracking-tight text-slate-900 block leading-tight">
                NodeWave
              </span>
              <span className="text-[10px] text-slate-400 font-medium block">
                Workspace Enterprise
              </span>
            </div>
          </Link>
          <button
            type="button"
            className="h-6 w-6 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            title="Toggle Sidebar"
          >
            <img
              src="/assets/navigation/arrow-right.svg"
              alt="Arrow"
              className="h-3 w-3 object-contain opacity-70"
            />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <img
            src="/assets/navigation/search.svg"
            alt="Search"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-50"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-full rounded-lg border border-slate-200 bg-[#f8fafc] pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Section: MAIN */}
        <div className="space-y-1">
          <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">MAIN</p>

          <Link
            href="/dashboard"
            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
              current === 'dashboard'
                ? 'bg-slate-100 font-bold text-slate-900'
                : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <img
              src="/assets/navigation/dashboard.svg"
              alt="Dashboard"
              className={`h-4 w-4 object-contain ${
                current === 'dashboard' ? 'opacity-100' : 'opacity-60'
              }`}
            />
            <span>Dashboard</span>
          </Link>

          <Link
            href={kanbanHref}
            className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
              current === 'kanban'
                ? 'bg-slate-100 font-bold text-slate-900'
                : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <img
                src="/assets/navigation/project-task.svg"
                alt="Project Task"
                className={`h-4 w-4 object-contain ${
                  current === 'kanban' ? 'opacity-100' : 'opacity-60'
                }`}
              />
              <span>Project Task</span>
            </div>
            <span className="rounded bg-blue-50 border border-blue-200 px-1 py-0.2 text-[9px] font-bold text-blue-600">
              DAG
            </span>
          </Link>

          <div className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer">
            <div className="flex items-center gap-2.5">
              <img
                src="/assets/navigation/inbox.svg"
                alt="Inbox"
                className="h-4 w-4 object-contain opacity-60"
              />
              <span>My Inbox</span>
            </div>
            <span className="h-4 min-w-4 px-1 rounded-full bg-slate-200 text-[9px] font-bold text-slate-700 flex items-center justify-center">
              3
            </span>
          </div>

          <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer">
            <img
              src="/assets/navigation/users.svg"
              alt="Meeting"
              className="h-4 w-4 object-contain opacity-60"
            />
            <span>Meeting</span>
          </div>

          <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer">
            <img
              src="/assets/navigation/calendar.svg"
              alt="Calendar"
              className="h-4 w-4 object-contain opacity-60"
            />
            <span>Calender</span>
          </div>
        </div>

        {/* Section: EXPLORE */}
        <div className="space-y-1 pt-1">
          <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            EXPLORE
          </p>

          <button
            type="button"
            onClick={onOpenStandupAI}
            className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
              <span>AI Assisten</span>
            </div>
            <span className="rounded bg-indigo-50 border border-indigo-200 px-1 py-0.2 text-[9px] font-bold text-indigo-600">
              AI
            </span>
          </button>

          <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer">
            <img
              src="/assets/navigation/reports.svg"
              alt="Reports"
              className="h-4 w-4 object-contain opacity-60"
            />
            <span>Reports</span>
          </div>

          <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer">
            <img
              src="/assets/navigation/team.svg"
              alt="Team"
              className="h-4 w-4 object-contain opacity-60"
            />
            <span>Team</span>
          </div>

          <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer">
            <img
              src="/assets/navigation/settings.svg"
              alt="Setting"
              className="h-4 w-4 object-contain opacity-60"
            />
            <span>Setting</span>
          </div>
        </div>
      </div>

      {/* Bottom Profile & Evaluator Tools */}
      <div className="space-y-3 pt-3 border-t border-slate-100">
        {/* Light Mode Indicator matching Canvaso */}
        <div className="flex items-center justify-between px-2 py-1 text-[11px] text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-500">☀</span>
            <span>Light Mode</span>
          </div>
          <div className="w-8 h-4 bg-blue-600 rounded-full relative p-0.5 flex items-center justify-end">
            <div className="w-3 h-3 bg-white rounded-full shadow-xs" />
          </div>
        </div>

        {/* User Profile Card */}
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={activeAvatar}
                alt={user?.name || 'User'}
                className="h-8 w-8 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-900">
                  {user?.name || 'Niko Satrio'}
                </p>
                <p className="truncate text-[10px] text-slate-500">
                  {user?.role === 'PM' && 'Lead Product Design'}
                  {user?.role === 'INTERNAL_MEMBER' && `${user.department} Engineer`}
                  {user?.role === 'CLIENT_GUEST' && 'Client Guest'}
                </p>
              </div>
            </div>

            <img
              src="/assets/navigation/chevron-down.svg"
              alt="Chevron"
              className="h-3 w-3 object-contain opacity-50 shrink-0"
            />
          </div>

          {/* Quick Evaluator Role Switcher */}
          <div className="mt-2.5 pt-2 border-t border-slate-200/60">
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1.5 font-medium">
              <span>Switch Persona:</span>
              {isSwitching && <RefreshCw className="h-2.5 w-2.5 animate-spin text-slate-600" />}
            </div>
            <div className="grid grid-cols-5 gap-1">
              {DEMO_PERSONAS.map((p) => {
                const isActive = user?.email === p.email;
                return (
                  <button
                    key={p.email}
                    type="button"
                    disabled={isSwitching}
                    onClick={() => handleQuickSwitch(p.email)}
                    title={`${p.name} (${p.roleLabel})`}
                    className={`h-6 rounded text-[9px] font-bold transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white font-extrabold shadow-xs scale-105 ring-1 ring-slate-900'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {p.dept.slice(0, 2)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-semibold text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 transition-colors shadow-2xs"
        >
          <LogOut className="h-3 w-3" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
