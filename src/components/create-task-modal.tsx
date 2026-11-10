'use client';

import { api, extractApiError } from '@/lib/api';
import type { User } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const createTaskSchema = z.object({
  title: z.string().min(2, 'Judul tugas minimal 2 karakter'),
  description: z.string().min(2, 'Deskripsi tugas minimal 2 karakter'),
  department: z.enum(['PRODUCT', 'UIUX', 'FRONTEND', 'BACKEND']),
  assigneeId: z.string().optional(),
  isClientVisible: z.boolean(),
});

type CreateTaskForm = z.infer<typeof createTaskSchema>;

interface CreateTaskModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTaskModal({ projectId, isOpen, onClose }: CreateTaskModalProps) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTaskForm>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      department: 'FRONTEND',
      assigneeId: '',
      isClientVisible: true,
    },
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: User[] }>('/auth/users');
      return res.data.data;
    },
    enabled: isOpen,
  });

  const internalUsers = (usersData || []).filter((u) => u.role !== 'CLIENT_GUEST');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const mutation = useMutation({
    mutationFn: async (values: CreateTaskForm) => {
      const payload = {
        title: values.title,
        description: values.description,
        department: values.department,
        assigneeId: values.assigneeId || undefined,
        isClientVisible: values.isClientVisible,
      };
      const res = await api.post(`/projects/${projectId}/tasks`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      reset();
      setServerError(null);
      onClose();
    },
    onError: (err) => {
      setServerError(extractApiError(err).message);
    },
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-task-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h2 id="create-task-title" className="text-lg font-bold text-slate-900">
            Tambah Tugas Deliverable Baru
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2.5 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            Tutup (Esc)
          </button>
        </div>

        <form onSubmit={handleSubmit((vals) => mutation.mutate(vals))} className="mt-4 space-y-4">
          {serverError && (
            <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900">
              {serverError}
            </div>
          )}

          <div>
            <label htmlFor="task-title" className="block text-sm font-semibold text-slate-800">
              Judul Tugas *
            </label>
            <input
              id="task-title"
              type="text"
              placeholder="Contoh: Integrasi API Checkout & Cart"
              {...register('title')}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0052CC] focus:outline-2 focus:outline-[#0052CC]"
            />
            {errors.title && (
              <p className="mt-1 text-xs font-medium text-rose-700">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="task-dept" className="block text-sm font-semibold text-slate-800">
                Divisi / Department *
              </label>
              <select
                id="task-dept"
                {...register('department')}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0052CC] focus:outline-2 focus:outline-[#0052CC]"
              >
                <option value="UIUX">UI/UX Design</option>
                <option value="FRONTEND">Frontend Engineering</option>
                <option value="BACKEND">Backend Engineering</option>
                <option value="PRODUCT">Product Management</option>
              </select>
            </div>

            <div>
              <label htmlFor="task-assignee" className="block text-sm font-semibold text-slate-800">
                Eksekutor (Assignee)
              </label>
              <select
                id="task-assignee"
                {...register('assigneeId')}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0052CC] focus:outline-2 focus:outline-[#0052CC]"
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
            <label htmlFor="task-desc" className="block text-sm font-semibold text-slate-800">
              Deskripsi & Spesifikasi Deliverable *
            </label>
            <textarea
              id="task-desc"
              rows={3}
              placeholder="Detail kriteria penerimaan dan deliverable yang harus diselesaikan..."
              {...register('description')}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0052CC] focus:outline-2 focus:outline-[#0052CC]"
            />
            {errors.description && (
              <p className="mt-1 text-xs font-medium text-rose-700">{errors.description.message}</p>
            )}
          </div>

          <div className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <input
              id="client-visible"
              type="checkbox"
              {...register('isClientVisible')}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0052CC] focus:ring-[#0052CC]"
            />
            <label htmlFor="client-visible" className="text-xs text-slate-700">
              <span className="block font-semibold text-slate-900">
                Tampilkan ke Klien (Client-Visible)
              </span>
              Jika dicentang, Client Guest dapat melihat judul dan status tugas ini (identitas
              engineer tetap di-masking otomatis oleh API).
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="min-h-[44px] rounded-lg bg-[#0052CC] px-5 py-2 text-sm font-semibold text-white hover:bg-[#003E99] disabled:opacity-60"
            >
              {mutation.isPending ? 'Menambahkan...' : 'Tambah Tugas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
