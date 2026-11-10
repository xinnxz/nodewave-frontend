'use client';

import { CreateProjectModal } from '@/components/create-project-modal';
import { api, extractApiError } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import type { ApiListResponse, Project } from '@/types';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isHydrated } = useAuthStore();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (isHydrated && !token) {
      router.replace('/login');
    }
  }, [isHydrated, token, router]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['projects', user?.id, searchKeyword],
    queryFn: async () => {
      const params: Record<string, string> = {
        page: '1',
        rows: '20',
      };
      if (searchKeyword.trim()) {
        params.searchFilters = JSON.stringify({ name: searchKeyword.trim() });
      }
      const res = await api.get<ApiListResponse<Project>>('/projects', { params });
      return res.data;
    },
    enabled: Boolean(isHydrated && token),
  });

  if (!isHydrated || !user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm font-medium text-slate-600">
          Memverifikasi sesi pengguna...
        </div>
      </div>
    );
  }

  const projects = data?.data || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header & Active Role Context Banner */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Projects & Deliverables Overview
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {user.role === 'PM' &&
              'Mode Product Manager: Anda memiliki akses penuh untuk membuat proyek, menugaskan tim, dan mengatur dependensi.'}
            {user.role === 'INTERNAL_MEMBER' &&
              `Mode Internal Engineer (${user.department}): Menampilkan proyek yang memiliki tugas yang ditugaskan kepada Anda.`}
            {user.role === 'CLIENT_GUEST' &&
              'Mode Client Guest (Multi-Tenant Isolation): Menampilkan metrik agregat proyek milik organisasi Anda.'}
          </p>
        </div>

        {user.role === 'PM' && (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="min-h-[44px] shrink-0 rounded-lg bg-[#0052CC] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#003E99] focus:outline-2 focus:outline-offset-2 focus:outline-[#0052CC]"
          >
            + Buat Proyek Baru
          </button>
        )}
      </div>

      {/* Search & Filter Bar (@nodewave/prisma-ezfilter contract) */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <label htmlFor="search-project" className="sr-only">
            Cari nama proyek
          </label>
          <input
            id="search-project"
            type="search"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Cari proyek (via @nodewave/prisma-ezfilter)..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-[#0052CC] focus:outline-2 focus:outline-[#0052CC]"
          />
        </div>

        <div className="text-xs font-medium text-slate-600">
          Menampilkan <strong>{projects.length}</strong> proyek
        </div>
      </div>

      {/* 1. Loading State */}
      {isLoading && (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="h-48 animate-pulse rounded-xl border border-slate-200 bg-white p-6"
            >
              <div className="h-5 w-1/2 rounded bg-slate-200" />
              <div className="mt-3 h-4 w-3/4 rounded bg-slate-100" />
              <div className="mt-8 h-3 w-full rounded bg-slate-200" />
            </div>
          ))}
        </div>
      )}

      {/* 2. Error State */}
      {isError && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-rose-300 bg-rose-50 p-6 text-rose-950"
        >
          <h2 className="text-base font-bold">Gagal Memuat Daftar Proyek</h2>
          <p className="mt-1 text-sm text-rose-800">{extractApiError(error).message}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 min-h-[40px] rounded-lg bg-rose-800 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-900"
          >
            Coba Muat Ulang
          </button>
        </div>
      )}

      {/* 3. Empty State */}
      {!isLoading && !isError && projects.length === 0 && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-10 text-center">
          <h2 className="text-base font-bold text-slate-900">Belum Ada Proyek Ditemukan</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
            {searchKeyword
              ? `Tidak ada proyek yang cocok dengan pencarian "${searchKeyword}".`
              : 'Saat ini belum ada proyek yang terdaftar pada ruang lingkup akses akun Anda.'}
          </p>
          {user.role === 'PM' && !searchKeyword && (
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="mt-4 min-h-[44px] rounded-lg bg-[#0052CC] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#003E99]"
            >
              + Buat Proyek Pertama
            </button>
          )}
        </div>
      )}

      {/* 4. Data Grid */}
      {!isLoading && !isError && projects.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {projects.map((project) => {
            const pct = Number.parseInt(project.metrics.progress, 10) || 0;
            return (
              <div
                key={project.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="inline-block rounded bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-300">
                        Klien: {project.clientName}
                      </span>
                      <h2 className="mt-2 text-lg font-bold text-slate-900">
                        <Link
                          href={`/projects/${project.id}`}
                          className="hover:text-[#0052CC] focus:outline-2 focus:outline-[#0052CC]"
                        >
                          {project.name}
                        </Link>
                      </h2>
                    </div>

                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-right">
                      <span className="block text-base font-bold text-emerald-900">
                        {project.metrics.progress}
                      </span>
                      <span className="block text-[11px] font-medium text-emerald-800">
                        Complete
                      </span>
                    </div>
                  </div>

                  <p className="mt-2.5 line-clamp-2 text-sm text-slate-600">
                    {project.description || 'Tidak ada deskripsi tambahan.'}
                  </p>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-4">
                  {/* Progress Bar */}
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                    <span>
                      Deliverables Selesai: <strong>{project.metrics.doneTasks}</strong> dari{' '}
                      <strong>{project.metrics.totalTasks}</strong> tugas
                    </span>
                    <span>{project.metrics.progress}</span>
                  </div>
                  <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-[#0052CC] transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-slate-600">
                      Diperbarui: {formatDateTime(project.updatedAt)}
                    </span>
                    <Link
                      href={`/projects/${project.id}`}
                      className="inline-flex min-h-[38px] items-center rounded-lg bg-[#0052CC] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#003E99] focus:outline-2 focus:outline-offset-2 focus:outline-[#0052CC]"
                    >
                      Buka Task Board
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateProjectModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
