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
      <div className="flex h-screen w-full items-center justify-center bg-[#f8fafc] text-slate-500">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
          <RefreshCw className="h-5 w-5 animate-spin text-slate-600" />
          <span className="text-sm font-medium">Memuat Deliverables Board...</span>
        </div>
      </div>
    );
  }

  const project = projectQuery.data;
  const tasks = tasksQuery.data?.data || [];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f8fafc] text-slate-900 font-sans selection:bg-indigo-500/20">
      {/* ─────────────────────────────────────────────────────────────
          1. LEFT SIDEBAR (Clean Modern Executive SaaS Layout)
         ───────────────────────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 flex flex-col justify-between border-r border-slate-200/80 bg-white p-4 text-xs select-none shadow-xs">
        <div>
          {/* Brand */}
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="relative h-9 w-9 shrink-0">
              <Image
                src="/nodewave-logo.png"
                alt="NodeWave Logo"
                width={36}
                height={36}
                className="h-full w-full object-contain filter drop-shadow-xs"
                priority
              />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold tracking-tight text-slate-900">
                NodeWave
              </h1>
              <p className="truncate text-[10.5px] text-slate-500 font-medium">
                Workspace Enterprise
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <LayoutGrid className="h-4 w-4 text-slate-500" />
              <span>Overview</span>
            </Link>

            <Link
              href={`/projects/${projectId}`}
              className="flex items-center justify-between rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Columns3 className="h-4 w-4 text-slate-200" />
                <span>Deliverables Board</span>
              </div>
              <span className="rounded bg-indigo-500/20 border border-indigo-400/30 px-1.5 py-0.2 text-[9px] font-bold text-indigo-200">
                DAG
              </span>
            </Link>
          </nav>
        </div>

        {/* Bottom: Active Persona Card & Quick Switcher */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5">
            <div className="flex items-center gap-2.5">
              <div className="relative h-8 w-8 shrink-0 overflow-hidden">
                <Image
                  src="/avatar-3d.png"
                  alt={user.name}
                  width={32}
                  height={32}
                  className="h-full w-full object-contain filter drop-shadow-xs"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-900">{user.name}</p>
                <p className="truncate text-[10px] text-slate-500">
                  {user.role === 'PM' && 'Product Manager'}
                  {user.role === 'INTERNAL_MEMBER' && `${user.department} Engineer`}
                  {user.role === 'CLIENT_GUEST' && 'Client Guest (Tenant)'}
                </p>
              </div>
            </div>

            {/* Quick Persona Switcher for Assessment Evaluators */}
            <div className="mt-2.5 pt-2 border-t border-slate-200/60">
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1.5 font-medium">
                <span>Evaluator Role Switcher:</span>
                {isSwitching && <RefreshCw className="h-2.5 w-2.5 animate-spin text-slate-600" />}
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

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 transition-colors shadow-2xs"
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
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-6 py-3 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link href="/dashboard" className="hover:text-slate-900 transition-colors">
              Projects
            </Link>
            <span>/</span>
            <span className="text-slate-400">{project?.clientName || 'Client'}</span>
            <span>/</span>
            <span className="font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs">
              {project?.name || 'Deliverables'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Team Avatar Stack */}
            <div className="hidden sm:flex items-center -space-x-1.5">
              <span className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] font-bold text-center leading-6 shadow-2xs">
                PM
              </span>
              <span className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-purple-50 text-purple-700 border border-purple-200 text-[9px] font-bold text-center leading-6 shadow-2xs">
                UI
              </span>
              <span className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold text-center leading-6 shadow-2xs">
                FE
              </span>
              <span className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold text-center leading-6 shadow-2xs">
                BE
              </span>
              <span className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-bold text-center leading-6 shadow-2xs">
                +4
              </span>
            </div>

            {/* Daily Standup Auto-Summary Button */}
            {user.role === 'PM' && (
              <button
                type="button"
                onClick={() => setIsStandupOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                <span>Daily Standup AI</span>
              </button>
            )}

            {/* PM Add Task CTA */}
            {user.role === 'PM' && (
              <button
                type="button"
                onClick={() => setIsCreateTaskOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 text-xs font-bold text-white transition-transform active:scale-[0.98] shadow-xs"
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
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
            <div>
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8 shrink-0">
                  <Image
                    src="/project-3d-icon.png"
                    alt="Project Icon"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain filter drop-shadow-xs"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">
                    {project?.name || 'Deliverables Board'}
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Governed multi-disciplinary project deliverables with DAG dependencies & ABAC
                  </p>
                </div>
              </div>

              {/* View Tabs */}
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-bold text-white shadow-xs"
                >
                  Kanban Board
                </button>
                <Link
                  href="/dashboard"
                  className="rounded-lg px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  Overview & Metrics
                </Link>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  DAG Verified
                </span>
              </div>
            </div>

            {/* Filter Toolbar (Search + Dept Filters) */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="search"
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                  placeholder="Filter tasks..."
                  className="w-44 sm:w-52 rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none transition-colors shadow-2xs"
                />
              </div>

              {/* Department Filter Pills */}
              <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-xs shadow-2xs">
                {(['ALL', 'UIUX', 'FRONTEND', 'BACKEND', 'PRODUCT'] as const).map((dept) => {
                  const isActive = selectedDept === dept;
                  return (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => setSelectedDept(dept)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                        isActive
                          ? 'bg-slate-900 text-white font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {dept === 'ALL' ? 'All' : dept}
                    </button>
                  );
                })}
              </div>

              {/* Date / Sprint Badge */}
              <div className="hidden xl:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 font-medium shadow-2xs">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                <span>Sprint 42</span>
              </div>
            </div>
          </div>

          {/* Client Guest Mode Notice */}
          {user.role === 'CLIENT_GUEST' && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900 flex items-start gap-3 shadow-2xs">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">
                  Mode Isolasi Multi-Tenant & API Data Masking Aktif (Client Guest View)
                </p>
                <p className="mt-0.5 text-[11px] text-amber-800">
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
              className={`flex items-center justify-between rounded-xl border p-3.5 text-xs font-medium shadow-2xs ${
                actionFeedback.type === 'conflict'
                  ? 'border-amber-300 bg-amber-50 text-amber-900'
                  : actionFeedback.type === 'error'
                    ? 'border-rose-300 bg-rose-50 text-rose-900'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-2">
                {actionFeedback.type === 'conflict' ? (
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
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
                className="ml-4 shrink-0 rounded bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 border border-slate-300 hover:bg-slate-100"
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
                  className="h-96 rounded-2xl border border-slate-200 bg-white p-4 animate-pulse shadow-xs"
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
                    className="flex flex-col rounded-2xl border border-slate-200/80 bg-[#f1f5f9]/70 backdrop-blur-sm overflow-hidden shadow-xs min-h-[500px]"
                  >
                    {/* Column Header matching Reference Canvaso UI */}
                    <div className="flex items-center justify-between p-3.5 border-b border-slate-200/60 bg-white/60">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${col.dotColor}`} />
                        <h2 className="text-xs font-bold text-slate-800 tracking-tight">
                          {col.title}
                        </h2>
                        <span className="rounded-full bg-white border border-slate-200 px-2 py-0.2 text-[10px] font-mono font-bold text-slate-700 shadow-2xs">
                          {colTasks.length}
                        </span>
                      </div>

                      {user.role === 'PM' && col.status === 'TODO' && (
                        <button
                          type="button"
                          onClick={() => setIsCreateTaskOpen(true)}
                          className="h-5 w-5 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white transition-colors"
                          title="Add task to To-do"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Cards Container */}
                    <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] custom-scrollbar">
                      {colTasks.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500 bg-white/40">
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
                              className="group rounded-xl border border-slate-200/90 bg-white p-3.5 hover:border-slate-300 hover:shadow-md transition-all duration-200 shadow-xs flex flex-col justify-between"
                            >
                              <div>
                                {/* Top Meta: Department Tag + Version Pill + Assignee */}
                                <div className="flex items-center justify-between gap-1 mb-2">
                                  <div className="flex items-center gap-1.5">
                                    <DepartmentBadge department={task.department} />
                                    <span
                                      title="Optimistic Locking Version Counter"
                                      className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-slate-600"
                                    >
                                      v{task.version}
                                    </span>
                                  </div>

                                  {/* Assignee Avatar */}
                                  <div className="flex items-center">
                                    {user.role === 'CLIENT_GUEST' ? (
                                      <span className="text-[10px] text-slate-400 italic">
                                        Masked
                                      </span>
                                    ) : task.assignee ? (
                                      <div
                                        title={`Assignee: ${task.assignee.name}`}
                                        className="h-6 w-6 rounded-full bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-700 uppercase"
                                      >
                                        {task.assignee.name.slice(0, 2)}
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-slate-400">Unassigned</span>
                                    )}
                                  </div>
                                </div>

                                {/* Task Title */}
                                <h3 className="text-xs font-bold text-slate-900 tracking-tight leading-snug group-hover:text-blue-600 transition-colors">
                                  <Link
                                    href={`/projects/${projectId}/tasks/${task.id}`}
                                    className="focus:outline-none"
                                  >
                                    {task.title}
                                  </Link>
                                </h3>

                                {/* Task Description */}
                                <p className="mt-1 line-clamp-2 text-[11px] text-slate-500 leading-relaxed">
                                  {task.description || 'No description provided.'}
                                </p>

                                {/* DAG Prerequisites Checklist (if any) */}
                                {deps.length > 0 && (
                                  <div className="mt-2.5 rounded-lg border border-slate-200 bg-slate-50 p-2 text-[10px]">
                                    <div className="flex items-center justify-between text-slate-600 font-semibold mb-1">
                                      <span className="flex items-center gap-1">
                                        <GitBranch className="h-3 w-3 text-indigo-600" />
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
                                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                : 'bg-rose-50 text-rose-800 border border-rose-200 font-medium'
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
                                  <div className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-800 flex items-center gap-1.5">
                                    <Lock className="h-3 w-3 shrink-0" />
                                    <span>
                                      Terkunci: Menunggu {unfulfilledDeps.length} prerequisite
                                      (DONE)
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Footer: Quick Actions & Evaluator Tools */}
                              <div className="mt-3 pt-2.5 border-t border-slate-100">
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
                                          className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-1 text-[10.5px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
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
                                          className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white py-1 text-[10.5px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                                        >
                                          {doneEval.allowed ? 'Selesai (Done)' : 'Terkunci (Done)'}
                                        </button>
                                      )}

                                      <Link
                                        href={`/projects/${projectId}/tasks/${task.id}`}
                                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10.5px] font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
                                      >
                                        Detail
                                      </Link>
                                    </div>

                                    {/* Locked reason banner */}
                                    {task.status !== 'IN_PROGRESS' &&
                                      task.status !== 'DONE' &&
                                      !startEval.allowed &&
                                      startEval.reason && (
                                        <p className="text-[9.5px] text-rose-600 leading-tight font-medium">
                                          {startEval.reason}
                                        </p>
                                      )}

                                    {task.status === 'IN_PROGRESS' &&
                                      !doneEval.allowed &&
                                      doneEval.reason && (
                                        <p className="text-[9.5px] text-rose-600 leading-tight font-medium">
                                          {doneEval.reason}
                                        </p>
                                      )}
                                  </div>
                                )}

                                {/* Card Bottom Details */}
                                <div className="mt-2 flex items-center justify-between text-[9.5px] text-slate-400 font-mono">
                                  <span>
                                    {task.createdAt
                                      ? new Date(task.createdAt).toLocaleDateString('id-ID', {
                                          day: 'numeric',
                                          month: 'short',
                                        })
                                      : 'Recent'}
                                  </span>
                                  {task.isClientVisible && (
                                    <span className="text-amber-600 font-sans font-medium">
                                      Client Visible
                                    </span>
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
                          className="w-full py-2 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 bg-white/70 hover:bg-white text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
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
