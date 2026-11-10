'use client';

import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const router = useRouter();
  const { token, isHydrated } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;
    if (token) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [token, isHydrated, router]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <p className="text-sm font-medium text-slate-600">Memuat sesi aplikasi...</p>
    </div>
  );
}
