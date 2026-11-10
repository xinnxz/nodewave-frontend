/**
 * Core Domain Types — Nodewave Deliverables Management System
 *
 * File ini mendefinisikan kontrak tipe data (TypeScript strict)
 * yang selaras 1:1 dengan Prisma schema dan API response dari backend Hono.
 */

export type Role = 'PM' | 'INTERNAL_MEMBER' | 'CLIENT_GUEST';

export type Department = 'PRODUCT' | 'UIUX' | 'FRONTEND' | 'BACKEND' | 'CLIENT';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  department: Department;
  avatarUrl?: string | null;
  createdAt?: string;
}

export interface ProjectMetrics {
  totalTasks: number;
  doneTasks: number;
  progress: string;
  statusBreakdown?: {
    TODO: number;
    IN_PROGRESS: number;
    BLOCKED: number;
    DONE: number;
  };
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  clientName: string;
  clientId?: string | null;
  client?: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks: number;
  };
  metrics: ProjectMetrics;
}

export interface TaskPrerequisite {
  id: string;
  title: string;
  status: TaskStatus;
  department?: Department;
  assignee?: {
    id: string;
    name: string;
  } | null;
}

export interface TaskDependency {
  id: string;
  taskId?: string;
  prerequisiteId?: string;
  prerequisite: TaskPrerequisite;
}

export interface DependentTaskLink {
  id: string;
  task: {
    id: string;
    title: string;
    status: TaskStatus;
    department: Department;
  };
}

export interface Attachment {
  id: string;
  taskId: string;
  userId: string;
  filename: string;
  fileUrl: string;
  fileSize?: number | null;
  mimeType?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    department: Department;
  };
}

export interface AuditLog {
  id: string;
  taskId: string;
  userId: string;
  changedColumn: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  department: Department;
  assigneeId?: string | null;
  assignee: {
    id: string;
    name: string;
    email?: string;
    department: Department;
    avatarUrl?: string | null;
  } | null;
  isClientVisible: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  } | null;
  dependencies?: TaskDependency[];
  prerequisiteFor?: DependentTaskLink[];
  attachments?: Attachment[];
  auditLogs?: AuditLog[];
  _count?: {
    attachments: number;
    auditLogs?: number;
  };
}

export interface DailyStandupSummary {
  projectId: string;
  projectName: string;
  generatedAt: string;
  period: {
    from: string;
    to: string;
  };
  completedYesterday: {
    total: number;
    byDepartment: Record<
      string,
      Array<{
        taskTitle: string;
        completedBy: string;
      }>
    >;
  };
  blockedToday: {
    total: number;
    byDepartment: Record<
      string,
      Array<{
        taskTitle: string;
        assignee: string | null;
        blockedBy: string[];
      }>
    >;
  };
}

export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    rows: number;
    totalPages: number;
  };
}

export interface ApiSingleResponse<T> {
  success: boolean;
  data: T;
}
