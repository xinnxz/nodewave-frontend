'use client';

import { api, extractApiError } from '@/lib/api';
import type { User } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FolderPlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(2, 'Nama proyek minimal 2 karakter'),
  clientName: z.string().min(2, 'Nama klien minimal 2 karakter'),
  description: z.string().optional(),
  clientId: z.string().optional(),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      clientName: '',
      description: '',
      clientId: '',
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

  const clientUsers = (usersData || []).filter((u) => u.role === 'CLIENT_GUEST');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const mutation = useMutation({
    mutationFn: async (values: CreateProjectForm) => {
      const payload = {
        name: values.name,
        clientName: values.clientName,
        description: values.description || undefined,
        clientId: values.clientId || undefined,
      };
      const res = await api.post('/projects', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-project-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-800 shadow-2xs">
              <FolderPlus className="h-4 w-4" />
            </div>
            <div>
              <h2
                id="create-project-title"
                className="text-sm font-bold text-slate-900 leading-tight"
              >
                Buat Proyek Baru
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Workspace Enterprise multi-tenant project & deliverables governance.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            title="Tutup (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit((vals) => mutation.mutate(vals))} className="mt-5 space-y-4">
          {serverError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 font-medium">
              {serverError}
            </div>
          )}

          <div>
            <label htmlFor="project-name" className="block text-xs font-bold text-slate-900">
              Nama Proyek *
            </label>
            <input
              id="project-name"
              type="text"
              placeholder="Contoh: Sistem ERP Logistik Nasional"
              {...register('name')}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all"
            />
            {errors.name && (
              <p className="mt-1 text-[11px] font-medium text-rose-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="client-name" className="block text-xs font-bold text-slate-900">
              Nama Perusahaan Klien *
            </label>
            <input
              id="client-name"
              type="text"
              placeholder="Contoh: PT Maju Jaya"
              {...register('clientName')}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all"
            />
            {errors.clientName && (
              <p className="mt-1 text-[11px] font-medium text-rose-600">
                {errors.clientName.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="client-account" className="block text-xs font-bold text-slate-900">
              Hubungkan ke Akun Client Guest (Multi-Tenant Isolation)
            </label>
            <select
              id="client-account"
              {...register('clientId')}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all"
            >
              <option value="">Tidak dihubungkan (Internal Only)</option>
              {clientUsers.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="project-desc" className="block text-xs font-bold text-slate-900">
              Deskripsi Proyek
            </label>
            <textarea
              id="project-desc"
              rows={3}
              placeholder="Ruang lingkup deliverables dan target utama..."
              {...register('description')}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-60"
            >
              {mutation.isPending ? 'Menyimpan...' : 'Simpan Proyek'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
