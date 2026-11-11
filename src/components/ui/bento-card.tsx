'use client';

import { cn } from '@/lib/utils';
import {
  Add01Icon,
  BarChartIcon,
  CircleArrowUpRight02Icon,
  DashboardSquare01Icon,
  DatabaseIcon,
  Folder02Icon,
  InformationCircleIcon,
  Mail01Icon,
  Message01Icon,
  Search01Icon,
  Settings02Icon,
  Tick01Icon,
  UserGroupIcon,
  UserIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import type React from 'react';
import { useMemo, useState } from 'react';

interface TabConfig {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof HugeiconsIcon>['icon'];
  badge?: string;
  header: string;
  description: string;
}

const TABS: TabConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: DashboardSquare01Icon,
    header: 'Project Overview',
    description: 'Daily summary of your team performance.',
  },
  {
    id: 'management',
    label: 'Management',
    icon: UserGroupIcon,
    header: 'Team Management',
    description: 'Manage roles and user permissions.',
    badge: '10',
  },
  {
    id: 'threads',
    label: 'Threads',
    icon: Message01Icon,
    header: 'Communications',
    description: 'High-priority team discussions.',
    badge: '12',
  },
  {
    id: 'resources',
    label: 'Resources',
    icon: Folder02Icon,
    header: 'System Assets',
    description: 'Shared documentation and media logs.',
  },
];

export const BentoCard = () => {
  const [activeTab, setActiveTab] = useState(TABS[0]);

  const content = useMemo(() => {
    switch (activeTab.id) {
      case 'dashboard':
        return <OverviewDashboard />;
      case 'management':
        return <ManagementDashboard />;
      case 'threads':
        return <ThreadsDashboard />;
      case 'resources':
        return <ResourcesDashboard />;
      default:
        return null;
    }
  }, [activeTab.id]);

  return (
    <div className="flex items-center justify-center w-full antialiased">
      <div className="group relative w-full max-w-xl overflow-hidden rounded-3xl sm:rounded-4xl border border-slate-200/80 bg-white shadow-2xl shadow-blue-500/5 transition-all duration-500 hover:shadow-blue-500/10 hover:-translate-y-1 m-0">
        <div className="p-4 sm:p-6 space-y-1.5 z-10 relative">
          <h2 className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
            Project Dashboard
          </h2>
          <p className="text-lg sm:text-2xl text-slate-900 font-medium leading-snug max-w-[480px]">
            High-performance analytics and team collaboration tools in one place.
          </p>
        </div>

        <div className="relative w-full h-[260px] sm:h-[300px] overflow-hidden rounded-2xl sm:rounded-[2rem]">
          <div className="absolute top-16 left-16 w-full h-full bg-slate-100 rounded-3xl border border-slate-200/50 opacity-80" />

          <div className="absolute top-8 left-24 w-full h-full bg-white rounded-tl-3xl shadow-xl flex flex-col overflow-hidden ring-6 ring-slate-200/60">
            <div className="px-5 py-4 rounded-tl-3xl border-b border-slate-200/70 flex items-center relative backdrop-blur-sm">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-slate-300" />
                <div className="w-2 h-2 rounded-full bg-slate-300" />
                <div className="w-2 h-2 rounded-full bg-slate-300" />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
                <span className="text-xs text-slate-400 uppercase font-semibold">Workspace</span>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="w-36 border-r border-slate-200/40 p-2 flex flex-col gap-1 pt-6 bg-slate-50/50">
                <LayoutGroup>
                  {TABS.map((tab) => {
                    const isActive = activeTab.id === tab.id;
                    const Icon = tab.icon;

                    return (
                      <button
                        type="button"
                        key={tab.id}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                          'relative flex items-center gap-1.5 p-2 rounded-xl text-xs transition-colors cursor-pointer text-left',
                          isActive
                            ? 'text-slate-900 font-semibold'
                            : 'text-slate-500 hover:text-slate-900',
                        )}
                      >
                        <HugeiconsIcon icon={Icon} size={14} className="z-20 shrink-0 relative" />
                        <span className="truncate z-20 relative font-medium">{tab.label}</span>
                        {tab.badge && (
                          <span
                            className={cn(
                              'ml-auto text-[8px] leading-none py-0.5 px-1 rounded-md tabular-nums transition-all z-20 relative font-bold',
                              isActive
                                ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                : 'bg-slate-100 text-slate-500 border border-transparent',
                            )}
                          >
                            {tab.badge}
                          </span>
                        )}

                        {isActive && (
                          <motion.div
                            layoutId="sidebar-pill"
                            className="absolute left-0 w-[2px] h-4 rounded-full bg-blue-600 z-30"
                            transition={{
                              type: 'spring',
                              bounce: 0.2,
                              duration: 0.6,
                            }}
                          />
                        )}
                        {isActive && (
                          <motion.div
                            layoutId="backgroundIndicator"
                            className="absolute inset-0 rounded-lg bg-slate-100 border border-slate-200/60"
                            transition={{
                              type: 'spring',
                              bounce: 0.2,
                              duration: 0.6,
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </LayoutGroup>
              </div>

              <div className="flex-1 bg-white p-5 pt-6 flex flex-col gap-4 overflow-hidden relative">
                <header className="flex flex-col gap-0.5">
                  <h3 className="text-xs font-semibold text-slate-900 tracking-tight line-clamp-1 uppercase opacity-60">
                    {activeTab.header}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-normal leading-tight line-clamp-1">
                    {activeTab.description}
                  </p>
                </header>

                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={activeTab.id}
                    initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    className="flex-1"
                  >
                    {content}
                  </motion.div>
                </AnimatePresence>

                <div className="absolute bottom-0 left-0 right-0 h-10 bg-linear-to-t from-white to-transparent pointer-events-none z-20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BentoCard;

const OverviewDashboard = () => (
  <div className="flex flex-col gap-3 h-full">
    <div className="relative p-3.5 rounded-xl border border-slate-200/60 bg-linear-to-br from-white to-slate-50 overflow-hidden">
      <div className="flex flex-col gap-2 relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-medium text-slate-500">Team Performance</span>
          <HugeiconsIcon icon={CircleArrowUpRight02Icon} size={12} className="text-blue-600" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xl font-medium tracking-tight text-slate-900">94.2%</span>
          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '94.2%' }}
              className="h-full bg-blue-600 rounded-full"
            />
          </div>
        </div>
        <span className="text-[9px] text-slate-400">Score for Search & Delivery campaigns</span>
      </div>
      <div className="absolute -right-2 -bottom-2 opacity-5 scale-150 rotate-12 pointer-events-none">
        <HugeiconsIcon icon={BarChartIcon} size={64} />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-2">
      <div className="p-3 rounded-xl border border-slate-200/60 bg-white flex items-center justify-between shadow-2xs">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-900">1,070</span>
          <span className="text-[8px] text-slate-400 uppercase font-medium">Keywords</span>
        </div>
        <HugeiconsIcon icon={Search01Icon} size={14} className="opacity-30 text-slate-500" />
      </div>
      <div className="p-3 rounded-xl border border-slate-200/60 bg-white flex items-center justify-between shadow-2xs">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-900">2.3M</span>
          <span className="text-[8px] text-slate-400 uppercase font-medium">Credits</span>
        </div>
        <HugeiconsIcon
          icon={InformationCircleIcon}
          size={14}
          className="opacity-30 text-slate-500"
        />
      </div>
    </div>
  </div>
);

const ManagementDashboard = () => (
  <div className="flex flex-col h-full not-prose">
    <div className="rounded-xl border border-slate-200/60 overflow-hidden flex flex-col h-full bg-white shadow-2xs">
      <div className="bg-slate-50/80 px-3 py-2 border-b border-slate-200/50 flex items-center justify-between">
        <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
          Active Users
        </span>
        <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-white border border-slate-200/70">
          <HugeiconsIcon icon={Search01Icon} size={10} className="text-slate-400" />
          <span className="text-[8px] text-slate-500 font-medium">Search</span>
        </div>
      </div>
      <div className="p-1 flex flex-col gap-0.5">
        {[
          {
            name: 'Anthony Dionne',
            role: 'Pending admin approval',
            status: 'Waitlist',
            color: 'bg-amber-400',
          },
          {
            name: 'Nick Yahodin',
            role: 'Dealership group admin',
            status: 'Active',
            color: 'bg-emerald-400',
          },
          {
            name: 'Mujeeb Aimaq',
            role: 'Dealership group user',
            status: 'Active',
            color: 'bg-emerald-400',
          },
        ].map((user) => (
          <div
            key={user.name}
            className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-slate-50 transition-colors group"
          >
            <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center relative shrink-0">
              <HugeiconsIcon icon={UserIcon} size={10} className="text-slate-500" />
              <div
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-white',
                  user.color,
                )}
              />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-800 truncate">{user.name}</span>
              <span className="text-[8px] text-slate-400 truncate">{user.role}</span>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <HugeiconsIcon icon={Settings02Icon} size={12} className="text-slate-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ThreadsDashboard = () => (
  <div className="flex flex-col gap-2.5 h-full">
    <div className="grid grid-cols-2 gap-2">
      {[
        {
          title: 'Create a Page',
          desc: 'Build your project base.',
          icon: Folder02Icon,
        },
        {
          title: 'Create a Task',
          desc: 'Organize with team.',
          icon: Tick01Icon,
        },
      ].map((card) => (
        <div
          key={card.title}
          className="p-2.5 rounded-xl border border-slate-200/60 bg-white flex flex-col gap-2 relative overflow-hidden group shadow-2xs"
        >
          <div className="flex flex-col gap-0.5 z-10">
            <span className="text-[11px] font-bold text-slate-800 leading-tight">{card.title}</span>
            <span className="text-[9px] text-slate-400 leading-tight">{card.desc}</span>
          </div>
          <button
            type="button"
            className="w-fit flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 text-white text-[8px] font-semibold transition-transform active:scale-95 hover:bg-blue-600 z-10"
          >
            <HugeiconsIcon icon={Add01Icon} size={8} strokeWidth={3} />
            Create
          </button>
        </div>
      ))}
    </div>

    <div className="mt-auto p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="p-0.5 px-1.5 rounded-md bg-white border border-slate-200">
          <HugeiconsIcon icon={InformationCircleIcon} size={10} className="text-slate-500" />
        </div>
        <span className="text-[9px] text-slate-500 font-medium">Pin a new item</span>
      </div>
      <HugeiconsIcon icon={Add01Icon} size={12} className="text-slate-400" />
    </div>
  </div>
);

const ResourcesDashboard = () => (
  <div className="flex flex-col gap-2 h-full overflow-hidden">
    <div className="flex-1 rounded-xl border border-slate-200/60 flex flex-col bg-white overflow-hidden shadow-2xs">
      <div className="bg-slate-50/80 px-3 py-1.5 border-b border-slate-200/50 flex items-center justify-between">
        <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
          Archives & Logs
        </span>
        <HugeiconsIcon icon={DatabaseIcon} size={12} className="text-slate-400" />
      </div>
      <div className="flex-1 p-1 overflow-y-auto kanban-scrollbar">
        {[
          {
            file: 'design_spec_v2.pdf',
            size: '2.4 MB',
            type: 'PDF',
            icon: Mail01Icon,
          },
          {
            file: 'q4_performance.xls',
            size: '1.1 MB',
            type: 'XLS',
            icon: BarChartIcon,
          },
          {
            file: 'branding_assets.zip',
            size: '48 MB',
            type: 'ZIP',
            icon: Folder02Icon,
          },
          {
            file: 'system_logs.json',
            size: '4 KB',
            type: 'JSON',
            icon: Folder02Icon,
          },
        ].map((item) => (
          <div
            key={item.file}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
          >
            <div className="w-5 h-5 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
              <HugeiconsIcon icon={item.icon} size={11} />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[10px] font-medium text-slate-800 truncate">{item.file}</span>
              <span className="text-[8px] text-slate-400 tabular-nums uppercase">
                {item.size} • {item.type}
              </span>
            </div>
            <HugeiconsIcon
              icon={CircleArrowUpRight02Icon}
              size={10}
              className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
        ))}
      </div>
    </div>
  </div>
);
