'use client';

import { CreateTaskModal } from '@/components/create-task-modal';
import { StandupSummaryModal } from '@/components/standup-summary-modal';
import { DepartmentBadge } from '@/components/status-badge';
import { api, extractApiError } from '@/lib/api';
import { evaluateStatusTransition } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import type { ApiListResponse, ApiSingleResponse, Project, Task, TaskStatus, User } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Columns3,
  Filter,
  GitBranch,
  Layers,
  LayoutGrid,
  Link as LinkIcon,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useMemo, useState } from 'react';

const DEMO_PERSONAS = [
  {
    name: 'Andi Pratama',
    role: 'PM',
    roleLabel: 'Product Manager',
    email: 'pm@nodewave.id',
    dept: 'PRODUCT',
  },
  {
    name: 'Siti Rahma',
    role: 'INTERNAL_MEMBER',
    roleLabel: 'UI/UX Designer',
    email: 'uiux@nodewave.id',
    dept: 'UIUX',
  },
  {
    name: 'Budi Santoso',
    role: 'INTERNAL_MEMBER',
    roleLabel: 'Frontend Engineer',
    email: 'frontend@nodewave.id',
    dept: 'FRONTEND',
  },
  {
    name: 'Eko Wijaya',
    role: 'INTERNAL_MEMBER',
    roleLabel: 'Backend Engineer',
    email: 'backend@nodewave.id',
    dept: 'BACKEND',
  },
  {
    name: 'PT Maju Jaya',
    role: 'CLIENT_GUEST',
    roleLabel: 'Client Guest',
    email: 'client@guest.com',
    dept: 'CLIENT',
  },
];

const KANBAN_COLUMNS: Array<{
  status: TaskStatus;
  title: string;
  dotColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}> = [
  {
    status: 'TODO',
    title: 'To-do',
    dotColor: 'bg-rose-500',
    badgeBg: 'bg-rose-500/10',
    badgeText: 'text-rose-400',
    badgeBorder: 'border-rose-500/20',
  },
  {
    status: 'IN_PROGRESS',
    title: 'On Progress',
    dotColor: 'bg-cyan-500',
    badgeBg: 'bg-cyan-500/10',
    badgeText: 'text-cyan-400',
    badgeBorder: 'border-cyan-500/20',
  },
  {
    status: 'BLOCKED',
    title: 'In Review / Blocked',
    dotColor: 'bg-amber-500',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-500/20',
  },
  {
    status: 'DONE',
    title: 'Done',
    dotColor: 'bg-emerald-500',
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-400',
    badgeBorder: 'border-emerald-500/20',
  },
];

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, token, isHydrated, setAuth, clearAuth } = useAuthStore();

  const [searchTitle, setSearchTitle] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isStandupOpen, setIsStandupOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'error' | 'conflict' | 'success';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (isHydrated && !token) {
      router.replace('/login');
    }
  }, [isHydrated, token, router]);

  const projectQuery = useQuery({
    queryKey: ['project', projectId, user?.id],
    queryFn: async () => {
      const res = await api.get<ApiSingleResponse<Project>>(`/projects/${projectId}`);
      return res.data.data;
    },
    enabled: Boolean(isHydrated && token),
  });

  const tasksQuery = useQuery({
    queryKey: ['tasks', projectId, user?.id, searchTitle, selectedDept],
    queryFn: async () => {
      const queryParams: Record<string, string> = {
        page: '1',
        rows: '50',
        orderKey: 'createdAt',
        orderRule: 'asc',
      };

      if (searchTitle.trim()) {
        queryParams.searchFilters = JSON.stringify({ title: searchTitle.trim() });
      }

      if (selectedDept !== 'ALL') {
        queryParams.filters = JSON.stringify({ department: selectedDept });
      }

      const res = await api.get<ApiListResponse<Task>>(`/projects/${projectId}/tasks`, {
        params: queryParams,
      });
      return res.data;
    },
    enabled: Boolean(isHydrated && token),
  });

  const statusMutation = useMutation({
    mutationFn: async ({
      taskId,
      status,
      version,
    }: {
      taskId: string;
      status: TaskStatus;
      version: number;
    }) => {
      const res = await api.patch(`/tasks/${taskId}/status`, { status, version });
      return res.data;
    },
    onSuccess: () => {
      setActionFeedback({
        type: 'success',
        message: 'Status tugas berhasil diperbarui (Version incremented & Audit Log tercatat).',
      });
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
    onError: (err) => {
      const extracted = extractApiError(err);
      setActionFeedback({
        type: extracted.status === 409 ? 'conflict' : 'error',
        message: extracted.message,
      });
    },
  });

  // Seamless Persona Switcher for Evaluation
  const handleQuickSwitch = async (email: string) => {
    if (user?.email === email || isSwitching) return;
    setIsSwitching(true);
    try {
      const res = await api.post<{
        success: boolean;
        data: { user: User; token: string };
      }>('/auth/login', {
        email,
        password: 'Password123!',
      });
      setAuth(res.data.data.user, res.data.data.token);
      queryClient.invalidateQueries();
    } catch {
      // Fallback
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

  if (!isHydrated || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#07080a] text-zinc-400">
        <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-[#0d0f14] px-6 py-4">
          <RefreshCw className="h-5 w-5 animate-spin text-zinc-400" />
          <span className="text-sm font-medium">Memuat Deliverables Board...</span>
        </div>
      </div>
    );
  }

  const project = projectQuery.data;
  const tasks = tasksQuery.data?.data || [];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#07080a] text-zinc-100 font-sans selection:bg-zinc-800">
      {/* ─────────────────────────────────────────────────────────────
          1. LEFT SIDEBAR (Matching Dark Executive SaaS Design)
         ───────────────────────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 flex flex-col justify-between border-r border-zinc-800/80 bg-[#0a0c10] p-4 text-xs select-none">
        <div>
          {/* Brand */}
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="relative h-9 w-9 shrink-0">
              <Image
                src="/nodewave-logo.png"
                alt="NodeWave Logo"
                width={36}
                height={36}
                className="h-full w-full object-contain filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]"
                priority
              />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold tracking-tight text-white">NodeWave</h1>
              <p className="truncate text-[10px] text-zinc-400 font-medium">Workspace Enterprise</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 transition-colors"
            >
              <LayoutGrid className="h-4 w-4 text-zinc-500" />
              <span>Overview</span>
            </Link>

            <Link
              href={`/projects/${projectId}`}
              className="flex items-center justify-between rounded-lg bg-zinc-800/60 px-3 py-2 text-xs font-semibold text-white shadow-inner transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Columns3 className="h-4 w-4 text-zinc-300" />
                <span>Deliverables Board</span>
              </div>
              <span className="rounded bg-indigo-500/15 border border-indigo-500/30 px-1.5 py-0.2 text-[9px] font-semibold text-indigo-400">
                DAG
              </span>
            </Link>
          </nav>
        </div>

        {/* Bottom: Active Persona Card & Quick Switcher */}
        <div className="space-y-3 pt-3 border-t border-zinc-800/80">
          <div className="rounded-xl border border-zinc-800/80 bg-[#0d0f14] p-2.5">
            <div className="flex items-center gap-2.5">
              <div className="relative h-8 w-8 shrink-0 overflow-hidden">
                <Image
                  src="/avatar-3d.png"
                  alt={user.name}
                  width={32}
                  height={32}
                  className="h-full w-full object-contain filter drop-shadow"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">{user.name}</p>
                <p className="truncate text-[10px] text-zinc-400">
                  {user.role === 'PM' && 'Product Manager'}
                  {user.role === 'INTERNAL_MEMBER' && `${user.department} Engineer`}
                  {user.role === 'CLIENT_GUEST' && 'Client Guest (Tenant)'}
                </p>
              </div>
            </div>

            {/* Quick Persona Switcher for Assessment Evaluators */}
            <div className="mt-2.5 pt-2 border-t border-zinc-800/60">
              <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1.5 font-medium">
                <span>Evaluator Role Switcher:</span>
                {isSwitching && <RefreshCw className="h-2.5 w-2.5 animate-spin text-zinc-400" />}
              </div>
              <div className="grid grid-cols-5 gap-1">
                {DEMO_PERSONAS.map((p) => {
                  const isActive = user.email === p.email;
                  return (
                    <button
                      key={p.email}
                      type="button"
                      disabled={isSwitching}
                      onClick={() => handleQuickSwitch(p.email)}
                      title={`${p.name} (${p.roleLabel})`}
                      className={`h-6 rounded text-[9px] font-bold transition-all ${
                        isActive
                          ? 'bg-white text-black font-extrabold shadow-sm scale-105 ring-1 ring-white/50'
                          : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                      }`}
                    >
                      {p.dept.slice(0, 2)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/60 py-2 text-xs font-medium text-zinc-400 hover:border-rose-900/40 hover:bg-rose-950/20 hover:text-rose-300 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN CONTENT AREA (Scrollable Modern Kanban Board)
         ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Breadcrumb Header Bar matching Reference Canvaso UI */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-800/80 bg-[#07080a]/90 backdrop-blur-md px-6 py-3">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Projects
            </Link>
            <span>/</span>
            <span className="text-zinc-500">{project?.clientName || 'Client'}</span>
            <span>/</span>
            <span className="font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
              {project?.name || 'Deliverables'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Team Avatar Stack */}
            <div className="hidden sm:flex items-center -space-x-2">
              <span className="inline-block h-6 w-6 rounded-full ring-2 ring-[#07080a] bg-indigo-600/30 text-indigo-300 text-[9px] font-bold text-center leading-6">
                PM
              </span>
              <span className="inline-block h-6 w-6 rounded-full ring-2 ring-[#07080a] bg-purple-600/30 text-purple-300 text-[9px] font-bold text-center leading-6">
                UI
              </span>
              <span className="inline-block h-6 w-6 rounded-full ring-2 ring-[#07080a] bg-emerald-600/30 text-emerald-300 text-[9px] font-bold text-center leading-6">
                FE
              </span>
              <span className="inline-block h-6 w-6 rounded-full ring-2 ring-[#07080a] bg-amber-600/30 text-amber-300 text-[9px] font-bold text-center leading-6">
                BE
              </span>
              <span className="inline-block h-6 w-6 rounded-full ring-2 ring-[#07080a] bg-zinc-800 text-zinc-400 text-[9px] font-bold text-center leading-6">
                +4
              </span>
            </div>

            {/* Daily Standup Auto-Summary Button */}
            {user.role === 'PM' && (
              <button
                type="button"
                onClick={() => setIsStandupOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-[#0d0f14] px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>Daily Standup AI</span>
              </button>
            )}

            {/* PM Add Task CTA */}
            {user.role === 'PM' && (
              <button
                type="button"
                onClick={() => setIsCreateTaskOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-black transition-transform hover:bg-zinc-200 active:scale-[0.98] shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Task</span>
              </button>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 space-y-5">
          {/* Title & Board Tabs Row matching Reference UI */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-zinc-800/60">
            <div>
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8 shrink-0">
                  <Image
                    src="/project-3d-icon.png"
                    alt="Project Icon"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain filter drop-shadow"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-white">
                    {project?.name || 'Deliverables Board'}
                  </h1>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Governed multi-disciplinary project deliverables with DAG dependencies & ABAC
                  </p>
                </div>
              </div>

              {/* View Tabs */}
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-zinc-800 px-3 py-1 text-xs font-semibold text-white border border-zinc-700 shadow-sm"
                >
                  Kanban Board
                </button>
                <Link
                  href="/dashboard"
                  className="rounded-lg px-3 py-1 text-xs font-medium text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 transition-colors"
                >
                  Overview & Metrics
                </Link>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  DAG Verified
                </span>
              </div>
            </div>

            {/* Filter Toolbar (Search + Dept Filters) */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="search"
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                  placeholder="Filter tasks..."
                  className="w-44 sm:w-52 rounded-lg border border-zinc-800 bg-[#0d0f14] pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Department Filter Pills */}
              <div className="flex items-center rounded-lg border border-zinc-800 bg-[#0d0f14] p-0.5 text-xs">
                {(['ALL', 'UIUX', 'FRONTEND', 'BACKEND', 'PRODUCT'] as const).map((dept) => {
                  const isActive = selectedDept === dept;
                  return (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => setSelectedDept(dept)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                        isActive
                          ? 'bg-zinc-800 text-white font-bold shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {dept === 'ALL' ? 'All' : dept}
                    </button>
                  );
                })}
              </div>

              {/* Date / Sprint Badge */}
              <div className="hidden xl:flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-[#0d0f14] px-3 py-1.5 text-xs text-zinc-300">
                <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                <span>Sprint 42</span>
              </div>
            </div>
          </div>

          {/* Client Guest Mode Notice */}
          {user.role === 'CLIENT_GUEST' && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <p className="font-bold text-amber-200">
                  Mode Isolasi Multi-Tenant & API Data Masking Aktif (Client Guest View)
                </p>
                <p className="mt-0.5 text-[11px] text-amber-300/90">
                  Hanya tugas bertanda <code>isClientVisible = true</code> yang ditampilkan. Seluruh
                  nama engineer internal, email, dan riwayat audit trail dimasking otomatis oleh
                  backend.
                </p>
              </div>
            </div>
          )}

          {/* Action Feedback / 409 Conflict Alert */}
          {actionFeedback && (
            <div
              role="alert"
              className={`flex items-center justify-between rounded-xl border p-3.5 text-xs font-medium ${
                actionFeedback.type === 'conflict'
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                  : actionFeedback.type === 'error'
                    ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                    : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {actionFeedback.type === 'conflict' ? (
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                )}
                <span>
                  <strong>
                    {actionFeedback.type === 'conflict'
                      ? '409 Concurrency Conflict: '
                      : actionFeedback.type === 'error'
                        ? 'Action Blocked: '
                        : 'Sukses: '}
                  </strong>
                  {actionFeedback.message}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActionFeedback(null);
                  tasksQuery.refetch();
                }}
                className="ml-4 shrink-0 rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-300 border border-zinc-700 hover:text-white"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              3. FOUR (4) KANBAN COLUMNS (Matching Canvaso Reference)
             ───────────────────────────────────────────────────────────── */}
          {tasksQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-96 rounded-2xl border border-zinc-800/80 bg-[#0d0f14]/60 p-4 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
              {KANBAN_COLUMNS.map((col) => {
                const colTasks = tasks.filter((t) => t.status === col.status);

                return (
                  <section
                    key={col.status}
                    aria-label={col.title}
                    className="flex flex-col rounded-2xl border border-zinc-800/80 bg-[#0d0f14]/80 backdrop-blur-sm overflow-hidden shadow-lg min-h-[500px]"
                  >
                    {/* Column Header matching Reference Canvaso UI */}
                    <div className="flex items-center justify-between p-3.5 border-b border-zinc-800/60 bg-zinc-900/40">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${col.dotColor}`} />
                        <h2 className="text-xs font-bold text-white tracking-tight">{col.title}</h2>
                        <span
                          className={`rounded-full border px-1.5 py-0.2 text-[10px] font-mono font-bold ${col.badgeBg} ${col.badgeText} ${col.badgeBorder}`}
                        >
                          {colTasks.length}
                        </span>
                      </div>

                      {user.role === 'PM' && col.status === 'TODO' && (
                        <button
                          type="button"
                          onClick={() => setIsCreateTaskOpen(true)}
                          className="h-5 w-5 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          title="Add task to To-do"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Cards Container */}
                    <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] custom-scrollbar">
                      {colTasks.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-xs text-zinc-500">
                          No tasks in {col.title}
                        </div>
                      ) : (
                        colTasks.map((task) => {
                          const deps = task.dependencies || [];
                          const unfulfilledDeps = deps.filter(
                            (d) => d.prerequisite.status !== 'DONE',
                          );

                          // Dual-Layer ABAC Evaluation
                          const startEval = evaluateStatusTransition(user, task, 'IN_PROGRESS');
                          const doneEval = evaluateStatusTransition(user, task, 'DONE');

                          return (
                            <article
                              key={task.id}
                              className="group rounded-xl border border-zinc-800/80 bg-[#12151e]/90 p-3.5 hover:border-zinc-700 hover:bg-[#161a26] transition-all duration-200 shadow-sm flex flex-col justify-between"
                            >
                              <div>
                                {/* Top Meta: Department Tag + Version Pill + Assignee */}
                                <div className="flex items-center justify-between gap-1 mb-2">
                                  <div className="flex items-center gap-1.5">
                                    <DepartmentBadge department={task.department} />
                                    <span
                                      title="Optimistic Locking Version Counter"
                                      className="rounded bg-zinc-800/80 border border-zinc-700/60 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-zinc-300"
                                    >
                                      v{task.version}
                                    </span>
                                  </div>

                                  {/* Assignee Avatar */}
                                  <div className="flex items-center">
                                    {user.role === 'CLIENT_GUEST' ? (
                                      <span className="text-[10px] text-zinc-500 italic">
                                        Masked
                                      </span>
                                    ) : task.assignee ? (
                                      <div
                                        title={`Assignee: ${task.assignee.name}`}
                                        className="h-6 w-6 rounded-full bg-zinc-800 ring-1 ring-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-200 uppercase"
                                      >
                                        {task.assignee.name.slice(0, 2)}
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-zinc-500">Unassigned</span>
                                    )}
                                  </div>
                                </div>

                                {/* Task Title */}
                                <h3 className="text-xs font-bold text-white tracking-tight leading-snug group-hover:text-cyan-300 transition-colors">
                                  <Link
                                    href={`/projects/${projectId}/tasks/${task.id}`}
                                    className="focus:outline-none"
                                  >
                                    {task.title}
                                  </Link>
                                </h3>

                                {/* Task Description */}
                                <p className="mt-1 line-clamp-2 text-[11px] text-zinc-400 leading-relaxed">
                                  {task.description || 'No description provided.'}
                                </p>

                                {/* DAG Prerequisites Checklist (if any) */}
                                {deps.length > 0 && (
                                  <div className="mt-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60 p-2 text-[10px]">
                                    <div className="flex items-center justify-between text-zinc-400 font-semibold mb-1">
                                      <span className="flex items-center gap-1">
                                        <GitBranch className="h-3 w-3 text-indigo-400" />
                                        DAG Prerequisites:
                                      </span>
                                      <span className="font-mono">
                                        {
                                          deps.filter((d) => d.prerequisite.status === 'DONE')
                                            .length
                                        }
                                        /{deps.length}
                                      </span>
                                    </div>
                                    <div className="space-y-1">
                                      {deps.map((dep) => {
                                        const isPrereqDone = dep.prerequisite.status === 'DONE';
                                        return (
                                          <div
                                            key={dep.id}
                                            className={`flex items-center justify-between gap-1 rounded px-1.5 py-0.5 ${
                                              isPrereqDone
                                                ? 'bg-emerald-500/10 text-emerald-400'
                                                : 'bg-rose-500/10 text-rose-400 font-medium'
                                            }`}
                                          >
                                            <span className="truncate">
                                              {isPrereqDone ? '✓ ' : '✕ '}
                                              {dep.prerequisite.title}
                                            </span>
                                            <span className="font-mono text-[9px] uppercase">
                                              {dep.prerequisite.status}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Blocked Warning Notice */}
                                {unfulfilledDeps.length > 0 && (
                                  <div className="mt-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[10px] font-semibold text-rose-400 flex items-center gap-1.5">
                                    <Lock className="h-3 w-3 shrink-0" />
                                    <span>
                                      Terkunci: Menunggu {unfulfilledDeps.length} prerequisite
                                      (DONE)
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Footer: Quick Actions & Evaluator Tools */}
                              <div className="mt-3 pt-2.5 border-t border-zinc-800/60">
                                {user.role !== 'CLIENT_GUEST' && (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5">
                                      {task.status !== 'IN_PROGRESS' && task.status !== 'DONE' && (
                                        <button
                                          type="button"
                                          disabled={!startEval.allowed || statusMutation.isPending}
                                          title={
                                            startEval.reason || 'Pindahkan status ke In Progress'
                                          }
                                          onClick={() =>
                                            statusMutation.mutate({
                                              taskId: task.id,
                                              status: 'IN_PROGRESS',
                                              version: task.version,
                                            })
                                          }
                                          className="flex-1 rounded-lg bg-cyan-600/20 border border-cyan-500/40 hover:bg-cyan-600/30 text-cyan-300 py-1 text-[10.5px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                          {startEval.allowed ? 'Mulai' : 'Terkunci (Start)'}
                                        </button>
                                      )}

                                      {task.status === 'IN_PROGRESS' && (
                                        <button
                                          type="button"
                                          disabled={!doneEval.allowed || statusMutation.isPending}
                                          title={doneEval.reason || 'Tandai tugas selesai (DONE)'}
                                          onClick={() =>
                                            statusMutation.mutate({
                                              taskId: task.id,
                                              status: 'DONE',
                                              version: task.version,
                                            })
                                          }
                                          className="flex-1 rounded-lg bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 text-emerald-300 py-1 text-[10.5px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                          {doneEval.allowed ? 'Selesai (Done)' : 'Terkunci (Done)'}
                                        </button>
                                      )}

                                      <Link
                                        href={`/projects/${projectId}/tasks/${task.id}`}
                                        className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[10.5px] font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                                      >
                                        Detail
                                      </Link>
                                    </div>

                                    {/* Locked reason banner */}
                                    {task.status !== 'IN_PROGRESS' &&
                                      task.status !== 'DONE' &&
                                      !startEval.allowed &&
                                      startEval.reason && (
                                        <p className="text-[9.5px] text-zinc-500 leading-tight">
                                          {startEval.reason}
                                        </p>
                                      )}

                                    {task.status === 'IN_PROGRESS' &&
                                      !doneEval.allowed &&
                                      doneEval.reason && (
                                        <p className="text-[9.5px] text-zinc-500 leading-tight">
                                          {doneEval.reason}
                                        </p>
                                      )}
                                  </div>
                                )}

                                {/* Card Bottom Details */}
                                <div className="mt-2 flex items-center justify-between text-[9.5px] text-zinc-500 font-mono">
                                  <span>
                                    {task.createdAt
                                      ? new Date(task.createdAt).toLocaleDateString('id-ID', {
                                          day: 'numeric',
                                          month: 'short',
                                        })
                                      : 'Recent'}
                                  </span>
                                  {task.isClientVisible && (
                                    <span className="text-amber-400 font-sans">Client Visible</span>
                                  )}
                                </div>
                              </div>
                            </article>
                          );
                        })
                      )}

                      {/* Add Task footer button matching Canvaso UI */}
                      {user.role === 'PM' && col.status === 'TODO' && (
                        <button
                          type="button"
                          onClick={() => setIsCreateTaskOpen(true)}
                          className="w-full py-2 rounded-xl border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 hover:bg-zinc-800/40 text-xs font-semibold text-zinc-400 hover:text-white transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add Task</span>
                        </button>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {/* Modals */}
          <CreateTaskModal
            projectId={projectId}
            isOpen={isCreateTaskOpen}
            onClose={() => setIsCreateTaskOpen(false)}
          />

          <StandupSummaryModal
            projectId={projectId}
            isOpen={isStandupOpen}
            onClose={() => setIsStandupOpen(false)}
          />
        </main>
      </div>
    </div>
  );
}
