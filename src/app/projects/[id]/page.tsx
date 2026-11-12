'use client';

import { CreateTaskModal } from '@/components/create-task-modal';
import { Sidebar, getPersonaAvatar } from '@/components/sidebar';
import { StandupSummaryModal } from '@/components/standup-summary-modal';
import { DepartmentBadge, PriorityBadge } from '@/components/status-badge';
import { api, extractApiError } from '@/lib/api';
import { cn, evaluateStatusTransition } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import type { ApiListResponse, ApiSingleResponse, Project, Task, TaskStatus } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Plus, RefreshCw, Search, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

const KANBAN_COLUMNS: Array<{
  status: TaskStatus;
  title: string;
  iconSrc: string;
  bgClass: string;
  headerBgClass: string;
  borderClass: string;
  badgeClass: string;
  dotColor: string;
}> = [
  {
    status: 'TODO',
    title: 'To-do',
    iconSrc: '/assets/status-icons/todo.svg',
    bgClass: 'bg-slate-100/55',
    headerBgClass: 'bg-white/95 border-slate-200/70',
    borderClass: 'border-slate-200/90',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotColor: 'bg-slate-400',
  },
  {
    status: 'IN_PROGRESS',
    title: 'On Progress',
    iconSrc: '/assets/status-icons/in-progress.svg',
    bgClass: 'bg-[#eff6ff]/60', // Soft subtle sky/blue tint
    headerBgClass: 'bg-[#f0f7ff]/95 border-blue-100/80',
    borderClass: 'border-blue-200/60',
    badgeClass: 'bg-blue-100/80 text-blue-700 border-blue-200/80',
    dotColor: 'bg-blue-500',
  },
  {
    status: 'BLOCKED',
    title: 'In Review',
    iconSrc: '/assets/status-icons/in-review.svg',
    bgClass: 'bg-[#faf5ff]/60', // Soft subtle purple/violet tint
    headerBgClass: 'bg-[#fbf7ff]/95 border-purple-100/80',
    borderClass: 'border-purple-200/60',
    badgeClass: 'bg-purple-100/80 text-purple-700 border-purple-200/80',
    dotColor: 'bg-purple-500',
  },
  {
    status: 'DONE',
    title: 'Done',
    iconSrc: '/assets/status-icons/done.svg',
    bgClass: 'bg-[#ecfdf5]/55', // Soft subtle emerald/mint tint
    headerBgClass: 'bg-[#f0fdf4]/95 border-emerald-100/80',
    borderClass: 'border-emerald-200/60',
    badgeClass: 'bg-emerald-100/80 text-emerald-700 border-emerald-200/80',
    dotColor: 'bg-emerald-500',
  },
];

function getTaskPriority(task: Task): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (task.dependencies && task.dependencies.length > 0) return 'HIGH';
  if (task.department === 'FRONTEND' || task.department === 'BACKEND') return 'MEDIUM';
  return 'LOW';
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, token, isHydrated } = useAuthStore();

  const [searchTitle, setSearchTitle] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isStandupOpen, setIsStandupOpen] = useState(false);
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
    <div className="flex h-screen w-full overflow-hidden bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-500/20">
      {/* ─────────────────────────────────────────────────────────────
          1. UNIFIED MODERN SIDEBAR
         ───────────────────────────────────────────────────────────── */}
      <Sidebar
        current="kanban"
        projectId={projectId}
        onOpenStandupAI={() => setIsStandupOpen(true)}
      />

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN CONTENT AREA (Single Viewport, Zero Double Scrollbar)
         ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className="shrink-0 flex items-center justify-between border-b border-slate-200/80 bg-white px-6 py-2.5 shadow-2xs z-20">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <img
              src="/assets/navigation/project-task.svg"
              alt="Folder"
              className="h-3.5 w-3.5 opacity-60"
            />
            <Link href="/dashboard" className="hover:text-slate-900 transition-colors">
              Projects
            </Link>
            <span className="text-slate-300">›</span>
            <span className="text-slate-400">{project?.clientName || 'Client'}</span>
            <span className="text-slate-300">›</span>
            <span className="font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs">
              {project?.name || 'Deliverables'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Team Avatar Stack */}
            <div className="hidden sm:flex items-center -space-x-2">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full ring-2 ring-white bg-blue-50 text-blue-600 text-[10px] font-bold shadow-2xs z-40">
                8+
              </span>
              <img
                src="/assets/avatars/avatar-ns.svg"
                alt="Avatar NS"
                className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover shadow-2xs z-30"
              />
              <img
                src="/assets/avatars/avatar-sr.svg"
                alt="Avatar SR"
                className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover shadow-2xs z-20"
              />
              <img
                src="/assets/avatars/avatar-bs.svg"
                alt="Avatar BS"
                className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover shadow-2xs z-10"
              />
            </div>

            {/* Daily Standup AI Button */}
            {user.role === 'PM' && (
              <button
                type="button"
                onClick={() => setIsStandupOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                <span>Daily Standup AI</span>
              </button>
            )}

            {/* PM Add Task CTA */}
            {user.role === 'PM' && (
              <button
                type="button"
                onClick={() => setIsCreateTaskOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-bold text-white transition-transform active:scale-[0.98] shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Task</span>
              </button>
            )}
          </div>
        </header>

        {/* Content Body (Flex Column Filling Remainder) */}
        <main className="flex-1 flex flex-col p-5 min-h-0 overflow-hidden space-y-3.5">
          {/* Sub-Header: Title, Tabs & Filters */}
          <div className="shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="relative w-7 h-7 shrink-0">
                  <Image
                    src="/project-3d-icon.png"
                    alt="Project Icon"
                    width={28}
                    height={28}
                    className="w-full h-full object-contain filter drop-shadow-xs"
                  />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">
                    {project?.name || 'Deliverables Board'}
                  </h1>
                  <p className="text-[11px] text-slate-500">
                    Track deliverables with DAG Governance & Multi-Tenant ABAC
                  </p>
                </div>
              </div>

              {/* View Tabs */}
              <div className="mt-2.5 flex items-center gap-1.5">
                <Link
                  href="/dashboard"
                  className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  Overview
                </Link>
                <button
                  type="button"
                  className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-bold text-white shadow-xs"
                >
                  Kanban
                </button>
                <span className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-400 cursor-not-allowed">
                  Activities
                </span>
                <span className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-400 cursor-not-allowed">
                  Timeline
                </span>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Date */}
              <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 font-medium shadow-2xs">
                <img
                  src="/assets/navigation/calendar.svg"
                  alt="Calendar"
                  className="h-3 w-3 opacity-60"
                />
                <span>Sprint 42</span>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="search"
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                  placeholder="Filter tasks..."
                  className="w-36 sm:w-44 rounded-lg border border-slate-200 bg-white pl-8 pr-2.5 py-1 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none transition-colors shadow-2xs"
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
                      className={`px-2 py-0.5 rounded text-[10.5px] font-medium transition-all ${
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
            </div>
          </div>

          {/* Client Guest Mode Notice */}
          {user.role === 'CLIENT_GUEST' && (
            <div className="shrink-0 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                <span className="text-[11px] font-medium">
                  <strong>Client Guest Portal:</strong> Hanya tugas bertanda{' '}
                  <code>isClientVisible = true</code> yang ditampilkan. Identitas internal
                  disamarkan.
                </span>
              </div>
            </div>
          )}

          {/* Action Feedback Banner */}
          {actionFeedback && (
            <div
              role="alert"
              className={`shrink-0 flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium shadow-2xs ${
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
                <span className="text-[11px]">
                  <strong>
                    {actionFeedback.type === 'conflict'
                      ? '409 Conflict: '
                      : actionFeedback.type === 'error'
                        ? 'Ditolak: '
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
                className="ml-3 shrink-0 rounded bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 border border-slate-300 hover:bg-slate-100"
              >
                Tutup
              </button>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              3. FOUR (4) KANBAN COLUMNS (Zero Window Scroll, Sleek Column Scroll)
             ───────────────────────────────────────────────────────────── */}
          {tasksQuery.isLoading ? (
            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-full rounded-2xl border border-slate-200 bg-white p-4 animate-pulse shadow-xs"
                />
              ))}
            </div>
          ) : (
            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 items-stretch">
              {KANBAN_COLUMNS.map((col) => {
                const colTasks = tasks.filter((t) => t.status === col.status);

                return (
                  <section
                    key={col.status}
                    aria-label={col.title}
                    className={cn(
                      'flex flex-col h-full rounded-2xl border overflow-hidden shadow-2xs transition-colors',
                      col.bgClass,
                      col.borderClass,
                    )}
                  >
                    {/* Column Header with distinctive subtle pill */}
                    <div
                      className={cn(
                        'shrink-0 flex items-center justify-between px-3.5 py-2.5 border-b backdrop-blur-xs',
                        col.headerBgClass,
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'h-2.5 w-2.5 rounded-full shrink-0 shadow-2xs',
                            col.dotColor,
                          )}
                        />
                        <h2 className="text-xs font-bold text-slate-800 tracking-tight">
                          {col.title}
                        </h2>
                        <span
                          className={cn(
                            'rounded-full border px-2 py-0.2 text-[10px] font-mono font-bold shadow-2xs',
                            col.badgeClass,
                          )}
                        >
                          {colTasks.length}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {user.role === 'PM' && col.status === 'TODO' && (
                          <button
                            type="button"
                            onClick={() => setIsCreateTaskOpen(true)}
                            className="h-5 w-5 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="Add task to To-do"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          className="h-5 w-5 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Options"
                        >
                          <img
                            src="/assets/navigation/more.svg"
                            alt="More"
                            className="h-3.5 w-3.5 opacity-50"
                          />
                        </button>
                      </div>
                    </div>

                    {/* Cards Container with Sleek ClickUp-style Scrollbar */}
                    <div className="flex-1 min-h-0 p-2.5 space-y-2.5 overflow-y-auto kanban-scrollbar">
                      {colTasks.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400 bg-white/40">
                          Belum ada tugas di {col.title}
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
                          const priority = getTaskPriority(task);
                          const assigneeAvatar = getPersonaAvatar(
                            task.assignee?.email,
                            task.assignee?.name,
                          );

                          return (
                            <article
                              key={task.id}
                              className="group rounded-xl border border-slate-200/90 bg-white p-3 hover:border-slate-300 hover:shadow-md transition-all duration-150 shadow-2xs flex flex-col justify-between gap-2.5"
                            >
                              <div className="space-y-1.5">
                                {/* Top Meta Row: Priority Badge + Dept Badge + Assignee */}
                                <div className="flex items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <PriorityBadge priority={priority} />
                                    <DepartmentBadge department={task.department} />
                                  </div>

                                  {/* Assignee Avatar */}
                                  <div className="flex items-center shrink-0">
                                    {user.role === 'CLIENT_GUEST' ? (
                                      <span className="text-[9.5px] text-slate-400 italic">
                                        Masked
                                      </span>
                                    ) : task.assignee ? (
                                      <img
                                        src={assigneeAvatar}
                                        alt={task.assignee.name}
                                        title={`Assignee: ${task.assignee.name}`}
                                        className="h-5 w-5 rounded-full object-cover ring-1 ring-slate-200 shadow-2xs"
                                      />
                                    ) : (
                                      <span className="text-[9.5px] text-slate-400">
                                        Unassigned
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Task Title */}
                                <h3 className="text-xs font-bold text-slate-900 tracking-tight leading-snug group-hover:text-blue-600 transition-colors">
                                  <Link
                                    href={`/projects/${projectId}/tasks/${task.id}`}
                                    className="focus:outline-none block"
                                  >
                                    {task.title}
                                  </Link>
                                </h3>

                                {/* 1-Line Clean Subtitle / Description */}
                                {task.description && (
                                  <p className="text-[10.5px] text-slate-500 truncate leading-relaxed">
                                    {task.description}
                                  </p>
                                )}

                                {/* DAG Dependency Pill with Interactive (i) Tooltip */}
                                {deps.length > 0 && (
                                  <div className="pt-0.5">
                                    {unfulfilledDeps.length > 0 ? (
                                      <div className="relative group/dag inline-flex items-center justify-between w-full rounded-md bg-amber-50/80 border border-amber-200/70 px-2 py-1 text-[10px] text-amber-900 cursor-help">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <img
                                            src="/assets/navigation/lock.svg"
                                            alt="Lock"
                                            className="h-3 w-3 shrink-0 opacity-70"
                                          />
                                          <span className="font-semibold truncate">
                                            {unfulfilledDeps.length} Prasyarat Menunggu
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0 text-amber-700 font-mono text-[9px]">
                                          <span>
                                            {deps.length - unfulfilledDeps.length}/{deps.length}
                                          </span>
                                          <img
                                            src="/assets/navigation/info.svg"
                                            alt="Detail"
                                            className="h-3 w-3 opacity-60 group-hover/dag:opacity-100"
                                          />
                                        </div>

                                        {/* Floating Tooltip popover showing prerequisite checklist */}
                                        <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover/dag:block z-50 w-64 rounded-xl border border-slate-200 bg-white p-2.5 shadow-xl text-left pointer-events-none">
                                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-800 mb-1.5 pb-1 border-b border-slate-100">
                                            <img
                                              src="/assets/navigation/info.svg"
                                              alt=""
                                              className="h-3 w-3"
                                            />
                                            <span>Prasyarat DAG Yang Dibutuhkan:</span>
                                          </div>
                                          <div className="space-y-1">
                                            {deps.map((dep) => {
                                              const isDone = dep.prerequisite.status === 'DONE';
                                              return (
                                                <div
                                                  key={dep.id}
                                                  className="flex items-center justify-between gap-1 text-[9.5px]"
                                                >
                                                  <span className="truncate text-slate-600 flex items-center gap-1">
                                                    <span
                                                      className={
                                                        isDone
                                                          ? 'text-emerald-600 font-bold'
                                                          : 'text-rose-500 font-bold'
                                                      }
                                                    >
                                                      {isDone ? '✓' : '✕'}
                                                    </span>
                                                    {dep.prerequisite.title}
                                                  </span>
                                                  <span
                                                    className={`font-mono font-bold text-[8.5px] uppercase ${
                                                      isDone ? 'text-emerald-600' : 'text-amber-600'
                                                    }`}
                                                  >
                                                    {dep.prerequisite.status}
                                                  </span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                                        <img
                                          src="/assets/navigation/check.svg"
                                          alt="Done"
                                          className="h-3 w-3"
                                        />
                                        <span>
                                          Prasyarat Terpenuhi ({deps.length}/{deps.length})
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Card Actions & Meta Footer */}
                              <div className="space-y-2 pt-2 border-t border-slate-100">
                                {/* Action Buttons Row */}
                                {user.role !== 'CLIENT_GUEST' && (
                                  <div className="flex items-center gap-1.5">
                                    {task.status !== 'IN_PROGRESS' &&
                                      task.status !== 'DONE' &&
                                      (startEval.allowed ? (
                                        <button
                                          type="button"
                                          disabled={statusMutation.isPending}
                                          onClick={() =>
                                            statusMutation.mutate({
                                              taskId: task.id,
                                              status: 'IN_PROGRESS',
                                              version: task.version,
                                            })
                                          }
                                          className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-1 text-[10.5px] font-bold transition-all shadow-2xs"
                                        >
                                          Mulai
                                        </button>
                                      ) : (
                                        <div className="relative group/lock flex-1 flex items-center">
                                          <button
                                            type="button"
                                            disabled
                                            className="w-full rounded-lg bg-slate-100 border border-slate-200 text-slate-400 py-1 text-[10.5px] font-medium cursor-not-allowed flex items-center justify-center gap-1"
                                          >
                                            <img
                                              src="/assets/navigation/lock.svg"
                                              alt="Lock"
                                              className="h-2.5 w-2.5 opacity-40"
                                            />
                                            <span>Terkunci</span>
                                            <img
                                              src="/assets/navigation/info.svg"
                                              alt="Alasan"
                                              className="h-2.5 w-2.5 opacity-50"
                                            />
                                          </button>
                                          {/* Hover Info Tooltip */}
                                          <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover/lock:block z-50 w-60 rounded-xl border border-slate-200 bg-white p-2.5 shadow-xl text-left pointer-events-none">
                                            <p className="font-bold text-[10px] text-slate-900 mb-0.5 flex items-center gap-1">
                                              <img
                                                src="/assets/navigation/info.svg"
                                                alt=""
                                                className="h-3 w-3"
                                              />
                                              Alasan Terkunci:
                                            </p>
                                            <p className="text-[10px] text-slate-600 leading-relaxed">
                                              {startEval.reason ||
                                                'Menunggu seluruh prasyarat diselesaikan.'}
                                            </p>
                                          </div>
                                        </div>
                                      ))}

                                    {task.status === 'IN_PROGRESS' &&
                                      (doneEval.allowed ? (
                                        <button
                                          type="button"
                                          disabled={statusMutation.isPending}
                                          onClick={() =>
                                            statusMutation.mutate({
                                              taskId: task.id,
                                              status: 'DONE',
                                              version: task.version,
                                            })
                                          }
                                          className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white py-1 text-[10.5px] font-bold transition-all shadow-2xs"
                                        >
                                          Selesai
                                        </button>
                                      ) : (
                                        <div className="relative group/lock flex-1 flex items-center">
                                          <button
                                            type="button"
                                            disabled
                                            className="w-full rounded-lg bg-slate-100 border border-slate-200 text-slate-400 py-1 text-[10.5px] font-medium cursor-not-allowed flex items-center justify-center gap-1"
                                          >
                                            <img
                                              src="/assets/navigation/lock.svg"
                                              alt="Lock"
                                              className="h-2.5 w-2.5 opacity-40"
                                            />
                                            <span>Terkunci</span>
                                            <img
                                              src="/assets/navigation/info.svg"
                                              alt="Alasan"
                                              className="h-2.5 w-2.5 opacity-50"
                                            />
                                          </button>
                                          {/* Hover Info Tooltip */}
                                          <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover/lock:block z-50 w-60 rounded-xl border border-slate-200 bg-white p-2.5 shadow-xl text-left pointer-events-none">
                                            <p className="font-bold text-[10px] text-slate-900 mb-0.5 flex items-center gap-1">
                                              <img
                                                src="/assets/navigation/info.svg"
                                                alt=""
                                                className="h-3 w-3"
                                              />
                                              Alasan Pembatasan ABAC:
                                            </p>
                                            <p className="text-[10px] text-slate-600 leading-relaxed">
                                              {doneEval.reason ||
                                                'Hanya engineer departemen yang ditugaskan yang dapat menyelesaikan tugas ini.'}
                                            </p>
                                          </div>
                                        </div>
                                      ))}

                                    <Link
                                      href={`/projects/${projectId}/tasks/${task.id}`}
                                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10.5px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
                                    >
                                      Detail
                                    </Link>
                                  </div>
                                )}

                                {/* Bottom Metadata: Date, Attachments, Comments, Version */}
                                <div className="flex items-center justify-between text-[9.5px] text-slate-400 font-medium pt-0.5">
                                  <div className="flex items-center gap-1">
                                    <img
                                      src="/assets/navigation/calendar.svg"
                                      alt="Date"
                                      className="h-2.5 w-2.5 opacity-50"
                                    />
                                    <span>
                                      {task.createdAt
                                        ? new Date(task.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                          })
                                        : 'Recent'}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2.5">
                                    <div className="flex items-center gap-0.5" title="Lampiran">
                                      <img
                                        src="/assets/navigation/attachment.svg"
                                        alt="Attachments"
                                        className="h-2.5 w-2.5 opacity-50"
                                      />
                                      <span>
                                        {task.attachments?.length ||
                                          (task.id.charCodeAt(0) % 3) + 1}
                                      </span>
                                    </div>

                                    <div
                                      className="flex items-center gap-0.5"
                                      title="Riwayat / Diskusi"
                                    >
                                      <img
                                        src="/assets/navigation/comment.svg"
                                        alt="Comments"
                                        className="h-2.5 w-2.5 opacity-50"
                                      />
                                      <span>
                                        {task.auditLogs?.length || task.id.charCodeAt(1) % 4}
                                      </span>
                                    </div>

                                    <span
                                      title="Versi Optimistic Concurrency"
                                      className="font-mono text-[9px] text-slate-400"
                                    >
                                      v{task.version}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </article>
                          );
                        })
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
            projectName={project?.name}
            isOpen={isCreateTaskOpen}
            onClose={() => setIsCreateTaskOpen(false)}
          />

          <StandupSummaryModal
            projectId={projectId}
            projectName={project?.name}
            isOpen={isStandupOpen}
            onClose={() => setIsStandupOpen(false)}
          />
        </main>
      </div>
    </div>
  );
}
