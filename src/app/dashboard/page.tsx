'use client';

import { CreateProjectModal } from '@/components/create-project-modal';
import { Sidebar } from '@/components/sidebar';
import { StandupSummaryModal } from '@/components/standup-summary-modal';
import {
  AnimatedCard,
  CardBody,
  CardDescription,
  CardTitle,
  CardVisual,
  Visual3,
} from '@/components/ui/animated-card-chart';
import { HighlightCard } from '@/components/ui/card-5';
import { DonutChart } from '@/components/ui/donut-chart';
import { StackedList } from '@/components/ui/stacked-list';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import type { ApiListResponse, Project, User } from '@/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, CheckCircle2, Layers, Plus, RefreshCw, Search, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, token, isHydrated, setAuth, clearAuth } = useAuthStore();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isStandupOpen, setIsStandupOpen] = useState(false);
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
      <Sidebar
        current="dashboard"
        projectId={projects[0]?.id}
        onOpenStandupAI={() => setIsStandupOpen(true)}
      />

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
            {/* Left 3 Highlight Cards (21st.dev card-5) (lg:col-span-4) */}
            <div className="lg:col-span-4 flex flex-col justify-between gap-3">
              {/* Card 1: Total Deliverables */}
              <HighlightCard
                title="Total Deliverables"
                description="Across UI/UX, FE & BE teams"
                metricValue={String(metrics.totalTasks)}
                metricLabel="Deliverables in Cycle"
                color="blue"
                icon={<Layers className="h-4 w-4" />}
                buttonText="Lihat"
                onButtonClick={() => {
                  const el = document.getElementById('projects-table');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              />

              {/* Card 2: Active Workflows */}
              <HighlightCard
                title="Active Workflows"
                description="In-Progress & Under Review"
                metricValue={String(metrics.inProgressTasks)}
                metricLabel="Active Tasks"
                color="orange"
                icon={<Sparkles className="h-4 w-4" />}
                buttonText="Lihat"
                onButtonClick={() => {
                  const el = document.getElementById('projects-table');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              />

              {/* Card 3: DAG Overall Status */}
              <HighlightCard
                title="DAG Overall Status"
                description={`${metrics.doneTasks} of ${metrics.totalTasks} tasks completed`}
                metricValue={`${metrics.completionRate}%`}
                metricLabel="Readiness Score"
                color="default"
                icon={<CheckCircle2 className="h-4 w-4" />}
                buttonText="Detail"
                onButtonClick={() => {
                  const el = document.getElementById('projects-table');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            </div>

            {/* Right: 21st.dev AnimatedCard with Visual3 bar chart (lg:col-span-8) */}
            <div className="lg:col-span-8">
              <AnimatedCard className="h-full">
                <CardVisual className="h-[280px]">
                  <Visual3
                    mainColor="#6366f1"
                    secondaryColor="#38bdf8"
                    badge1="+14.8% velocity"
                    badge2="Sprint 42 · Live"
                    hoverTitle="Deliverables by Department"
                    hoverDescription="UI/UX · Frontend · Backend — velocity across recent sprints"
                  />
                </CardVisual>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Deliverables by Department</CardTitle>
                      <CardDescription className="mt-0.5">
                        Multi-disciplinary task allocation and velocity across recent sprints
                      </CardDescription>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
                      +14.8% velocity
                    </span>
                  </div>
                </CardBody>
              </AnimatedCard>
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

      {/* Daily Standup AI Modal (dari sidebar AI Assisten) */}
      {projects[0]?.id && (
        <StandupSummaryModal
          projectId={projects[0].id}
          isOpen={isStandupOpen}
          onClose={() => setIsStandupOpen(false)}
        />
      )}
    </div>
  );
}
