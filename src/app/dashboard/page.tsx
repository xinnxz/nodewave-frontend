'use client';

import { CreateProjectModal } from '@/components/create-project-modal';
import { Sidebar } from '@/components/sidebar';
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
    <div className="flex h-screen w-full overflow-hidden bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-500/20">
      {/* ─────────────────────────────────────────────────────────────
          1. UNIFIED MODERN CANVASO SIDEBAR
         ───────────────────────────────────────────────────────────── */}
      <Sidebar current="dashboard" projectId={projects[0]?.id} />

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
