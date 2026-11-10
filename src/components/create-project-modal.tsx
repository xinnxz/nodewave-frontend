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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-project-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h2 id="create-project-title" className="text-lg font-bold text-slate-900">
            Buat Proyek Baru
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
            <label htmlFor="project-name" className="block text-sm font-semibold text-slate-800">
              Nama Proyek *
            </label>
            <input
              id="project-name"
              type="text"
              placeholder="Contoh: Sistem ERP Logistik Nasional"
              {...register('name')}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0052CC] focus:outline-2 focus:outline-[#0052CC]"
            />
            {errors.name && (
              <p className="mt-1 text-xs font-medium text-rose-700">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="client-name" className="block text-sm font-semibold text-slate-800">
              Nama Perusahaan Klien *
            </label>
            <input
              id="client-name"
              type="text"
              placeholder="Contoh: PT Maju Jaya"
              {...register('clientName')}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0052CC] focus:outline-2 focus:outline-[#0052CC]"
            />
            {errors.clientName && (
              <p className="mt-1 text-xs font-medium text-rose-700">{errors.clientName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="client-account" className="block text-sm font-semibold text-slate-800">
              Hubungkan ke Akun Client Guest (Multi-Tenant Isolation)
            </label>
            <select
              id="client-account"
              {...register('clientId')}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0052CC] focus:outline-2 focus:outline-[#0052CC]"
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
            <label htmlFor="project-desc" className="block text-sm font-semibold text-slate-800">
              Deskripsi Proyek
            </label>
            <textarea
              id="project-desc"
              rows={3}
              placeholder="Ruang lingkup deliverables dan target utama..."
              {...register('description')}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0052CC] focus:outline-2 focus:outline-[#0052CC]"
            />
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
              {mutation.isPending ? 'Menyimpan...' : 'Simpan Proyek'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
