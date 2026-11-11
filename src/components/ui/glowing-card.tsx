'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';

export interface GlowingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  value?: string | number;
  subtext?: string;
  trend?: string;
  trendColor?: string;
  sparkline?: React.ReactNode;
  dotColor?: string;
}

export const GlowingCard = React.forwardRef<HTMLDivElement, GlowingCardProps>(
  (
    {
      title,
      value,
      subtext,
      trend,
      trendColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      sparkline,
      dotColor = '#38bdf8',
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-slate-300',
          className,
        )}
        {...props}
      >
        {/* Animated Moving Dot along the Card perimeter */}
        <div
          className="glowing-dot"
          style={{
            backgroundColor: dotColor,
            boxShadow: `0 0 8px 1px ${dotColor}`,
          }}
        />

        {/* Ambient Ray Glow */}
        <div className="absolute -top-12 -right-12 h-28 w-28 rounded-full bg-indigo-500/5 blur-2xl pointer-events-none" />

        {/* Header: Title and Trend */}
        <div className="flex items-center justify-between relative z-1">
          {title && <span className="text-[11px] font-semibold text-slate-500">{title}</span>}
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                trendColor,
              )}
            >
              {trend}
            </span>
          )}
        </div>

        {/* Value and Sparkline */}
        <div className="mt-2 flex items-baseline justify-between relative z-1">
          <div>
            {value !== undefined && (
              <h2 className="text-2xl font-black tracking-tight text-slate-900">{value}</h2>
            )}
            {subtext && <p className="text-[10.5px] text-slate-500 mt-0.5">{subtext}</p>}
          </div>
          {sparkline && <div className="shrink-0">{sparkline}</div>}
        </div>

        {children}
      </div>
    );
  },
);

GlowingCard.displayName = 'GlowingCard';

// Default export component matching 21st.dev template export
export const Component = GlowingCard;
export default GlowingCard;
