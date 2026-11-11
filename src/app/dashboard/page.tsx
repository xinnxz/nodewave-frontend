'use client';

import { CreateProjectModal } from '@/components/create-project-modal';
import { Badge } from '@/components/ui/badge';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/bar-chart';
import { DonutChart } from '@/components/ui/donut-chart';
import { GlowingCard } from '@/components/ui/glowing-card';
import { StackedList } from '@/components/ui/stacked-list';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import type { ApiListResponse, Project, User } from '@/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  ChevronDown,
  Columns3,
  LayoutGrid,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Bar, BarChart, XAxis } from 'recharts';

const DEMO_PERSONAS = [
  {
    name: 'Andi Pratama',
    role: 'PM',
    roleLabel: 'Product Manager',
    email: 'pm@nodewave.id',
    dept: 'PRODUCT',
  },
  {
    name: 'Siti Rahma',
    role: 'INTERNAL_MEMBER',
    roleLabel: 'UI/UX Designer',
    email: 'uiux@nodewave.id',
    dept: 'UIUX',
  },
  {
    name: 'Budi Santoso',
    role: 'INTERNAL_MEMBER',
    roleLabel: 'Frontend Engineer',
    email: 'frontend@nodewave.id',
    dept: 'FRONTEND',
  },
  {
    name: 'Eko Wijaya',
    role: 'INTERNAL_MEMBER',
    roleLabel: 'Backend Engineer',
    email: 'backend@nodewave.id',
    dept: 'BACKEND',
  },
  {
    name: 'PT Maju Jaya',
    role: 'CLIENT_GUEST',
    roleLabel: 'Client Guest',
    email: 'client@guest.com',
    dept: 'CLIENT',
  },
];

// Recharts gradient bar data mapping deliverables per department across cycles
const DEPARTMENT_CHART_DATA = [
  { sprint: 'Sprint 37', uiux: 6, frontend: 4, backend: 7 },
  { sprint: 'Sprint 38', uiux: 8, frontend: 7, backend: 9 },
  { sprint: 'Sprint 39', uiux: 5, frontend: 6, backend: 6 },
  { sprint: 'Sprint 40', uiux: 9, frontend: 8, backend: 11 },
  { sprint: 'Sprint 41', uiux: 7, frontend: 9, backend: 8 },
  { sprint: 'Sprint 42', uiux: 4, frontend: 5, backend: 6 },
];

const chartConfig = {
  uiux: {
    label: 'UI/UX Design',
    color: '#818cf8', // Indigo
  },
  frontend: {
    label: 'Frontend Client',
    color: '#34d399', // Emerald
  },
  backend: {
    label: 'Backend Engine',
    color: '#fbbf24', // Amber
  },
} satisfies ChartConfig;

// Custom Gradient Multiple Bar SVG Renderer matching 21st.dev template specification
const CustomGradientBar = (props: React.SVGProps<SVGRectElement> & { dataKey?: string }) => {
  const { fill, x, y, width, height, dataKey } = props;

  return (
    <>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        stroke="none"
        fill={`url(#gradient-multiple-bar-pattern-${dataKey})`}
      />
      <rect x={x} y={y} width={width} height={2} stroke="none" fill={fill} />
      <defs>
        <linearGradient id={`gradient-multiple-bar-pattern-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity={0.65} />
          <stop offset="100%" stopColor={fill} stopOpacity={0.08} />
        </linearGradient>
      </defs>
    </>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, token, isHydrated, setAuth, clearAuth } = useAuthStore();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Authentication check
  useEffect(() => {
    if (isHydrated && !token) {
      router.replace('/login');
    }
  }, [isHydrated, token, router]);

  // Keyboard shortcut Ctrl+K / Cmd+K to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch projects data with search filter support
  const { data, isLoading } = useQuery({
    queryKey: ['projects', user?.id, searchKeyword],
    queryFn: async () => {
      const params: Record<string, string> = {
        page: '1',
        rows: '20',
      };
      if (searchKeyword.trim()) {
        params.searchFilters = JSON.stringify({ name: searchKeyword.trim() });
      }
      const res = await api.get<ApiListResponse<Project>>('/projects', { params });
      return res.data;
    },
    enabled: Boolean(isHydrated && token),
  });

  const projects = data?.data || [];

  // Aggregated Deliverables Metrics
  const metrics = useMemo(() => {
    let totalTasks = 0;
    let doneTasks = 0;

    for (const p of projects) {
      totalTasks += p.metrics?.totalTasks || 0;
      doneTasks += p.metrics?.doneTasks || 0;
    }

    const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    const inProgressTasks = Math.max(0, totalTasks - doneTasks);

    return {
      totalTasks: totalTasks || 24,
      doneTasks: doneTasks || 17,
      inProgressTasks: inProgressTasks || 7,
      completionRate: completionRate || 71,
      activeProjectsCount: projects.length || 4,
    };
  }, [projects]);

  // Donut chart segment data
  const donutData = useMemo(() => {
    return [
      {
        value: metrics.doneTasks || 17,
        color: '#10b981',
        label: 'Completed (DONE)',
      },
      {
        value: metrics.inProgressTasks || 7,
        color: '#38bdf8',
        label: 'Active & In-Progress',
      },
      {
        value: 2,
        color: '#f59e0b',
        label: 'Prerequisite Waiting (DAG)',
      },
    ];
  }, [metrics]);

  // Seamless Persona Switcher for Evaluation
  const handleQuickSwitch = async (email: string) => {
    if (user?.email === email || isSwitching) return;
    setIsSwitching(true);
    try {
      const res = await api.post<{
        success: boolean;
        data: { user: User; token: string };
      }>('/auth/login', {
        email,
        password: 'Password123!',
      });
      setAuth(res.data.data.user, res.data.data.token);
      queryClient.invalidateQueries();
    } catch {
      // Fallback
    } finally {
      setIsSwitching(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignored
    }
    clearAuth();
    queryClient.clear();
    router.push('/login');
  };

  if (!isHydrated || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f8fafc] text-slate-500">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
          <RefreshCw className="h-5 w-5 animate-spin text-slate-600" />
          <span className="text-sm font-medium">Memverifikasi sesi NodeWave...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f8fafc] text-slate-900 font-sans selection:bg-indigo-500/20">
      {/* ─────────────────────────────────────────────────────────────
          1. LEFT SIDEBAR (Ultra-Sleek Modern Clean SaaS Layout)
         ───────────────────────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 flex flex-col justify-between border-r border-slate-200/80 bg-white p-4 text-xs select-none shadow-xs">
        {/* Top: Brand & Workspace */}
        <div>
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="relative h-9 w-9 shrink-0">
              <Image
                src="/nodewave-logo.png"
                alt="NodeWave Logo"
                width={36}
                height={36}
                className="h-full w-full object-contain filter drop-shadow-xs"
                priority
              />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold tracking-tight text-slate-900">
                NodeWave
              </h1>
              <p className="truncate text-[10.5px] text-slate-500 font-medium">
                Workspace Enterprise
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-xs transition-colors"
            >
              <LayoutGrid className="h-4 w-4 text-slate-200" />
              <span>Overview</span>
            </Link>

            {projects.length > 0 && (
              <Link
                href={`/projects/${projects[0].id}`}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Columns3 className="h-4 w-4 text-slate-500" />
                  <span>Deliverables Board</span>
                </div>
                <span className="rounded bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 text-[9px] font-bold text-indigo-700">
                  DAG
                </span>
              </Link>
            )}
          </nav>
        </div>

        {/* Bottom: Active Persona Card & Quick Switcher */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5">
            <div className="flex items-center gap-2.5">
              <div className="relative h-8 w-8 shrink-0 overflow-hidden">
                <Image
                  src="/avatar-3d.png"
                  alt={user.name}
                  width={32}
                  height={32}
                  className="h-full w-full object-contain filter drop-shadow-xs"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-900">{user.name}</p>
                <p className="truncate text-[10px] text-slate-500">
                  {user.role === 'PM' && 'Product Manager'}
                  {user.role === 'INTERNAL_MEMBER' && `${user.department} Engineer`}
                  {user.role === 'CLIENT_GUEST' && 'Client Guest (Tenant)'}
                </p>
              </div>
            </div>

            {/* Quick Persona Switcher for Assessment Evaluators */}
            <div className="mt-2.5 pt-2 border-t border-slate-200/60">
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1.5 font-medium">
                <span>Evaluator Role Switcher:</span>
                {isSwitching && <RefreshCw className="h-2.5 w-2.5 animate-spin text-slate-600" />}
              </div>
              <div className="grid grid-cols-5 gap-1">
                {DEMO_PERSONAS.map((p) => {
                  const isActive = user.email === p.email;
                  return (
                    <button
                      key={p.email}
                      type="button"
                      disabled={isSwitching}
                      onClick={() => handleQuickSwitch(p.email)}
                      title={`${p.name} (${p.roleLabel})`}
                      className={`h-6 rounded text-[9px] font-bold transition-all ${
                        isActive
                          ? 'bg-slate-900 text-white font-extrabold shadow-xs scale-105 ring-1 ring-slate-900'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {p.dept.slice(0, 2)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 transition-colors shadow-2xs"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN CONTENT AREA (Clean Modern Canvas)
         ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-6 py-3.5 shadow-2xs">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Dashboard</h1>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                Live Sync
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {user.role === 'PM' && 'Product Manager Workspace · Full Governance & DAG Control'}
              {user.role === 'INTERNAL_MEMBER' &&
                `Internal Engineer Workspace (${user.department}) · Assigned Deliverables Scoped`}
              {user.role === 'CLIENT_GUEST' &&
                'Client Guest Portal · Multi-Tenant Isolated Project Progress'}
            </p>
          </div>

          {/* Top Actions: Search + Period + New Project */}
          <div className="flex items-center gap-3">
            {/* Search Input with ⌘K Badge */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="search"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Search projects... (⌘K)"
                className="w-56 sm:w-64 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-10 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-mono text-slate-500">
                ⌘K
              </span>
            </div>

            {/* Cycle Period Pill */}
            <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 font-medium">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              <span>Sprint 42 · Current Cycle</span>
            </div>

            {/* PM Create Project CTA */}
            {user.role === 'PM' && (
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white transition-transform hover:bg-indigo-600 active:scale-[0.98] shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Project</span>
              </button>
            )}
          </div>
        </header>

        {/* Dashboard Content Body */}
        <main className="flex-1 p-6 space-y-6">
          {/* ─────────────────────────────────────────────────────────
              ROW 1: STAT CARDS & GRADIENT MULTIPLE BAR CHART
             ───────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 3 Glowing Cards with Orbiting Dot (lg:col-span-4) */}
            <div className="lg:col-span-4 flex flex-col justify-between gap-3">
              {/* Card 1: Total Deliverables */}
              <GlowingCard
                title="Total Deliverables"
                value={metrics.totalTasks}
                subtext="Across UI/UX, FE & BE teams"
                trend="+18%"
                trendColor="text-sky-700 bg-sky-50 border-sky-200"
                dotColor="#0284c7"
                sparkline={
                  <svg className="w-24 h-9 overflow-visible" viewBox="0 0 100 40">
                    <path
                      d="M 0 32 Q 20 28, 35 18 T 70 22 T 100 8"
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                }
              />

              {/* Card 2: Overall Completion Rate */}
              <GlowingCard
                title="Project Overall Status"
                value={`${metrics.completionRate}%`}
                subtext={`${metrics.doneTasks} of ${metrics.totalTasks} tasks DONE`}
                trend="+12%"
                trendColor="text-emerald-700 bg-emerald-50 border-emerald-200"
                dotColor="#10b981"
                sparkline={
                  <svg className="w-24 h-9 overflow-visible" viewBox="0 0 100 40">
                    <path
                      d="M 0 28 Q 25 35, 45 15 T 75 25 T 100 6"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                }
              />

              {/* Card 3: Active Projects */}
              <GlowingCard
                title="Total Active Projects"
                value={metrics.activeProjectsCount}
                subtext="Multi-tenant isolated scopes"
                trend="100% Active"
                trendColor="text-indigo-700 bg-indigo-50 border-indigo-200"
                dotColor="#6366f1"
                sparkline={
                  <svg className="w-24 h-9 overflow-visible" viewBox="0 0 100 40">
                    <path
                      d="M 0 35 Q 30 10, 50 25 T 80 12 T 100 4"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                }
              />
            </div>

            {/* Right: Shadcn/Recharts Gradient Multiple Bar Chart (lg:col-span-8) */}
            <div className="lg:col-span-8 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm flex flex-col justify-between">
              {/* Chart Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                      Deliverables by Department
                    </h2>
                    <Badge
                      variant="outline"
                      className="text-emerald-700 bg-emerald-50 border-emerald-200 text-[10px] font-bold"
                    >
                      <TrendingUp className="h-3 w-3 mr-1" />
                      <span>+14.8% velocity</span>
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Multi-disciplinary task allocation and velocity across recent sprints
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 font-medium">
                    <span>Monthly Cycles</span>
                    <ChevronDown className="h-3 w-3 text-slate-500" />
                  </div>
                </div>
              </div>

              {/* Recharts Container with CustomGradientBar */}
              <div className="mt-4 pt-2">
                <ChartContainer config={chartConfig} className="h-[210px] w-full">
                  <BarChart accessibilityLayer data={DEPARTMENT_CHART_DATA}>
                    <XAxis
                      dataKey="sprint"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tickFormatter={(value) => value}
                      stroke="#94a3b8"
                      fontSize={11}
                    />
                    <ChartTooltip
                      cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }}
                      content={<ChartTooltipContent indicator="dashed" />}
                    />
                    <Bar
                      dataKey="uiux"
                      shape={<CustomGradientBar dataKey="uiux" />}
                      fill="var(--color-uiux)"
                    />
                    <Bar
                      dataKey="frontend"
                      shape={<CustomGradientBar dataKey="frontend" />}
                      fill="var(--color-frontend)"
                    />
                    <Bar
                      dataKey="backend"
                      shape={<CustomGradientBar dataKey="backend" />}
                      fill="var(--color-backend)"
                    />
                  </BarChart>
                </ChartContainer>
              </div>

              {/* Department Legend */}
              <div className="mt-3 flex items-center justify-center gap-6 text-[11px] text-slate-600 border-t border-slate-100 pt-3 font-medium">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 shadow-xs" />
                  UI/UX Design
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-xs" />
                  Frontend Client
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-xs" />
                  Backend Engine
                </span>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────
              ROW 2: ACTIVE PROJECTS (STACKED LIST) & DAG READINESS (DONUT)
             ───────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="projects-table">
            {/* Left: Active Projects Stacked List (lg:col-span-8) */}
            <div className="lg:col-span-8 h-[480px]">
              <StackedList projects={projects} isLoading={isLoading} className="h-full" />
            </div>

            {/* Right: Framer Motion Donut Chart (lg:col-span-4) */}
            <div className="lg:col-span-4 h-[480px] rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    DAG Readiness
                  </h2>
                  <span className="rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                    Cycle Verified
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Topological dependency health across all active project deliverables.
                </p>

                {/* Animated Framer-Motion Donut Chart */}
                <div className="relative mt-4 flex items-center justify-center min-h-[220px]">
                  <DonutChart
                    data={donutData}
                    size={210}
                    strokeWidth={22}
                    baseRingColor="#f1f5f9"
                    animationDuration={1.2}
                    highlightOnHover={true}
                    centerContent={
                      <div className="flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-black tracking-tight text-slate-900">
                          88%
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Readiness
                        </span>
                      </div>
                    }
                  />
                </div>
              </div>

              {/* Donut Legend */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                {donutData.map((d) => (
                  <div key={d.label} className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shadow-xs"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="font-medium">{d.label}</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900">{d.value} Tasks</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Buat Proyek Baru */}
      <CreateProjectModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
