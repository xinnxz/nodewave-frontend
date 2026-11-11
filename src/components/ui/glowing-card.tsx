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
          'relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#0d0f14]/90 p-4 shadow-xl transition-all hover:border-zinc-700/80',
          className,
        )}
        {...props}
      >
        {/* Animated Moving Dot along the Card perimeter */}
        <div
          className="glowing-dot"
          style={{
            backgroundColor: dotColor,
            boxShadow: `0 0 10px 2px ${dotColor}, 0 0 20px 4px ${dotColor}88`,
          }}
        />

        {/* Ambient Ray Glow */}
        <div className="absolute -top-12 -right-12 h-28 w-28 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />

        {/* Header: Title and Trend */}
        <div className="flex items-center justify-between relative z-1">
          {title && <span className="text-[11px] font-medium text-zinc-400">{title}</span>}
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border',
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
              <h2 className="text-2xl font-extrabold tracking-tight text-white">{value}</h2>
            )}
            {subtext && <p className="text-[10px] text-zinc-500 mt-0.5">{subtext}</p>}
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
