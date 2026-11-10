'use client';

import { api, extractApiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import type { User } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

type LoginForm = z.infer<typeof loginSchema>;

const SEEDED_ACCOUNTS = [
  {
    name: 'Andi Pratama',
    role: 'Product Manager (PM)',
    dept: 'PRODUCT',
    email: 'pm@nodewave.id',
    desc: 'Full CRUD proyek & task, atur DAG dependency, tidak boleh set DONE.',
  },
  {
    name: 'Sari Dewi',
    role: 'Internal Team (UI/UX)',
    dept: 'UIUX',
    email: 'uiux@nodewave.id',
    desc: 'Eksekutor tugas desain UI/UX dan upload attachment kerja.',
  },
  {
    name: 'Budi Santoso',
    role: 'Internal Team (Frontend)',
    dept: 'FRONTEND',
    email: 'frontend@nodewave.id',
    desc: 'State-Based Edit: Terkunci jika task UI/UX atau Backend belum DONE.',
  },
  {
    name: 'Cahya Wijaya',
    role: 'Internal Team (Backend)',
    dept: 'BACKEND',
    email: 'backend@nodewave.id',
    desc: 'Eksekutor API & Payment Gateway (prerequisite untuk Frontend Cart).',
  },
  {
    name: 'PT Maju Jaya',
    role: 'Client Guest (Isolated)',
    dept: 'CLIENT',
    email: 'client@guest.com',
    desc: 'Read-only, hanya lihat task client-visible, identitas internal di-masking API.',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'pm@nodewave.id',
      password: 'Password123!',
    },
  });

  const onSubmit = async (values: LoginForm) => {
    setIsLoading(true);
    setServerError(null);
    try {
      const res = await api.post<{
        success: boolean;
        data: { user: User; token: string };
      }>('/auth/login', values);
      setAuth(res.data.data.user, res.data.data.token);
      router.push('/dashboard');
    } catch (err) {
      setServerError(extractApiError(err).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFillAndLogin = async (email: string) => {
    setValue('email', email);
    setValue('password', 'Password123!');
    await onSubmit({ email, password: 'Password123!' });
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        {/* Left Column: Login Form */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:col-span-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0052CC] text-base font-bold text-white">
              NW
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">NodeWave Portal</h1>
              <p className="text-xs font-medium text-slate-600">
                Deliverables & Dependency Management System
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
            {serverError && (
              <div
                role="alert"
                className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs font-medium text-rose-900"
              >
                {serverError}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-800">
                Alamat Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0052CC] focus:outline-2 focus:outline-[#0052CC]"
              />
              {errors.email && (
                <p className="mt-1 text-xs font-medium text-rose-700">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-800">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0052CC] focus:outline-2 focus:outline-[#0052CC]"
              />
              {errors.password && (
                <p className="mt-1 text-xs font-medium text-rose-700">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="min-h-[44px] w-full rounded-lg bg-[#0052CC] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#003E99] focus:outline-2 focus:outline-offset-2 focus:outline-[#0052CC] disabled:opacity-60"
            >
              {isLoading ? 'Memverifikasi Kredensial...' : 'Masuk ke Sistem'}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-4 text-center">
            <p className="text-xs text-slate-600">
              Belum memiliki akun?{' '}
              <Link href="/register" className="font-semibold text-[#0052CC] hover:underline">
                Daftar akun baru
              </Link>
            </p>
          </div>
        </div>

        {/* Right Column: Seeded Accounts Quick Access */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:col-span-7">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900">
              Akun Seeded Demo (1-Click Login untuk Evaluator)
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Klik salah satu kartu di bawah untuk langsung masuk dan menguji matriks otorisasi RBAC
              + ABAC, DAG Dependencies, dan Data Masking. Semua akun menggunakan password:{' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono font-semibold text-slate-900">
                Password123!
              </code>
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {SEEDED_ACCOUNTS.map((acc) => (
              <div
                key={acc.email}
                className="flex flex-col justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 transition-colors hover:border-[#0052CC]/50 hover:bg-white sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{acc.name}</span>
                    <span className="rounded bg-[#0052CC]/10 px-2 py-0.5 text-[11px] font-semibold text-[#0052CC]">
                      {acc.role}
                    </span>
                    <span className="rounded border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      {acc.email}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{acc.desc}</p>
                </div>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickFillAndLogin(acc.email)}
                  className="min-h-[38px] shrink-0 rounded-md border border-[#0052CC] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#0052CC] transition-colors hover:bg-[#0052CC] hover:text-white focus:outline-2 focus:outline-[#0052CC] disabled:opacity-50"
                >
                  Login sebagai {acc.dept}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
