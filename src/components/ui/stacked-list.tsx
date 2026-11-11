'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Project } from '@/types';
import {
  ArrowUpRight01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Folder01Icon,
  Search01Icon,
  Sorting01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { AnimatePresence, motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';

const sweepSpring = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 35,
  mass: 0.5,
};

interface ProjectItemProps {
  project: Project;
}

const ProjectItem = ({ project }: ProjectItemProps) => {
  const pct = Number.parseInt(project.metrics?.progress || '0', 10) || 0;
  const isDone = pct === 100;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, x: 8, y: 12 },
        visible: { opacity: 1, x: 0, y: 0 },
      }}
      transition={sweepSpring}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 group p-3 rounded-xl border border-zinc-800/60 bg-zinc-900/30 hover:bg-zinc-800/40 hover:border-zinc-700/80 transition-all duration-200"
    >
      {/* Left: Project Branding & Name with 3D Briefcase Asset */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative w-10 h-10 shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
          <Image
            src="/project-3d-icon.png"
            alt={project.name}
            width={40}
            height={40}
            className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.08)]"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/projects/${project.id}`}
              className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors truncate block"
            >
              {project.name}
            </Link>
            <span className="shrink-0 rounded bg-zinc-800/80 border border-zinc-700/50 px-1.5 py-0.5 text-[9px] font-medium text-zinc-300">
              {project.clientName}
            </span>
          </div>
          <p className="text-[10.5px] text-zinc-400 truncate mt-0.5 max-w-[200px] sm:max-w-xs">
            {project.description || 'Deliverables Management Workspace'}
          </p>
        </div>
      </div>

      {/* Center & Right: Team avatars, Progress, DAG Health, Action */}
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-zinc-800/40">
        {/* Team Avatars */}
        <div className="flex -space-x-1.5 overflow-hidden">
          <span
            title="Product Manager"
            className="inline-block h-5 w-5 rounded-full ring-2 ring-[#0d0f14] bg-indigo-600/30 text-indigo-300 text-[8px] font-bold text-center leading-5"
          >
            PM
          </span>
          <span
            title="UI/UX Designer"
            className="inline-block h-5 w-5 rounded-full ring-2 ring-[#0d0f14] bg-purple-600/30 text-purple-300 text-[8px] font-bold text-center leading-5"
          >
            UI
          </span>
          <span
            title="Frontend Engineer"
            className="inline-block h-5 w-5 rounded-full ring-2 ring-[#0d0f14] bg-emerald-600/30 text-emerald-300 text-[8px] font-bold text-center leading-5"
          >
            FE
          </span>
          <span
            title="Backend Engineer"
            className="inline-block h-5 w-5 rounded-full ring-2 ring-[#0d0f14] bg-amber-600/30 text-amber-300 text-[8px] font-bold text-center leading-5"
          >
            BE
          </span>
        </div>

        {/* Deliverables Progress */}
        <div className="w-24 space-y-1">
          <div className="flex items-center justify-between text-[9.5px] font-mono text-zinc-400">
            <span>
              {project.metrics?.doneTasks || 0}/{project.metrics?.totalTasks || 0}
            </span>
            <span className="font-semibold text-white">{pct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div
              style={{ width: `${pct}%` }}
              className={cn(
                'h-full rounded-full transition-all duration-500',
                isDone ? 'bg-emerald-400' : 'bg-gradient-to-r from-indigo-500 to-cyan-400',
              )}
            />
          </div>
        </div>

        {/* DAG Health Badge */}
        <div className="hidden md:flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9.5px] font-medium text-emerald-400">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={11} strokeWidth={2} />
          <span>Clear</span>
        </div>

        {/* Action Button */}
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-700/80 bg-zinc-800/90 hover:bg-white hover:text-black hover:border-white px-2.5 py-1 text-[11px] font-semibold text-zinc-200 transition-all active:scale-95 shadow-sm"
        >
          <span>Open</span>
          <HugeiconsIcon icon={ArrowUpRight01Icon} size={12} strokeWidth={2.2} />
        </Link>
      </div>
    </motion.div>
  );
};

export interface StackedListProps {
  projects?: Project[];
  isLoading?: boolean;
  className?: string;
}

export function StackedList({ projects = [], isLoading = false, className }: StackedListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fallback demo projects if database is empty initially
  const displayProjects: Project[] = useMemo(() => {
    if (projects.length > 0) return projects;
    return [
      {
        id: 'proj-01',
        name: 'E-Commerce Redesign',
        description: 'Multi-vendor marketplace revamp with Next.js & Hono',
        clientName: 'PT Maju Jaya',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metrics: {
          totalTasks: 8,
          doneTasks: 3,
          progress: '38%',
        },
      },
      {
        id: 'proj-02',
        name: 'FinTech Core API',
        description: 'High-concurrency payment gateway & ledger engine',
        clientName: 'Bank Nusantara',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metrics: {
          totalTasks: 12,
          doneTasks: 9,
          progress: '75%',
        },
      },
      {
        id: 'proj-03',
        name: 'Logistics Fleet Tracking',
        description: 'Real-time GPS dispatch & automated delivery routing',
        clientName: 'CepatExpress Ltd',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metrics: {
          totalTasks: 6,
          doneTasks: 6,
          progress: '100%',
        },
      },
    ];
  }, [projects]);

  const filteredProjects = useMemo(
    () =>
      displayProjects.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          Boolean(p.description?.toLowerCase().includes(searchQuery.toLowerCase())),
      ),
    [displayProjects, searchQuery],
  );

  return (
    <div className={cn('relative w-full h-full flex flex-col', className)}>
      <div className="relative w-full h-full rounded-2xl border border-zinc-800/80 bg-[#0d0f14]/90 flex flex-col overflow-hidden shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header Bar */}
          <div className="p-4 pb-3 border-b border-zinc-800/60">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  Active Projects
                  <span className="text-[10px] bg-zinc-800/90 border border-zinc-700/60 px-2 py-0.5 rounded-full text-zinc-300 leading-none font-mono">
                    {displayProjects.length}
                  </span>
                </h2>
                <span className="hidden sm:inline-block text-[10px] text-zinc-500 font-medium">
                  · Governed by DAG & ABAC
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-[11px] text-zinc-400">
                  <HugeiconsIcon icon={Sorting01Icon} size={12} strokeWidth={2} />
                  <span>Sort by: Active</span>
                </div>
              </div>
            </div>

            {/* Quick Search Bar */}
            <div className="relative">
              <HugeiconsIcon
                icon={Search01Icon}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 z-10"
                size={14}
              />
              <Input
                placeholder="Search active projects or clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-3 bg-zinc-900/60 border-zinc-800 rounded-lg text-xs text-white placeholder:text-zinc-500 transition-all w-full"
              />
            </div>
          </div>

          {/* List of Projects (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 pb-20 custom-scrollbar">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                Loading projects matrix...
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                No active projects found matching &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              <motion.div
                initial={false}
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                className="space-y-2.5"
              >
                {filteredProjects.map((project) => (
                  <ProjectItem key={project.id} project={project} />
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Expandable All Projects & Archive Directory Drawer */}
        <motion.div
          layout
          initial={false}
          animate={{
            height: isExpanded ? 'calc(100% - 16px)' : '54px',
            width: isExpanded ? 'calc(100% - 16px)' : 'calc(100% - 24px)',
            bottom: isExpanded ? '8px' : '10px',
            left: isExpanded ? '8px' : '12px',
            borderRadius: isExpanded ? '18px' : '14px',
          }}
          transition={{
            type: 'spring',
            stiffness: 240,
            damping: 30,
            mass: 0.8,
          }}
          className="absolute z-30 overflow-hidden border border-zinc-700/80 shadow-2xl flex flex-col group/bar bg-[#13161f]/98 backdrop-blur-xl"
          style={{ cursor: isExpanded ? 'default' : 'pointer' }}
          onClick={() => !isExpanded && setIsExpanded(true)}
        >
          {/* Drawer Bar Header */}
          <div
            className={`flex items-center justify-between px-3 h-[54px] shrink-0 transition-colors ${
              isExpanded ? 'border-b border-zinc-800' : 'hover:bg-zinc-800/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center p-1 group-hover/bar:scale-105 transition-transform shrink-0">
                <Image
                  src="/project-3d-icon.png"
                  alt="Projects Directory"
                  width={24}
                  height={24}
                  className="w-full h-full object-contain filter drop-shadow"
                />
              </div>
              <motion.div layout="position">
                <h4 className="text-xs font-semibold text-white tracking-tight leading-none">
                  All Projects Directory
                </h4>
                <p className="text-[10px] text-zinc-400 mt-1">
                  {displayProjects.length} Governed Multi-Tenant Workspaces
                </p>
              </motion.div>
            </div>

            <div className="flex items-center gap-2">
              {!isExpanded && (
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                  <span className="hidden sm:inline">Click to expand</span>
                  <div className="w-6 h-6 rounded-md bg-zinc-800/80 flex items-center justify-center text-zinc-300">
                    <HugeiconsIcon icon={Folder01Icon} size={13} strokeWidth={2} />
                  </div>
                </div>
              )}

              {isExpanded && (
                <button
                  type="button"
                  className="h-7 w-7 rounded-lg text-zinc-400 hover:text-white transition-all flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 active:scale-90"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(false);
                  }}
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={15} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>

          {/* Drawer Body Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="px-4 py-2 border-b border-zinc-800/60"
                >
                  <div className="relative">
                    <HugeiconsIcon
                      icon={Search01Icon}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 z-10"
                      size={13}
                    />
                    <Input
                      placeholder="Filter directory..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8 bg-zinc-900/60 border-zinc-800 rounded-lg text-xs text-white placeholder:text-zinc-500 transition-all w-full pl-8"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar space-y-2">
              <motion.div
                initial="hidden"
                animate={isExpanded ? 'visible' : 'hidden'}
                variants={{
                  visible: {
                    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
                  },
                  hidden: {
                    transition: { staggerChildren: 0.02, staggerDirection: -1 },
                  },
                }}
                className="space-y-2"
              >
                {filteredProjects.map((p) => (
                  <ProjectItem key={`dir-${p.id}`} project={p} />
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default StackedList;
