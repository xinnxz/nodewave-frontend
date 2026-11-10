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

const registerSchema = z.object({
  name: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.enum(['PM', 'INTERNAL_MEMBER', 'CLIENT_GUEST']),
  department: z.enum(['PRODUCT', 'UIUX', 'FRONTEND', 'BACKEND', 'CLIENT']),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'INTERNAL_MEMBER',
      department: 'FRONTEND',
    },
  });

  const onSubmit = async (values: RegisterForm) => {
    setIsLoading(true);
    setServerError(null);
    try {
      const res = await api.post<{
        success: boolean;
        data: { user: User; token: string };
      }>('/auth/register', values);
      setAuth(res.data.data.user, res.data.data.token);
      router.push('/dashboard');
    } catch (err) {
      setServerError(extractApiError(err).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0052CC] text-base font-bold text-white">
            NW
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Registrasi Akun Baru
            </h1>
            <p className="text-xs font-medium text-slate-600">
              NodeWave Deliverables Management System
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
            <label htmlFor="name" className="block text-sm font-semibold text-slate-800">
              Nama Lengkap
            </label>
            <input
              id="name"
              type="text"
              placeholder="Contoh: Luthfi Alfaridz"
              {...register('name')}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0052CC] focus:outline-2 focus:outline-[#0052CC]"
            />
            {errors.name && (
              <p className="mt-1 text-xs font-medium text-rose-700">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-800">
              Alamat Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="nama@nodewave.id"
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
              placeholder="Minimal 6 karakter"
              {...register('password')}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0052CC] focus:outline-2 focus:outline-[#0052CC]"
            />
            {errors.password && (
              <p className="mt-1 text-xs font-medium text-rose-700">{errors.password.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="role" className="block text-sm font-semibold text-slate-800">
                Peran (Role)
              </label>
              <select
                id="role"
                {...register('role')}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-[#0052CC] focus:outline-2 focus:outline-[#0052CC]"
              >
                <option value="PM">Product Manager</option>
                <option value="INTERNAL_MEMBER">Internal Team</option>
                <option value="CLIENT_GUEST">Client Guest</option>
              </select>
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-semibold text-slate-800">
                Divisi (Dept)
              </label>
              <select
                id="department"
                {...register('department')}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-[#0052CC] focus:outline-2 focus:outline-[#0052CC]"
              >
                <option value="PRODUCT">Product</option>
                <option value="UIUX">UI/UX</option>
                <option value="FRONTEND">Frontend</option>
                <option value="BACKEND">Backend</option>
                <option value="CLIENT">Client</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="min-h-[44px] w-full rounded-lg bg-[#0052CC] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#003E99] disabled:opacity-60"
          >
            {isLoading ? 'Mendaftarkan Akun...' : 'Buat Akun Sekarang'}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-200 pt-4 text-center">
          <p className="text-xs text-slate-600">
            Sudah memiliki akun?{' '}
            <Link href="/login" className="font-semibold text-[#0052CC] hover:underline">
              Kembali ke halaman Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
