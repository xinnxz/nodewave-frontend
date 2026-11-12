'use client';

import { api, extractApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { User } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Box, Code2, Database, Paperclip, Plus, PlusSquare, X } from 'lucide-react';
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
  projectName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTaskModal({
  projectId,
  projectName = 'E-Commerce Redesign (PT Maju Jaya)',
  isOpen,
  onClose,
}: CreateTaskModalProps) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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

  const selectedDept = watch('department');
  const isClientVisible = watch('isClientVisible');

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: User[] }>('/auth/users');
      return res.data.data;
    },
    enabled: isOpen,
  });

  const internalUsers = (usersData || []).filter((u) => u.role !== 'CLIENT_GUEST');

  // Auto-select matching user when department changes
  useEffect(() => {
    if (internalUsers.length > 0) {
      const matched = internalUsers.find((u) => u.department === selectedDept);
      if (matched) {
        setValue('assigneeId', matched.id);
      }
    }
  }, [selectedDept, internalUsers, setValue]);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-task-title"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-800 shadow-2xs">
              <PlusSquare className="h-4 w-4" />
            </div>
            <div>
              <h2 id="create-task-title" className="text-sm font-bold text-slate-900 leading-tight">
                Create New Task
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Add a new task to {projectName}.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            title="Close (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit((vals) => mutation.mutate(vals))} className="mt-5 space-y-4">
          {serverError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 font-medium">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left Column: Title & Description */}
            <div className="space-y-4">
              <div>
                <label htmlFor="task-title" className="block text-xs font-bold text-slate-900">
                  Title *
                </label>
                <input
                  id="task-title"
                  type="text"
                  placeholder="e.g. Implement Shopping Cart UI"
                  {...register('title')}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all"
                />
                {errors.title && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="task-desc" className="block text-xs font-bold text-slate-900">
                  Description
                </label>
                <textarea
                  id="task-desc"
                  rows={4}
                  placeholder="Describe the task, expected outcome, or technical notes..."
                  {...register('description')}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all resize-none"
                />
                {errors.description && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>

            {/* Right Column: Department, Assignee, Client Visible */}
            <div className="space-y-4">
              {/* Department Segmented Toggle Buttons */}
              <div>
                <span className="block text-xs font-bold text-slate-900 mb-1.5">Department *</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {(
                    [
                      { key: 'PRODUCT', label: 'PRODUCT', icon: Box },
                      { key: 'UIUX', label: 'UIUX', icon: Paperclip },
                      { key: 'FRONTEND', label: 'FRONTEND', icon: Code2 },
                      { key: 'BACKEND', label: 'BACKEND', icon: Database },
                    ] as const
                  ).map((dept) => {
                    const isSelected = selectedDept === dept.key;
                    const Icon = dept.icon;
                    return (
                      <button
                        key={dept.key}
                        type="button"
                        onClick={() => setValue('department', dept.key)}
                        className={cn(
                          'flex flex-col items-center justify-center gap-1 rounded-lg py-2 px-1 text-[10px] font-bold transition-all cursor-pointer',
                          isSelected
                            ? 'bg-slate-950 text-white shadow-xs'
                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{dept.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Assignee Selection */}
              <div>
                <label htmlFor="task-assignee" className="block text-xs font-bold text-slate-900">
                  Assignee *
                </label>
                <div className="relative mt-1.5">
                  <select
                    id="task-assignee"
                    {...register('assigneeId')}
                    className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="">Select Assignee</option>
                    {internalUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.department})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                    ▼
                  </div>
                </div>
              </div>

              {/* Visible to Client Guest Toggle */}
              <div className="pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label
                      htmlFor="client-visible-toggle"
                      className="block text-xs font-bold text-slate-900 leading-tight cursor-pointer"
                    >
                      Visible to Client Guest
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Task can be viewed by the client (external).
                    </p>
                  </div>

                  {/* iOS Style Switch Toggle */}
                  <button
                    id="client-visible-toggle"
                    type="button"
                    role="switch"
                    aria-checked={isClientVisible}
                    onClick={() => setValue('isClientVisible', !isClientVisible)}
                    className={cn(
                      'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none',
                      isClientVisible ? 'bg-slate-950' : 'bg-slate-200',
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5',
                        isClientVisible ? 'translate-x-4' : 'translate-x-0',
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Actions Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-slate-950 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{mutation.isPending ? 'Creating...' : 'Create Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
