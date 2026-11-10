import type { Task, TaskStatus, User } from '@/types';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Dual-Layer Authorization Evaluator (Frontend UI Layer)
 *
 * Mengevaluasi apakah user yang sedang login boleh mengubah status task
 * ke `targetStatus`, serta memberikan alasan (reason) jika tombol harus dikunci (disabled).
 *
 * Aturan yang ditegakkan (identik dengan validasi backend di task.service.ts):
 * 1. CLIENT_GUEST tidak boleh mengubah status apapun.
 * 2. PM memiliki akses baca/tulis penuh, TAPI TIDAK BOLEH mengubah status ke DONE.
 * 3. INTERNAL_MEMBER hanya boleh mengubah status task yang di-assign ke dirinya.
 * 4. Transisi ke IN_PROGRESS atau DONE dikunci jika ada prerequisite task yang belum DONE.
 */
export function evaluateStatusTransition(
  user: User | null,
  task: Task,
  targetStatus: TaskStatus,
): { allowed: boolean; reason: string | null } {
  if (!user) {
    return { allowed: false, reason: 'Anda harus login terlebih dahulu.' };
  }

  if (user.role === 'CLIENT_GUEST') {
    return {
      allowed: false,
      reason: 'Client Guest memiliki akses Read-Only dan tidak dapat mengubah status tugas.',
    };
  }

  if (task.status === targetStatus) {
    return { allowed: false, reason: `Status tugas saat ini sudah ${targetStatus}.` };
  }

  // ABAC Rule 1: PM tidak boleh memindahkan status ke DONE
  if (user.role === 'PM' && targetStatus === 'DONE') {
    return {
      allowed: false,
      reason:
        'ABAC Restriction: Product Manager tidak diizinkan menyelesaikan tugas ke DONE (hanya eksekutor yang ditugaskan yang dapat menyelesaikannya).',
    };
  }

  // ABAC Rule 2: Internal Member hanya boleh mengubah status tugas miliknya sendiri
  if (
    user.role === 'INTERNAL_MEMBER' &&
    task.assignee?.id !== user.id &&
    task.assigneeId !== user.id
  ) {
    return {
      allowed: false,
      reason:
        'ABAC Restriction: Anda hanya dapat mengubah status tugas yang ditugaskan kepada Anda.',
    };
  }

  // DAG Dependency Rule: Tidak bisa pindah ke IN_PROGRESS atau DONE jika ada prerequisite belum DONE
  if (targetStatus === 'IN_PROGRESS' || targetStatus === 'DONE') {
    const unfulfilled = (task.dependencies || []).filter(
      (dep) => dep.prerequisite.status !== 'DONE',
    );

    if (unfulfilled.length > 0) {
      const blockerNames = unfulfilled
        .map((d) => `"${d.prerequisite.title}" (${d.prerequisite.status})`)
        .join(', ');
      return {
        allowed: false,
        reason: `Terkunci oleh Prerequisite: Tugas ini belum dapat dimulai/diselesaikan karena menunggu: ${blockerNames}.`,
      };
    }
  }

  return { allowed: true, reason: null };
}
