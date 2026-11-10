'use client';

import { DepartmentBadge, StatusBadge } from '@/components/status-badge';
import { api, extractApiError } from '@/lib/api';
import { evaluateStatusTransition, formatDateTime } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import type { ApiListResponse, ApiSingleResponse, Task, TaskStatus, User } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

const ALL_STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'];

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>;
}) {
  const { id: projectId, taskId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, token, isHydrated } = useAuthStore();

  // Form states for PM editing task core details
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editAssigneeId, setEditAssigneeId] = useState<string>('');
  const [editClientVisible, setEditClientVisible] = useState(false);

  // Dependency form state
  const [selectedPrereqId, setSelectedPrereqId] = useState('');

  // Attachment form state
  const [attFilename, setAttFilename] = useState('');
  const [attUrl, setAttUrl] = useState('');

  // Feedback banner
  const [banner, setBanner] = useState<{
    type: 'success' | 'error' | 'conflict';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (isHydrated && !token) {
      router.replace('/login');
    }
  }, [isHydrated, token, router]);

  const taskQuery = useQuery({
    queryKey: ['task', taskId, user?.id],
    queryFn: async () => {
      const res = await api.get<ApiSingleResponse<Task>>(`/tasks/${taskId}`);
      return res.data.data;
    },
    enabled: Boolean(isHydrated && token),
  });

  // Populate edit form when task loads
  useEffect(() => {
    if (taskQuery.data) {
      setEditTitle(taskQuery.data.title);
      setEditDesc(taskQuery.data.description);
      setEditAssigneeId(taskQuery.data.assignee?.id || taskQuery.data.assigneeId || '');
      setEditClientVisible(taskQuery.data.isClientVisible);
    }
  }, [taskQuery.data]);

  // All tasks in project (for adding dependencies)
  const projectTasksQuery = useQuery({
    queryKey: ['tasks', projectId, user?.id],
    queryFn: async () => {
      const res = await api.get<ApiListResponse<Task>>(`/projects/${projectId}/tasks`, {
        params: { rows: '50' },
      });
      return res.data.data;
    },
    enabled: Boolean(isHydrated && token && user?.role !== 'CLIENT_GUEST'),
  });

  // Users list (for PM changing assignee)
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: User[] }>('/auth/users');
      return res.data.data;
    },
    enabled: Boolean(isHydrated && token && user?.role === 'PM'),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    queryClient.invalidateQueries({ queryKey: ['project', projectId] });
  };

  // 1. Status Update Mutation
  const statusMutation = useMutation({
    mutationFn: async ({
      status,
      version,
    }: {
      status: TaskStatus;
      version: number;
    }) => {
      const res = await api.patch(`/tasks/${taskId}/status`, { status, version });
      return res.data;
    },
    onSuccess: () => {
      setBanner({
        type: 'success',
        message:
          'Status tugas berhasil diperbarui. Version counter bertambah +1 dan Audit Trail tercatat.',
      });
      invalidateAll();
    },
    onError: (err) => {
      const extracted = extractApiError(err);
      setBanner({
        type: extracted.status === 409 ? 'conflict' : 'error',
        message: extracted.message,
      });
    },
  });

  // 2. PM Core Task Update Mutation (with Optimistic Locking)
  const updateTaskMutation = useMutation({
    mutationFn: async (customVersion?: number) => {
      const currentVer = customVersion ?? taskQuery.data?.version ?? 1;
      const res = await api.patch(`/tasks/${taskId}`, {
        title: editTitle,
        description: editDesc,
        assigneeId: editAssigneeId || null,
        isClientVisible: editClientVisible,
        version: currentVer,
      });
      return res.data;
    },
    onSuccess: () => {
      setBanner({
        type: 'success',
        message:
          'Detail inti tugas berhasil disimpan dengan Optimistic Locking & dicatat ke Audit Log.',
      });
      invalidateAll();
    },
    onError: (err) => {
      const extracted = extractApiError(err);
      setBanner({
        type: extracted.status === 409 ? 'conflict' : 'error',
        message: extracted.message,
      });
    },
  });

  // 3. Add Dependency Mutation (with DFS Circular Dependency Detection)
  const addDepMutation = useMutation({
    mutationFn: async (prerequisiteId: string) => {
      const res = await api.post(`/tasks/${taskId}/dependencies`, { prerequisiteId });
      return res.data;
    },
    onSuccess: () => {
      setBanner({
        type: 'success',
        message: 'Prerequisite dependency berhasil ditambahkan.',
      });
      setSelectedPrereqId('');
      invalidateAll();
    },
    onError: (err) => {
      setBanner({
        type: 'error',
        message: extractApiError(err).message,
      });
    },
  });

  // 4. Remove Dependency Mutation
  const removeDepMutation = useMutation({
    mutationFn: async (depId: string) => {
      const res = await api.delete(`/tasks/${taskId}/dependencies/${depId}`);
      return res.data;
    },
    onSuccess: () => {
      setBanner({
        type: 'success',
        message: 'Prerequisite dependency berhasil dihapus.',
      });
      invalidateAll();
    },
    onError: (err) => {
      setBanner({
        type: 'error',
        message: extractApiError(err).message,
      });
    },
  });

  // 5. Upload Work Attachment Mutation
  const addAttachmentMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/tasks/${taskId}/attachments`, {
        filename: attFilename.trim(),
        fileUrl: attUrl.trim(),
      });
      return res.data;
    },
    onSuccess: () => {
      setBanner({
        type: 'success',
        message: 'Lampiran kerja (work attachment) berhasil diunggah dan tercatat di Audit Log.',
      });
      setAttFilename('');
      setAttUrl('');
      invalidateAll();
    },
    onError: (err) => {
      setBanner({
        type: 'error',
        message: extractApiError(err).message,
      });
    },
  });

  if (!isHydrated || !user) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center text-sm text-slate-600">
        Memuat detail tugas...
      </div>
    );
  }

  const task = taskQuery.data;
  const availableTasksForDep = (projectTasksQuery.data || []).filter((t) => t.id !== taskId);
  const internalUsers = (usersQuery.data || []).filter((u) => u.role !== 'CLIENT_GUEST');

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
        <Link href="/dashboard" className="hover:text-[#0052CC] hover:underline">
          Projects Overview
        </Link>
        <span>/</span>
        <Link href={`/projects/${projectId}`} className="hover:text-[#0052CC] hover:underline">
          Task Board Proyek
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-900">{task?.title || 'Detail Tugas'}</span>
      </div>

      {taskQuery.isLoading && (
        <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white p-6" />
      )}

      {taskQuery.isError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-300 bg-rose-50 p-6 text-rose-950"
        >
          <h2 className="text-base font-bold">Gagal Memuat Tugas</h2>
          <p className="mt-1 text-sm text-rose-800">{extractApiError(taskQuery.error).message}</p>
          <Link
            href={`/projects/${projectId}`}
            className="mt-4 inline-block rounded-lg bg-rose-800 px-4 py-2 text-xs font-semibold text-white"
          >
            Kembali ke Task Board
          </Link>
        </div>
      )}

      {task && (
        <div className="space-y-6">
          {/* Feedback / 409 Conflict Banner */}
          {banner && (
            <div
              role="alert"
              className={`flex flex-col justify-between gap-3 rounded-xl border p-4 text-xs sm:flex-row sm:items-center ${
                banner.type === 'conflict'
                  ? 'border-amber-400 bg-amber-50 text-amber-950'
                  : banner.type === 'error'
                    ? 'border-rose-300 bg-rose-50 text-rose-950'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-950'
              }`}
            >
              <div>
                <p className="font-bold uppercase">
                  {banner.type === 'conflict'
                    ? 'HTTP 409 Conflict (Optimistic Locking Rejection)'
                    : banner.type === 'error'
                      ? 'Validasi Ditolak (RBAC / ABAC / DAG Guard)'
                      : 'Operasi Berhasil'}
                </p>
                <p className="mt-0.5">{banner.message}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBanner(null);
                  taskQuery.refetch();
                }}
                className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-900 hover:bg-slate-100"
              >
                Muat Ulang Data Terbaru
              </button>
            </div>
          )}

          {/* Task Header Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={task.status} />
                <DepartmentBadge department={task.department} />
                <span className="rounded bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-bold text-slate-800 border border-slate-300">
                  Optimistic Lock Version: v{task.version}
                </span>
                {task.isClientVisible && (
                  <span className="rounded bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900 border border-amber-200">
                    Client-Visible
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-600">
                Assignee:{' '}
                {user.role === 'CLIENT_GUEST' ? (
                  <strong className="italic text-slate-700">
                    [Disensor oleh API Data Masking]
                  </strong>
                ) : task.assignee ? (
                  <strong className="text-slate-900">
                    {task.assignee.name} ({task.assignee.department})
                  </strong>
                ) : (
                  <span className="text-slate-500">Belum ditugaskan</span>
                )}
              </div>
            </div>

            <h1 className="mt-4 text-2xl font-bold text-slate-900">{task.title}</h1>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {task.description}
            </p>
          </div>

          {/* SECTION 1: State-Based Status Transition Engine */}
          {user.role !== 'CLIENT_GUEST' && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    State-Based Status Controls (RBAC + ABAC + DAG Protected)
                  </h2>
                  <p className="text-xs text-slate-600">
                    Tombol yang melanggar aturan ABAC atau memiliki prerequisite belum DONE otomatis
                    dikunci di UI dan divalidasi ulang di API backend.
                  </p>
                </div>

                {/* Tombol Simulasi Race Condition 409 Conflict */}
                <button
                  type="button"
                  onClick={() =>
                    statusMutation.mutate({
                      status: task.status === 'TODO' ? 'IN_PROGRESS' : 'TODO',
                      version: Math.max(1, task.version - 1 === task.version ? 999 : 999),
                    })
                  }
                  className="min-h-[38px] shrink-0 rounded-lg border border-amber-400 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-100"
                >
                  Simulasikan Race Condition (Test 409 Conflict)
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {ALL_STATUSES.map((st) => {
                  const evalResult = evaluateStatusTransition(user, task, st);
                  const isCurrent = task.status === st;
                  return (
                    <div
                      key={st}
                      className={`flex flex-col justify-between rounded-lg border p-3 ${
                        isCurrent
                          ? 'border-[#0052CC] bg-[#0052CC]/5'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{st}</span>
                          {isCurrent && (
                            <span className="rounded bg-[#0052CC] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                              Aktif
                            </span>
                          )}
                        </div>
                        {!isCurrent && evalResult.reason && (
                          <p className="mt-1.5 text-[11px] leading-snug text-rose-800">
                            {evalResult.reason}
                          </p>
                        )}
                        {!isCurrent && evalResult.allowed && (
                          <p className="mt-1.5 text-[11px] text-emerald-800">
                            Transisi diizinkan untuk peran Anda.
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={!evalResult.allowed || statusMutation.isPending}
                        onClick={() =>
                          statusMutation.mutate({
                            status: st,
                            version: task.version,
                          })
                        }
                        className="mt-3 min-h-[38px] w-full rounded-md bg-[#0052CC] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#003E99] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                      >
                        {isCurrent
                          ? 'Status Saat Ini'
                          : evalResult.allowed
                            ? `Ubah ke ${st}`
                            : 'Terkunci (Locked)'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 2: Core Task Description Editor (PM Only vs Locked for Internal Team) */}
          {user.role !== 'CLIENT_GUEST' && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900">
                Pengaturan Deskripsi Inti & Penugasan (Optimistic Locking v{task.version})
              </h2>

              {user.role === 'INTERNAL_MEMBER' ? (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
                  <strong>Akses Terbatas (Internal Team Rule):</strong> Sesuai spesifikasi brief,
                  anggota tim internal tidak dapat mengubah deskripsi inti tugas; Anda hanya dapat
                  mengubah status tugas dan mengunggah lampiran hasil kerja di bawah.
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateTaskMutation.mutate(undefined);
                  }}
                  className="mt-4 space-y-4"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="edit-title"
                        className="block text-xs font-semibold text-slate-800"
                      >
                        Judul Tugas
                      </label>
                      <input
                        id="edit-title"
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="edit-assignee"
                        className="block text-xs font-semibold text-slate-800"
                      >
                        Eksekutor (Assignee)
                      </label>
                      <select
                        id="edit-assignee"
                        value={editAssigneeId}
                        onChange={(e) => setEditAssigneeId(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                      >
                        <option value="">Belum ditugaskan</option>
                        {internalUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.department})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="edit-desc"
                      className="block text-xs font-semibold text-slate-800"
                    >
                      Deskripsi Inti Tugas
                    </label>
                    <textarea
                      id="edit-desc"
                      rows={3}
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                      <input
                        type="checkbox"
                        checked={editClientVisible}
                        onChange={(e) => setEditClientVisible(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-[#0052CC]"
                      />
                      Tampilkan tugas ini ke Client Guest (isClientVisible)
                    </label>

                    <button
                      type="submit"
                      disabled={updateTaskMutation.isPending}
                      className="min-h-[40px] rounded-lg bg-[#0052CC] px-4 py-2 text-xs font-semibold text-white hover:bg-[#003E99] disabled:opacity-50"
                    >
                      {updateTaskMutation.isPending
                        ? 'Menyimpan...'
                        : `Simpan Perubahan (Kirim v${task.version})`}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* SECTION 3: Inter-Task Dependencies (DAG & Circular Detection) */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">
              Inter-Task Dependencies (Directed Acyclic Graph / DAG)
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Tugas ini tidak dapat dimulai (IN_PROGRESS) atau diselesaikan (DONE) sebelum seluruh
              tugas prasyarat di bawah berstatus DONE.
            </p>

            {/* Prerequisite List */}
            <div className="mt-4 space-y-2">
              {(task.dependencies || []).length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-600">
                  Tugas ini tidak memiliki prasyarat (prerequisite) dan dapat langsung dikerjakan.
                </p>
              ) : (
                (task.dependencies || []).map((dep) => (
                  <div
                    key={dep.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <StatusBadge status={dep.prerequisite.status} />
                      <Link
                        href={`/projects/${projectId}/tasks/${dep.prerequisite.id}`}
                        className="text-sm font-semibold text-slate-900 hover:text-[#0052CC] hover:underline"
                      >
                        {dep.prerequisite.title}
                      </Link>
                    </div>

                    {user.role === 'PM' && (
                      <button
                        type="button"
                        onClick={() => removeDepMutation.mutate(dep.id)}
                        disabled={removeDepMutation.isPending}
                        className="rounded border border-rose-300 bg-white px-2.5 py-1 text-xs font-semibold text-rose-800 hover:bg-rose-50"
                      >
                        Hapus Prerequisite
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* PM Add Dependency Form */}
            {user.role === 'PM' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (selectedPrereqId) addDepMutation.mutate(selectedPrereqId);
                }}
                className="mt-4 flex flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:items-center"
              >
                <label htmlFor="add-prereq" className="sr-only">
                  Pilih tugas prasyarat
                </label>
                <select
                  id="add-prereq"
                  value={selectedPrereqId}
                  onChange={(e) => setSelectedPrereqId(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                >
                  <option value="">
                    -- Pilih tugas lain sebagai Prerequisite (Dilengkapi Deteksi Siklus DFS) --
                  </option>
                  {availableTasksForDep.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.status}] {t.title} ({t.department})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!selectedPrereqId || addDepMutation.isPending}
                  className="min-h-[38px] shrink-0 rounded-lg bg-[#0052CC] px-4 py-2 text-xs font-semibold text-white hover:bg-[#003E99] disabled:opacity-50"
                >
                  + Tambah Prerequisite
                </button>
              </form>
            )}
          </div>

          {/* SECTION 4: Work Attachments (Deliverables Evidence) */}
          {user.role !== 'CLIENT_GUEST' && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900">
                Work Attachments (Lampiran Hasil Kerja)
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                Unggah tautan bukti deliverable (Figma, PR GitHub, OpenAPI Spec, atau dokumen
                kerja).
              </p>

              <div className="mt-4 space-y-2">
                {(task.attachments || []).length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-600">
                    Belum ada lampiran kerja pada tugas ini.
                  </p>
                ) : (
                  (task.attachments || []).map((att) => (
                    <div
                      key={att.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs"
                    >
                      <div>
                        <a
                          href={att.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-[#0052CC] hover:underline"
                        >
                          {att.filename}
                        </a>
                        <span className="ml-2 text-slate-600">({att.fileUrl})</span>
                      </div>
                      <span className="text-slate-600">
                        Diunggah: {formatDateTime(att.createdAt)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {(user.role === 'PM' ||
                task.assignee?.id === user.id ||
                task.assigneeId === user.id) && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (attFilename && attUrl) addAttachmentMutation.mutate();
                  }}
                  className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-200 pt-4 sm:grid-cols-12"
                >
                  <input
                    type="text"
                    placeholder="Nama File (contoh: Desain-Final-v2.fig)"
                    value={attFilename}
                    onChange={(e) => setAttFilename(e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 sm:col-span-4"
                  />
                  <input
                    type="url"
                    placeholder="URL Lampiran (https://...)"
                    value={attUrl}
                    onChange={(e) => setAttUrl(e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 sm:col-span-5"
                  />
                  <button
                    type="submit"
                    disabled={!attFilename || !attUrl || addAttachmentMutation.isPending}
                    className="min-h-[38px] rounded-lg bg-[#0052CC] px-4 py-2 text-xs font-semibold text-white hover:bg-[#003E99] disabled:opacity-50 sm:col-span-3"
                  >
                    + Upload Attachment
                  </button>
                </form>
              )}
            </div>
          )}

          {/* SECTION 5: Immutable Audit Trail Table */}
          {user.role !== 'CLIENT_GUEST' && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900">
                Immutable Audit Trail (Change Data Capture Log)
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                Setiap perubahan pada kolom tugas dicatat secara permanen (append-only) beserta User
                ID, Timestamp, Kolom yang Berubah, Nilai Lama, dan Nilai Baru.
              </p>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-800">
                      <th className="px-3 py-2.5 font-bold">Timestamp</th>
                      <th className="px-3 py-2.5 font-bold">Actor (User)</th>
                      <th className="px-3 py-2.5 font-bold">Changed Column</th>
                      <th className="px-3 py-2.5 font-bold">Old Value</th>
                      <th className="px-3 py-2.5 font-bold">New Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(task.auditLogs || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-slate-600">
                          Belum ada riwayat perubahan tercatat pada tugas ini.
                        </td>
                      </tr>
                    ) : (
                      (task.auditLogs || []).map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                            {formatDateTime(log.createdAt)}
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-slate-900">
                            {log.user?.name || log.userId}
                          </td>
                          <td className="px-3 py-2.5">
                            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono font-semibold text-[#0052CC]">
                              {log.changedColumn}
                            </code>
                          </td>
                          <td className="max-w-xs truncate px-3 py-2.5 text-rose-800">
                            {log.oldValue ?? 'null'}
                          </td>
                          <td className="max-w-xs truncate px-3 py-2.5 font-semibold text-emerald-900">
                            {log.newValue ?? 'null'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
