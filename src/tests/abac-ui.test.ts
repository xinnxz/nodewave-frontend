import { describe, expect, it } from 'bun:test';
import { evaluateStatusTransition } from '../lib/utils';
import { StatusBadge, DepartmentBadge, RoleBadge } from '../components/status-badge';
import type { Task, User } from '../types';

/**
 * Frontend UI & ABAC Authorization Unit Tests
 *
 * Memenuhi requirement SR-005-AC4:
 * Menguji evaluator otorisasi Dual-Layer di sisi UI (`evaluateStatusTransition`)
 * serta komponen UI (`StatusBadge`, `DepartmentBadge`, `RoleBadge`).
 */

const mockPM: User = {
  id: 'user-pm-1',
  email: 'pm@nodewave.id',
  name: 'Andi Pratama',
  role: 'PM',
  department: 'PRODUCT',
};

const mockFE: User = {
  id: 'user-fe-1',
  email: 'frontend@nodewave.id',
  name: 'Budi Santoso',
  role: 'INTERNAL_MEMBER',
  department: 'FRONTEND',
};

const mockClient: User = {
  id: 'user-client-1',
  email: 'client@guest.com',
  name: 'PT Maju Jaya',
  role: 'CLIENT_GUEST',
  department: 'CLIENT',
};

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  projectId: 'proj-1',
  title: 'Frontend Slicing Cart',
  description: 'Slicing shopping cart UI',
  status: 'TODO',
  department: 'FRONTEND',
  assigneeId: mockFE.id,
  assignee: {
    id: mockFE.id,
    name: mockFE.name,
    department: 'FRONTEND',
  },
  isClientVisible: true,
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  dependencies: [],
  ...overrides,
});

describe('Frontend Dual-Layer ABAC & UI Component Suite', () => {
  it('1. should lock DONE transition button for Product Manager (PM restriction)', () => {
    const task = createMockTask({ status: 'IN_PROGRESS' });
    const result = evaluateStatusTransition(mockPM, task, 'DONE');

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Product Manager tidak diizinkan menyelesaikan tugas ke DONE');
  });

  it('2. should lock IN_PROGRESS button for Frontend Engineer when UI/UX prerequisite is not DONE', () => {
    const blockedTask = createMockTask({
      status: 'BLOCKED',
      dependencies: [
        {
          id: 'dep-1',
          prerequisite: {
            id: 'prereq-ui-1',
            title: 'Design Shopping Cart UI',
            status: 'IN_PROGRESS',
            department: 'UIUX',
          },
        },
      ],
    });

    const result = evaluateStatusTransition(mockFE, blockedTask, 'IN_PROGRESS');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Design Shopping Cart UI');
  });

  it('3. should allow Frontend Engineer to start task when all prerequisites are DONE', () => {
    const readyTask = createMockTask({
      status: 'TODO',
      dependencies: [
        {
          id: 'dep-1',
          prerequisite: {
            id: 'prereq-ui-1',
            title: 'Design Homepage UI',
            status: 'DONE',
            department: 'UIUX',
          },
        },
      ],
    });

    const result = evaluateStatusTransition(mockFE, readyTask, 'IN_PROGRESS');
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeNull();
  });

  it('4. should forbid Client Guest from any status transition', () => {
    const task = createMockTask();
    const result = evaluateStatusTransition(mockClient, task, 'IN_PROGRESS');

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Read-Only');
  });

  it('5. should render StatusBadge, DepartmentBadge, and RoleBadge components properly', () => {
    const statusEl = StatusBadge({ status: 'BLOCKED' });
    const deptEl = DepartmentBadge({ department: 'FRONTEND' });
    const roleEl = RoleBadge({ role: 'PM' });

    expect(statusEl).toBeDefined();
    expect(deptEl).toBeDefined();
    expect(roleEl).toBeDefined();
  });
});
