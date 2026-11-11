'use client';

import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown, LogOut, RefreshCw, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export const DEMO_PERSONAS = [
  {
    name: 'Andi Pratama',
    role: 'PM',
    code: 'PR',
    roleLabel: 'Product Manager',
    email: 'pm@nodewave.id',
    dept: 'PRODUCT',
    avatar: '/assets/avatars/avatar-ns.svg',
  },
  {
    name: 'Siti Rahma',
    role: 'INTERNAL_MEMBER',
    code: 'UI',
    roleLabel: 'UI/UX Designer',
    email: 'uiux@nodewave.id',
    dept: 'UIUX',
    avatar: '/assets/avatars/avatar-sr.svg',
  },
  {
    name: 'Budi Santoso',
    role: 'INTERNAL_MEMBER',
    code: 'FR',
    roleLabel: 'Frontend Engineer',
    email: 'frontend@nodewave.id',
    dept: 'FRONTEND',
    avatar: '/assets/avatars/avatar-bs.svg',
  },
  {
    name: 'Eko Wijaya',
    role: 'INTERNAL_MEMBER',
    code: 'BA',
    roleLabel: 'Backend Architect',
    email: 'backend@nodewave.id',
    dept: 'BACKEND',
    avatar: '/assets/avatars/avatar-ew.svg',
  },
  {
    name: 'PT Maju Jaya',
    role: 'CLIENT_GUEST',
    code: 'CL',
    roleLabel: 'Client Guest (Tenant)',
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
  const queryClient = useQueryClient();
  const { user, setAuth, clearAuth } = useAuthStore();
  const [isSwitching, setIsSwitching] = useState(false);
  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleQuickSwitch = async (targetEmail: string) => {
    if (isSwitching || user?.email === targetEmail) return;
    setIsSwitching(true);
    try {
      let newUser = null;
      let token = null;

      // 1. Coba fast quick-switch endpoint
      try {
        const res = await api.post('/auth/quick-switch', { email: targetEmail });
        newUser = res.data.data.user;
        token = res.data.data.token;
      } catch {
        // 2. Fallback ke login standar
        const res = await api.post('/auth/login', {
          email: targetEmail,
          password: 'Password123!',
        });
        newUser = res.data.data.user;
        token = res.data.data.token;
      }

      if (newUser && token) {
        setAuth(newUser, token);
        queryClient.clear();
        setIsPersonaMenuOpen(false);
        // Reload halaman untuk merender ulang seluruh komponen sesuai peran baru
        window.location.reload();
      }
    } catch (err) {
      console.error('Gagal beralih persona:', err);
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
    window.location.href = '/login';
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
            title="Navigasi"
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

          {/* 1. Dashboard (Aktif) */}
          <Link
            href="/dashboard"
            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
              current === 'dashboard'
                ? 'bg-slate-100 font-bold text-slate-900 shadow-2xs'
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

          {/* 2. Project Task / Deliverables Board (Aktif) */}
          <Link
            href={kanbanHref}
            className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
              current === 'kanban'
                ? 'bg-slate-100 font-bold text-slate-900 shadow-2xs'
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

          {/* 3. My Inbox (Belum Aktif - Tandai Soon) */}
          <div
            className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-50/50 cursor-not-allowed opacity-60"
            title="Fitur dalam pengembangan"
          >
            <div className="flex items-center gap-2.5">
              <img
                src="/assets/navigation/inbox.svg"
                alt="Inbox"
                className="h-4 w-4 object-contain opacity-40"
              />
              <span>My Inbox</span>
            </div>
            <span className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.2 text-[9px] font-semibold text-slate-400">
              Soon
            </span>
          </div>

          {/* 4. Meeting (Belum Aktif - Tandai Soon) */}
          <div
            className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-50/50 cursor-not-allowed opacity-60"
            title="Fitur dalam pengembangan"
          >
            <div className="flex items-center gap-2.5">
              <img
                src="/assets/navigation/users.svg"
                alt="Meeting"
                className="h-4 w-4 object-contain opacity-40"
              />
              <span>Meeting</span>
            </div>
            <span className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.2 text-[9px] font-semibold text-slate-400">
              Soon
            </span>
          </div>

          {/* 5. Calender (Belum Aktif - Tandai Soon) */}
          <div
            className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-50/50 cursor-not-allowed opacity-60"
            title="Fitur dalam pengembangan"
          >
            <div className="flex items-center gap-2.5">
              <img
                src="/assets/navigation/calendar.svg"
                alt="Calendar"
                className="h-4 w-4 object-contain opacity-40"
              />
              <span>Calender</span>
            </div>
            <span className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.2 text-[9px] font-semibold text-slate-400">
              Soon
            </span>
          </div>
        </div>

        {/* Section: EXPLORE */}
        <div className="space-y-1 pt-1">
          <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            EXPLORE
          </p>

          {/* AI Assisten (Aktif: Membuka modal Daily Standup AI) */}
          <button
            type="button"
            onClick={onOpenStandupAI}
            className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-indigo-50/60 hover:text-indigo-900 transition-colors text-left"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
              <span>AI Assisten</span>
            </div>
            <span className="rounded bg-indigo-50 border border-indigo-200 px-1 py-0.2 text-[9px] font-bold text-indigo-600">
              AI
            </span>
          </button>

          {/* Reports (Belum Aktif - Tandai Soon) */}
          <div
            className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-50/50 cursor-not-allowed opacity-60"
            title="Fitur dalam pengembangan"
          >
            <div className="flex items-center gap-2.5">
              <img
                src="/assets/navigation/reports.svg"
                alt="Reports"
                className="h-4 w-4 object-contain opacity-40"
              />
              <span>Reports</span>
            </div>
            <span className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.2 text-[9px] font-semibold text-slate-400">
              Soon
            </span>
          </div>

          {/* Team (Belum Aktif - Tandai Soon) */}
          <div
            className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-50/50 cursor-not-allowed opacity-60"
            title="Fitur dalam pengembangan"
          >
            <div className="flex items-center gap-2.5">
              <img
                src="/assets/navigation/team.svg"
                alt="Team"
                className="h-4 w-4 object-contain opacity-40"
              />
              <span>Team</span>
            </div>
            <span className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.2 text-[9px] font-semibold text-slate-400">
              Soon
            </span>
          </div>

          {/* Setting (Belum Aktif - Tandai Soon) */}
          <div
            className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-50/50 cursor-not-allowed opacity-60"
            title="Fitur dalam pengembangan"
          >
            <div className="flex items-center gap-2.5">
              <img
                src="/assets/navigation/settings.svg"
                alt="Setting"
                className="h-4 w-4 object-contain opacity-40"
              />
              <span>Setting</span>
            </div>
            <span className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.2 text-[9px] font-semibold text-slate-400">
              Soon
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Profile & Evaluator Tools */}
      <div className="space-y-2.5 pt-3 border-t border-slate-100">
        {/* User Profile Card with Clickable Dropdown Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsPersonaMenuOpen((prev) => !prev)}
            className="w-full text-left rounded-xl border border-slate-200/90 bg-slate-50/70 hover:bg-slate-100/80 p-2 transition-colors focus:outline-none"
            title="Klik untuk memilih akun persona"
          >
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={activeAvatar}
                  alt={user?.name || 'User'}
                  className="h-8 w-8 rounded-full object-cover shrink-0 ring-1 ring-slate-200 shadow-2xs"
                />
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-900 leading-tight">
                    {user?.name || 'Andi Pratama'}
                  </p>
                  <p className="truncate text-[10px] text-slate-500 font-medium">
                    {user?.role === 'PM' && 'Product Manager'}
                    {user?.role === 'INTERNAL_MEMBER' && `${user.department} Engineer`}
                    {user?.role === 'CLIENT_GUEST' && 'Client Guest (Tenant)'}
                  </p>
                </div>
              </div>

              <ChevronDown
                className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform ${
                  isPersonaMenuOpen ? 'rotate-180 text-blue-600' : ''
                }`}
              />
            </div>
          </button>

          {/* Expandable Dropdown Menu for Persona Switching */}
          {isPersonaMenuOpen && (
            <div className="absolute left-0 bottom-full mb-1.5 z-50 w-full rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl space-y-1">
              <p className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Pilih Akun Evaluator:
              </p>
              {DEMO_PERSONAS.map((p) => {
                const isActive = user?.email === p.email;
                return (
                  <button
                    key={p.email}
                    type="button"
                    disabled={isSwitching}
                    onClick={() => handleQuickSwitch(p.email)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-900 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="h-5 w-5 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] leading-tight truncate">{p.name}</p>
                      <p className="text-[9.5px] text-slate-400 font-normal truncate">
                        {p.roleLabel}
                      </p>
                    </div>
                    {isActive && <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick Evaluator Role Switcher Buttons (PR, UI, FR, BA, CL) */}
          <div className="mt-2 pt-2 border-t border-slate-200/60 px-0.5">
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
                    className={`h-6 rounded text-[9.5px] font-bold transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white font-extrabold shadow-xs scale-105 ring-1 ring-slate-900'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {p.code}
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
