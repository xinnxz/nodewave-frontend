'use client';

import { api, extractApiError } from '@/lib/api';
import type { User } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-project-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#0d0f14] p-6 shadow-2xl text-zinc-100">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <h2 id="create-project-title" className="text-lg font-bold text-white tracking-tight">
            Buat Proyek Baru
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            Tutup (Esc)
          </button>
        </div>

        <form onSubmit={handleSubmit((vals) => mutation.mutate(vals))} className="mt-4 space-y-4">
          {serverError && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {serverError}
            </div>
          )}

          <div>
            <label htmlFor="project-name" className="block text-xs font-medium text-zinc-300">
              Nama Proyek *
            </label>
            <input
              id="project-name"
              type="text"
              placeholder="Contoh: Sistem ERP Logistik Nasional"
              {...register('name')}
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-[#090b0e] px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none transition-colors"
            />
            {errors.name && (
              <p className="mt-1 text-xs font-medium text-rose-400">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="client-name" className="block text-xs font-medium text-zinc-300">
              Nama Perusahaan Klien *
            </label>
            <input
              id="client-name"
              type="text"
              placeholder="Contoh: PT Maju Jaya"
              {...register('clientName')}
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-[#090b0e] px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none transition-colors"
            />
            {errors.clientName && (
              <p className="mt-1 text-xs font-medium text-rose-400">{errors.clientName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="client-account" className="block text-xs font-medium text-zinc-300">
              Hubungkan ke Akun Client Guest (Multi-Tenant Isolation)
            </label>
            <select
              id="client-account"
              {...register('clientId')}
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-[#090b0e] px-3.5 py-2 text-xs text-white focus:border-zinc-500 focus:outline-none transition-colors"
            >
              <option value="">Tidak dihubungkan</option>
              {clientUsers.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="project-desc" className="block text-xs font-medium text-zinc-300">
              Deskripsi Proyek
            </label>
            <textarea
              id="project-desc"
              rows={3}
              placeholder="Ruang lingkup deliverables dan target utama..."
              {...register('description')}
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-[#090b0e] px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-zinc-800/80 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-lg bg-white px-5 py-2 text-xs font-semibold text-black hover:bg-zinc-200 transition-colors disabled:opacity-60"
            >
              {mutation.isPending ? 'Menyimpan...' : 'Simpan Proyek'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
