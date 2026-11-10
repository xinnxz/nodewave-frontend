import axios, { type AxiosError } from 'axios';

/**
 * Axios API Client
 *
 * Menggunakan environment variable NEXT_PUBLIC_BE_URL sesuai instruksi brief:
 * > "Deploy the frontend pointed at the live backend via NEXT_PUBLIC_BE_URL."
 *
 * Request Interceptor:
 * Otomatis menyisipkan header `Authorization: Bearer <token>` dari localStorage
 * pada setiap request ke backend Hono.
 */

const baseURL = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('nodewave_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

/**
 * Helper untuk mengekstrak pesan error dan kode HTTP dari AxiosError.
 * Sangat berguna untuk mendeteksi HTTP 409 Conflict (Optimistic Locking)
 * atau HTTP 403 Forbidden (RBAC/ABAC).
 */
export function extractApiError(error: unknown): {
  status: number;
  message: string;
} {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<{
      success: boolean;
      error?: { code: number; message: string };
      message?: string;
    }>;
    const status = axiosErr.response?.status || 500;
    const message =
      axiosErr.response?.data?.error?.message ||
      axiosErr.response?.data?.message ||
      axiosErr.message ||
      'Terjadi kesalahan pada server.';
    return { status, message };
  }
  if (error instanceof Error) {
    return { status: 500, message: error.message };
  }
  return { status: 500, message: 'Terjadi kesalahan tidak dikenal.' };
}
