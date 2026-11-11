import { cn } from '@/lib/utils';
import type { Department, Role, TaskStatus } from '@/types';

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

const PRIORITY_SVGS: Record<Priority, { src: string; alt: string }> = {
  HIGH: { src: '/assets/badges/priority-high.svg', alt: 'High Priority' },
  MEDIUM: { src: '/assets/badges/priority-medium.svg', alt: 'Medium Priority' },
  LOW: { src: '/assets/badges/priority-low.svg', alt: 'Low Priority' },
};

export function PriorityBadge({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  const p = PRIORITY_SVGS[priority] || PRIORITY_SVGS.MEDIUM;
  return (
    <img
      src={p.src}
      alt={p.alt}
      className={cn('h-5 w-auto object-contain inline-block', className)}
    />
  );
}

const DEPT_SVGS: Record<Department, { src: string; alt: string }> = {
  PRODUCT: { src: '/assets/badges/department-product.svg', alt: 'Product' },
  UIUX: { src: '/assets/badges/department-uiux.svg', alt: 'UI/UX' },
  FRONTEND: { src: '/assets/badges/department-frontend.svg', alt: 'Frontend' },
  BACKEND: { src: '/assets/badges/department-backend.svg', alt: 'Backend' },
  CLIENT: { src: '/assets/badges/department-client.svg', alt: 'Client' },
};

export function DepartmentBadge({
  department,
  className,
}: {
  department: Department;
  className?: string;
}) {
  const dept = DEPT_SVGS[department] || DEPT_SVGS.PRODUCT;
  return (
    <img
      src={dept.src}
      alt={dept.alt}
      className={cn('h-5 w-auto object-contain inline-block', className)}
    />
  );
}

const STATUS_SVGS: Record<TaskStatus, { src: string; alt: string; label: string }> = {
  TODO: {
    src: '/assets/status-icons/todo.svg',
    alt: 'To Do',
    label: 'To-do',
  },
  IN_PROGRESS: {
    src: '/assets/status-icons/in-progress.svg',
    alt: 'In Progress',
    label: 'On Progress',
  },
  BLOCKED: {
    src: '/assets/status-icons/in-review.svg',
    alt: 'In Review / Blocked',
    label: 'In Review',
  },
  DONE: {
    src: '/assets/status-icons/done.svg',
    alt: 'Done',
    label: 'Done',
  },
};

export function StatusIcon({
  status,
  className,
}: {
  status: TaskStatus;
  className?: string;
}) {
  const st = STATUS_SVGS[status] || STATUS_SVGS.TODO;
  return (
    <img
      src={st.src}
      alt={st.alt}
      className={cn('h-4 w-4 object-contain inline-block', className)}
    />
  );
}

const STATUS_BADGE_SVGS: Record<TaskStatus, { src: string; alt: string }> = {
  TODO: { src: '/assets/badges/status-todo.svg', alt: 'Status: To Do' },
  IN_PROGRESS: { src: '/assets/badges/status-in-progress.svg', alt: 'Status: In Progress' },
  BLOCKED: { src: '/assets/badges/status-in-review.svg', alt: 'Status: In Review' },
  DONE: { src: '/assets/badges/status-done.svg', alt: 'Status: Done' },
};

export function StatusBadge({
  status,
  className,
}: {
  status: TaskStatus;
  className?: string;
}) {
  const badge = STATUS_BADGE_SVGS[status] || STATUS_BADGE_SVGS.TODO;
  return (
    <img
      src={badge.src}
      alt={badge.alt}
      className={cn('h-5 w-auto object-contain inline-block', className)}
    />
  );
}

const ROLE_LABELS: Record<Role, string> = {
  PM: 'Product Manager',
  INTERNAL_MEMBER: 'Internal Engineer',
  CLIENT_GUEST: 'Client Guest (Isolated)',
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className="inline-flex items-center rounded bg-[#2563EB]/10 px-2.5 py-0.5 text-xs font-semibold text-[#2563EB]">
      {ROLE_LABELS[role] || role}
    </span>
  );
}
