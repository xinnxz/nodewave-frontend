'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChevronDown, TrendingUp } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

export interface SprintDeliverable {
  sprint: string;
  uiux: number;
  frontend: number;
  backend: number;
}

const DEFAULT_CHART_DATA: SprintDeliverable[] = [
  { sprint: 'Sprint 37', uiux: 6, frontend: 4, backend: 7 },
  { sprint: 'Sprint 38', uiux: 8, frontend: 7, backend: 9 },
  { sprint: 'Sprint 39', uiux: 5, frontend: 6, backend: 6 },
  { sprint: 'Sprint 40', uiux: 9, frontend: 8, backend: 11 },
  { sprint: 'Sprint 41', uiux: 7, frontend: 9, backend: 8 },
  { sprint: 'Sprint 42', uiux: 4, frontend: 5, backend: 6 },
];

const DEPT_CONFIG = {
  uiux: {
    id: 'uiux',
    label: 'UI/UX Design',
    color: '#818cf8', // Indigo
    activeColor: '#a5b4fc',
    darkColor: '#6366f1',
    dotBg: 'bg-indigo-500',
  },
  frontend: {
    id: 'frontend',
    label: 'Frontend Client',
    color: '#34d399', // Emerald
    activeColor: '#6ee7b7',
    darkColor: '#059669',
    dotBg: 'bg-emerald-500',
  },
  backend: {
    id: 'backend',
    label: 'Backend Engine',
    color: '#fbbf24', // Amber
    activeColor: '#fde68a',
    darkColor: '#d97706',
    dotBg: 'bg-amber-500',
  },
} as const;

type DeptKey = keyof typeof DEPT_CONFIG;

interface CustomBarProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  dataKey: DeptKey;
  hoveredIndex: number | null;
  hoveredDept: DeptKey | null;
}

const AnimatedGradientBar = ({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  index = 0,
  dataKey,
  hoveredIndex,
  hoveredDept,
}: CustomBarProps) => {
  // Guard against invalid SVG coordinates
  if (width <= 0 || height <= 0 || !Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  const isSprintHovered = hoveredIndex === index;
  const isDeptHovered = hoveredDept === dataKey;

  // Determine if this bar is dimmed by non-hovered state
  let isDimmed = false;
  if (hoveredDept !== null) {
    isDimmed = hoveredDept !== dataKey;
  } else if (hoveredIndex !== null) {
    isDimmed = hoveredIndex !== index;
  }

  const isHighlighted = (isSprintHovered && hoveredDept === null) || isDeptHovered;
  const solidColor = DEPT_CONFIG[dataKey].color;

  return (
    <g
      style={{
        transform: isHighlighted ? 'translateY(-3px)' : 'translateY(0)',
        opacity: isDimmed ? 0.32 : 1,
        transition:
          'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Background Gradient Bar with smooth rounded corners */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={3.5}
        ry={3.5}
        stroke="none"
        fill={isHighlighted ? `url(#bar-grad-${dataKey}-active)` : `url(#bar-grad-${dataKey})`}
      />

      {/* Top Accent Cap: Crisp solid colored line with rounded edges */}
      <rect
        x={x}
        y={y}
        width={width}
        height={2.5}
        rx={1.25}
        ry={1.25}
        stroke="none"
        fill={solidColor}
        filter={isHighlighted ? 'url(#bar-top-glow)' : 'none'}
      />
    </g>
  );
};

// Premium Custom Tooltip Component with glassmorphism and stats breakdown
interface TooltipPayloadItem {
  dataKey: DeptKey;
  value: number;
  color: string;
  payload: SprintDeliverable;
}

const CustomChartTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const total = payload.reduce((acc, item) => acc + (item.value || 0), 0);

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-3 shadow-xl ring-1 ring-slate-900/5 min-w-[210px] transition-all duration-200">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
        <span className="font-bold text-xs text-slate-900">{label}</span>
        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-md px-1.5 py-0.5">
          {total} Deliverables
        </span>
      </div>

      <div className="space-y-1.5">
        {payload.map((item) => {
          const config = DEPT_CONFIG[item.dataKey];
          if (!config) return null;
          const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;

          return (
            <div key={item.dataKey} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-full shadow-2xs', config.dotBg)} />
                <span className="text-slate-600 font-medium">{config.label}</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-slate-900">{item.value}</span>
                <span className="text-[10px] text-slate-400 font-sans font-medium">
                  ({percentage}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export interface DeliverablesBarChartProps {
  data?: SprintDeliverable[];
  className?: string;
}

export function DeliverablesBarChart({
  data = DEFAULT_CHART_DATA,
  className,
}: DeliverablesBarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredDept, setHoveredDept] = useState<DeptKey | null>(null);

  // SVG Defs defined once at top-level to prevent duplicate gradient IDs in DOM
  const svgDefs = useMemo(
    () => (
      <defs>
        {/* Soft Ambient Glow Filter for active bar top cap */}
        <filter id="bar-top-glow" x="-20%" y="-80%" width="140%" height="260%">
          <feDropShadow dx="0" dy="-1" stdDeviation="2.5" floodColor="#6366f1" floodOpacity="0.5" />
        </filter>

        {/* UI/UX Design Gradients */}
        <linearGradient id="bar-grad-uiux" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" stopOpacity={0.8} />
          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.12} />
        </linearGradient>
        <linearGradient id="bar-grad-uiux-active" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a5b4fc" stopOpacity={1} />
          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.25} />
        </linearGradient>

        {/* Frontend Client Gradients */}
        <linearGradient id="bar-grad-frontend" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity={0.8} />
          <stop offset="100%" stopColor="#059669" stopOpacity={0.12} />
        </linearGradient>
        <linearGradient id="bar-grad-frontend-active" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6ee7b7" stopOpacity={1} />
          <stop offset="100%" stopColor="#059669" stopOpacity={0.25} />
        </linearGradient>

        {/* Backend Engine Gradients */}
        <linearGradient id="bar-grad-backend" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.8} />
          <stop offset="100%" stopColor="#d97706" stopOpacity={0.12} />
        </linearGradient>
        <linearGradient id="bar-grad-backend-active" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" stopOpacity={1} />
          <stop offset="100%" stopColor="#d97706" stopOpacity={0.25} />
        </linearGradient>
      </defs>
    ),
    [],
  );

  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm flex flex-col justify-between transition-all duration-300',
        className,
      )}
    >
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

        {/* Cycle Filter Dropdown Pill */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 font-medium hover:bg-slate-100 transition-colors cursor-pointer">
          <span>Monthly Cycles</span>
          <ChevronDown className="h-3 w-3 text-slate-500" />
        </div>
      </div>

      {/* Interactive Animated Recharts Bar Chart */}
      <div className="mt-4 pt-2 w-full h-[210px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 12, right: 10, left: -10, bottom: 0 }}
            onMouseMove={(state) => {
              if (state?.isTooltipActive && typeof state.activeTooltipIndex === 'number') {
                setHoveredIndex(state.activeTooltipIndex);
              } else {
                setHoveredIndex(null);
              }
            }}
            onMouseLeave={() => {
              setHoveredIndex(null);
            }}
          >
            {svgDefs}

            <XAxis
              dataKey="sprint"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value}
              stroke="#94a3b8"
              fontSize={11}
            />

            <Tooltip
              cursor={{
                fill: 'rgba(99, 102, 241, 0.04)',
                radius: 8,
              }}
              content={<CustomChartTooltip />}
            />

            <Bar
              dataKey="uiux"
              shape={(barProps: any) => (
                <AnimatedGradientBar
                  {...barProps}
                  dataKey="uiux"
                  hoveredIndex={hoveredIndex}
                  hoveredDept={hoveredDept}
                />
              )}
            />

            <Bar
              dataKey="frontend"
              shape={(barProps: any) => (
                <AnimatedGradientBar
                  {...barProps}
                  dataKey="frontend"
                  hoveredIndex={hoveredIndex}
                  hoveredDept={hoveredDept}
                />
              )}
            />

            <Bar
              dataKey="backend"
              shape={(barProps: any) => (
                <AnimatedGradientBar
                  {...barProps}
                  dataKey="backend"
                  hoveredIndex={hoveredIndex}
                  hoveredDept={hoveredDept}
                />
              )}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Interactive Legend with Department Highlighting */}
      <div className="mt-3 flex items-center justify-center gap-6 text-[11px] text-slate-600 border-t border-slate-100 pt-3 font-medium select-none">
        {(Object.keys(DEPT_CONFIG) as DeptKey[]).map((dept) => {
          const config = DEPT_CONFIG[dept];
          const isActive = hoveredDept === dept;

          return (
            <button
              type="button"
              key={dept}
              onMouseEnter={() => setHoveredDept(dept)}
              onMouseLeave={() => setHoveredDept(null)}
              className={cn(
                'flex items-center gap-2 px-2 py-0.5 rounded-md transition-all duration-200 cursor-pointer',
                isActive
                  ? 'bg-slate-100 text-slate-900 font-bold scale-105'
                  : hoveredDept !== null
                    ? 'opacity-40'
                    : 'hover:text-slate-900',
              )}
            >
              <span
                className={cn(
                  'h-2.5 w-2.5 rounded-full shadow-2xs transition-transform',
                  config.dotBg,
                )}
                style={{
                  transform: isActive ? 'scale(1.2)' : 'scale(1)',
                }}
              />
              <span>{config.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
