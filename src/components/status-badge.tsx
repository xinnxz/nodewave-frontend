import { cn } from '@/lib/utils';
import type { Department, Role, TaskStatus } from '@/types';

const STATUS_STYLES: Record<TaskStatus, { label: string; className: string; dotClass: string }> = {
  TODO: {
    label: 'To Do',
    className: 'bg-slate-100 text-slate-800 border-slate-300',
    dotClass: 'bg-slate-500',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className: 'bg-sky-50 text-sky-900 border-sky-300',
    dotClass: 'bg-sky-600',
  },
  BLOCKED: {
    label: 'Blocked',
    className: 'bg-rose-50 text-rose-900 border-rose-300',
    dotClass: 'bg-rose-600',
  },
  DONE: {
    label: 'Done',
    className: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    dotClass: 'bg-emerald-600',
  },
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const cfg = STATUS_STYLES[status] || STATUS_STYLES.TODO;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-semibold',
        cfg.className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dotClass)} />
      {cfg.label}
    </span>
  );
}

const DEPT_STYLES: Record<Department, { label: string; className: string }> = {
  PRODUCT: {
    label: 'Product Mgmt',
    className: 'bg-indigo-50 text-indigo-900 border-indigo-200',
  },
  UIUX: {
    label: 'UI/UX Design',
    className: 'bg-amber-50 text-amber-900 border-amber-200',
  },
  FRONTEND: {
    label: 'Frontend Eng',
    className: 'bg-blue-50 text-blue-900 border-blue-200',
  },
  BACKEND: {
    label: 'Backend Eng',
    className: 'bg-teal-50 text-teal-900 border-teal-200',
  },
  CLIENT: {
    label: 'Client Guest',
    className: 'bg-slate-100 text-slate-800 border-slate-300',
  },
};

export function DepartmentBadge({ department }: { department: Department }) {
  const cfg = DEPT_STYLES[department] || DEPT_STYLES.PRODUCT;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium',
        cfg.className,
      )}
    >
      {cfg.label}
    </span>
  );
}

const ROLE_LABELS: Record<Role, string> = {
  PM: 'Product Manager',
  INTERNAL_MEMBER: 'Internal Engineer',
  CLIENT_GUEST: 'Client Guest (Isolated)',
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className="inline-flex items-center rounded bg-[#0052CC]/10 px-2.5 py-0.5 text-xs font-semibold text-[#0052CC]">
      {ROLE_LABELS[role] || role}
    </span>
  );
}
