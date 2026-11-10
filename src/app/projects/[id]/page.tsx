'use client';

import { CreateTaskModal } from '@/components/create-task-modal';
import { StandupSummaryModal } from '@/components/standup-summary-modal';
import { DepartmentBadge, StatusBadge } from '@/components/status-badge';
import { api, extractApiError } from '@/lib/api';
import { evaluateStatusTransition } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import type { ApiListResponse, ApiSingleResponse, Project, Task, TaskStatus } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

const KANBAN_COLUMNS: Array<{
  status: TaskStatus;
  title: string;
  headerBg: string;
  borderClass: string;
}> = [
  {
    status: 'TODO',
    title: 'To Do',
    headerBg: 'bg-slate-100 text-slate-900',
    borderClass: 'border-slate-200',
  },
  {
    status: 'IN_PROGRESS',
    title: 'In Progress',
    headerBg: 'bg-sky-50 text-sky-950',
    borderClass: 'border-sky-200',
  },
  {
    status: 'BLOCKED',
    title: 'Blocked (Waiting Prerequisites)',
    headerBg: 'bg-rose-50 text-rose-950',
    borderClass: 'border-rose-300',
  },
  {
    status: 'DONE',
    title: 'Done (Completed)',
    headerBg: 'bg-emerald-50 text-emerald-950',
    borderClass: 'border-emerald-200',
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
      <div className="mx-auto max-w-7xl px-4 py-12 text-center text-sm text-slate-600">
        Memuat halaman proyek...
      </div>
    );
  }

  const project = projectQuery.data;
  const tasks = tasksQuery.data?.data || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-xs font-medium text-slate-600">
        <Link href="/dashboard" className="hover:text-[#0052CC] hover:underline">
          Projects Overview
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-900">{project?.name || 'Detail Proyek'}</span>
      </div>

      {/* Loading or Error for Project */}
      {projectQuery.isLoading && (
        <div className="h-32 animate-pulse rounded-xl border border-slate-200 bg-white p-6" />
      )}

      {projectQuery.isError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-300 bg-rose-50 p-6 text-rose-950"
        >
          <h2 className="text-base font-bold">Akses Ditolak atau Proyek Tidak Ditemukan</h2>
          <p className="mt-1 text-sm text-rose-800">
            {extractApiError(projectQuery.error).message}
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block rounded-lg bg-rose-800 px-4 py-2 text-xs font-semibold text-white"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      )}

      {project && (
        <>
          {/* Project Header Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800 border border-slate-300">
                    Klien: {project.clientName}
                  </span>
                  <span className="rounded bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-900 border border-emerald-200">
                    {project.metrics.progress} Complete ({project.metrics.doneTasks}/
                    {project.metrics.totalTasks} Deliverables)
                  </span>
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                  {project.name}
                </h1>
                <p className="mt-1 max-w-3xl text-sm text-slate-600">{project.description}</p>
              </div>

              {user.role === 'PM' && (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsStandupOpen(true)}
                    className="min-h-[42px] rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 focus:outline-2 focus:outline-[#0052CC]"
                  >
                    Daily Standup Auto-Summary
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateTaskOpen(true)}
                    className="min-h-[42px] rounded-lg bg-[#0052CC] px-4 py-2 text-xs font-semibold text-white hover:bg-[#003E99] focus:outline-2 focus:outline-[#0052CC]"
                  >
                    + Tambah Tugas Baru
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Client Guest Data Masking & Isolation Notice */}
          {user.role === 'CLIENT_GUEST' && (
            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950">
              <p className="font-bold">
                Mode Isolasi Multi-Tenant & API Data Masking Aktif (Client Guest View)
              </p>
              <p className="mt-1">
                Anda hanya melihat tugas yang ditandai{' '}
                <code className="rounded bg-white px-1 py-0.5 font-mono font-semibold">
                  isClientVisible = true
                </code>{' '}
                oleh Product Manager. Seluruh identitas tim internal (nama engineer, email, avatar,
                dan riwayat audit log) telah dihapus otomatis dari JSON response di level backend
                API.
              </p>
            </div>
          )}

          {/* Action Feedback / 409 Conflict Alert */}
          {actionFeedback && (
            <div
              role="alert"
              className={`mt-4 flex items-center justify-between rounded-xl border p-4 text-xs font-medium ${
                actionFeedback.type === 'conflict'
                  ? 'border-amber-400 bg-amber-50 text-amber-950'
                  : actionFeedback.type === 'error'
                    ? 'border-rose-300 bg-rose-50 text-rose-950'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-950'
              }`}
            >
              <div>
                <span className="font-bold uppercase">
                  {actionFeedback.type === 'conflict'
                    ? '409 Concurrency Conflict: '
                    : actionFeedback.type === 'error'
                      ? 'Action Blocked: '
                      : 'Sukses: '}
                </span>
                {actionFeedback.message}
              </div>
              <button
                type="button"
                onClick={() => {
                  setActionFeedback(null);
                  tasksQuery.refetch();
                }}
                className="ml-4 shrink-0 rounded bg-white px-2.5 py-1 font-semibold text-slate-800 border border-slate-300 hover:bg-slate-100"
              >
                Refresh / Tutup
              </button>
            </div>
          )}

          {/* Filter & Search Toolbar (@nodewave/prisma-ezfilter) */}
          <div className="mt-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="w-full sm:max-w-xs">
                <label htmlFor="search-task" className="sr-only">
                  Cari judul tugas
                </label>
                <input
                  id="search-task"
                  type="search"
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                  placeholder="Cari judul tugas..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#0052CC] focus:outline-2 focus:outline-[#0052CC]"
                />
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="dept-filter" className="text-xs font-semibold text-slate-700">
                  Filter Divisi:
                </label>
                <select
                  id="dept-filter"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#0052CC] focus:outline-2 focus:outline-[#0052CC]"
                >
                  <option value="ALL">Semua Divisi</option>
                  <option value="UIUX">UI/UX Design</option>
                  <option value="FRONTEND">Frontend Eng</option>
                  <option value="BACKEND">Backend Eng</option>
                  <option value="PRODUCT">Product Mgmt</option>
                </select>
              </div>
            </div>

            <div className="text-xs font-medium text-slate-600">
              Menampilkan <strong>{tasks.length}</strong> tugas di papan kerja
            </div>
          </div>

          {/* Kanban Board Loading / Empty / Columns */}
          {tasksQuery.isLoading ? (
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-96 animate-pulse rounded-xl border border-slate-200 bg-white p-4"
                />
              ))}
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {KANBAN_COLUMNS.map((col) => {
                const colTasks = tasks.filter((t) => t.status === col.status);
                return (
                  <section
                    key={col.status}
                    aria-label={col.title}
                    className={`flex flex-col rounded-xl border ${col.borderClass} bg-slate-100/70`}
                  >
                    {/* Column Header */}
                    <div
                      className={`flex items-center justify-between rounded-t-xl border-b ${col.borderClass} ${col.headerBg} px-4 py-3`}
                    >
                      <h2 className="text-xs font-bold uppercase tracking-wider">{col.title}</h2>
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-800 border border-slate-300">
                        {colTasks.length}
                      </span>
                    </div>

                    {/* Cards Container */}
                    <div className="flex-1 space-y-3 p-3">
                      {colTasks.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-300 bg-white/60 p-6 text-center text-xs text-slate-600">
                          Tidak ada tugas pada kolom {col.title}.
                        </div>
                      ) : (
                        colTasks.map((task) => {
                          const deps = task.dependencies || [];
                          const unfulfilledDeps = deps.filter(
                            (d) => d.prerequisite.status !== 'DONE',
                          );

                          // Evaluasi tombol aksi cepat
                          const startEval = evaluateStatusTransition(user, task, 'IN_PROGRESS');
                          const doneEval = evaluateStatusTransition(user, task, 'DONE');

                          return (
                            <article
                              key={task.id}
                              className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs transition-shadow hover:shadow-md"
                            >
                              <div>
                                {/* Top Meta: Dept & Version */}
                                <div className="flex items-center justify-between gap-1">
                                  <DepartmentBadge department={task.department} />
                                  <span
                                    title="Optimistic Locking Version Counter"
                                    className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-700 border border-slate-300"
                                  >
                                    v{task.version}
                                  </span>
                                </div>

                                {/* Task Title */}
                                <h3 className="mt-2 text-sm font-bold text-slate-900">
                                  <Link
                                    href={`/projects/${projectId}/tasks/${task.id}`}
                                    className="hover:text-[#0052CC] hover:underline focus:outline-2 focus:outline-[#0052CC]"
                                  >
                                    {task.title}
                                  </Link>
                                </h3>

                                <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                                  {task.description}
                                </p>

                                {/* DAG Dependencies Section on Card */}
                                {deps.length > 0 && (
                                  <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                                      Prerequisites ({deps.length}):
                                    </p>
                                    <ul className="mt-1 space-y-1">
                                      {deps.map((dep) => {
                                        const isDone = dep.prerequisite.status === 'DONE';
                                        return (
                                          <li
                                            key={dep.id}
                                            className={`flex items-center justify-between gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${
                                              isDone
                                                ? 'bg-emerald-50 text-emerald-900'
                                                : 'bg-rose-50 text-rose-900 font-semibold'
                                            }`}
                                          >
                                            <span className="truncate">
                                              {isDone ? '[DONE] ' : '[BLOCKER] '}
                                              {dep.prerequisite.title}
                                            </span>
                                            <span className="shrink-0 text-[10px]">
                                              ({dep.prerequisite.status})
                                            </span>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </div>
                                )}

                                {/* Blocked Warning Banner */}
                                {unfulfilledDeps.length > 0 && (
                                  <div className="mt-2 rounded border border-rose-300 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-900">
                                    Terkunci: Menunggu {unfulfilledDeps.length} prerequisite selesai
                                    (DONE).
                                  </div>
                                )}
                              </div>

                              {/* Footer: Assignee & State-Based Action Buttons */}
                              <div className="mt-3 border-t border-slate-100 pt-2.5">
                                <div className="flex items-center justify-between text-[11px] text-slate-700">
                                  {user.role === 'CLIENT_GUEST' ? (
                                    <span className="italic text-slate-600">
                                      Assignee: [Masked by API]
                                    </span>
                                  ) : task.assignee ? (
                                    <span>
                                      Assignee: <strong>{task.assignee.name}</strong>
                                    </span>
                                  ) : (
                                    <span className="text-slate-500">Unassigned</span>
                                  )}

                                  {task.isClientVisible && user.role !== 'CLIENT_GUEST' && (
                                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900 border border-amber-200">
                                      Client Visible
                                    </span>
                                  )}
                                </div>

                                {/* Quick State-Based Action Controls (Dual-Layer Protected) */}
                                {user.role !== 'CLIENT_GUEST' && (
                                  <div className="mt-2.5 flex flex-col gap-1.5">
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
                                          className="flex-1 rounded border border-[#0052CC] bg-[#0052CC] px-2 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#003E99] disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-500"
                                        >
                                          {startEval.allowed
                                            ? 'Mulai Kerjakan'
                                            : 'Terkunci (Start)'}
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
                                          className="flex-1 rounded border border-emerald-700 bg-emerald-700 px-2 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-500"
                                        >
                                          {doneEval.allowed
                                            ? 'Tandai Selesai (Done)'
                                            : 'Terkunci (Done)'}
                                        </button>
                                      )}

                                      <Link
                                        href={`/projects/${projectId}/tasks/${task.id}`}
                                        className="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-800 hover:bg-slate-50"
                                      >
                                        Detail
                                      </Link>
                                    </div>

                                    {/* Tampilkan alasan mengapa tombol dikunci agar evaluator langsung melihat ABAC/DAG bekerja */}
                                    {task.status !== 'IN_PROGRESS' &&
                                      task.status !== 'DONE' &&
                                      !startEval.allowed &&
                                      startEval.reason && (
                                        <p className="text-[10px] leading-snug text-slate-600">
                                          {startEval.reason}
                                        </p>
                                      )}

                                    {task.status === 'IN_PROGRESS' &&
                                      !doneEval.allowed &&
                                      doneEval.reason && (
                                        <p className="text-[10px] leading-snug text-slate-600">
                                          {doneEval.reason}
                                        </p>
                                      )}
                                  </div>
                                )}
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
        </>
      )}
    </div>
  );
}
