import type { User } from '@/types';
import { create } from 'zustand';

/**
 * Zustand 5 Auth Store
 *
 * Mengelola state autentikasi global di sisi client (user profile, JWT token,
 * dan status hidrasi localStorage).
 */

interface AuthState {
  user: User | null;
  token: string | null;
  isHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isHydrated: false,

  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nodewave_token', token);
      localStorage.setItem('nodewave_user', JSON.stringify(user));
    }
    set({ user, token, isHydrated: true });
  },

  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nodewave_token');
      localStorage.removeItem('nodewave_user');
    }
    set({ user: null, token: null, isHydrated: true });
  },

  hydrate: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('nodewave_token');
      const rawUser = localStorage.getItem('nodewave_user');
      if (token && rawUser) {
        try {
          const user = JSON.parse(rawUser) as User;
          set({ user, token, isHydrated: true });
          return;
        } catch {
          localStorage.removeItem('nodewave_token');
          localStorage.removeItem('nodewave_user');
        }
      }
    }
    set({ user: null, token: null, isHydrated: true });
  },
}));
