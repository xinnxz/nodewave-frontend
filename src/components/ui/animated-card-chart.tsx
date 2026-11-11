'use client';

import { cn } from '@/lib/utils';
import type * as React from 'react';
import { useState } from 'react';

// --- Card Components ---

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function AnimatedCard({ className, ...props }: CardProps) {
  return (
    <div
      role="region"
      aria-labelledby="card-title"
      aria-describedby="card-description"
      className={cn(
        'group/animated-card relative w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all duration-300 hover:shadow-md dark:border-zinc-900 dark:bg-black',
        className,
      )}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }: CardProps) {
  return (
    <div
      role="group"
      className={cn(
        'flex flex-col space-y-1.5 border-t border-slate-100 p-5 dark:border-zinc-900',
        className,
      )}
      {...props}
    />
  );
}

export type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

export function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <h3
      id="card-title"
      className={cn(
        'text-base font-bold leading-tight tracking-tight text-slate-900 dark:text-white',
        className,
      )}
      {...props}
    />
  );
}

export type CardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

export function CardDescription({ className, ...props }: CardDescriptionProps) {
  return (
    <p
      id="card-description"
      className={cn('text-xs text-slate-500 leading-relaxed dark:text-neutral-400', className)}
      {...props}
    />
  );
}

export function CardVisual({ className, ...props }: CardProps) {
  return <div className={cn('relative h-[210px] w-full overflow-hidden', className)} {...props} />;
}

// --- Visual3 Component and its Sub-components ---

export interface Visual3Props {
  mainColor?: string;
  secondaryColor?: string;
  gridColor?: string;
  badge1?: string;
  badge2?: string;
  hoverTitle?: string;
  hoverDescription?: string;
}

export function Visual3({
  mainColor = '#6366f1', // Indigo
  secondaryColor = '#38bdf8', // Sky
  gridColor = '#80808018',
  badge1 = '+15.2% velocity',
  badge2 = 'Sprint 42 Live',
  hoverTitle = 'Deliverables Velocity by Department',
  hoverDescription = 'Interactive multi-disciplinary task allocation',
}: Visual3Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={
        {
          '--color': mainColor,
          '--secondary-color': secondaryColor,
        } as React.CSSProperties
      }
    >
      <div className="relative h-full w-full overflow-hidden rounded-t-xl flex items-center justify-center">
        <Layer4 color={mainColor} secondaryColor={secondaryColor} hovered={hovered} />
        <Layer3 color={mainColor} />
        <Layer2 color={mainColor} title={hoverTitle} description={hoverDescription} />
        <Layer1 color={mainColor} secondaryColor={secondaryColor} badge1={badge1} badge2={badge2} />
        <EllipseGradient color={mainColor} />
        <GridLayer color={gridColor} />
      </div>
    </div>
  );
}

interface LayerProps {
  color: string;
  secondaryColor?: string;
  hovered?: boolean;
}

const GridLayer: React.FC<{ color: string }> = ({ color }) => {
  return (
    <div
      style={{ '--grid-color': color } as React.CSSProperties}
      className="pointer-events-none absolute inset-0 z-[4] h-full w-full bg-transparent bg-[linear-gradient(to_right,var(--grid-color)_1px,transparent_1px),linear-gradient(to_bottom,var(--grid-color)_1px,transparent_1px)] bg-[size:24px_24px] bg-center opacity-75 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_60%,transparent_100%)]"
    />
  );
};

const EllipseGradient: React.FC<{ color: string }> = ({ color }) => {
  return (
    <div className="absolute inset-0 z-[5] flex h-full w-full items-center justify-center pointer-events-none">
      <svg
        className="w-full h-full"
        viewBox="0 0 356 180"
        fill="none"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="356" height="180" fill="url(#paint0_radial_12_207)" />
        <defs>
          <radialGradient
            id="paint0_radial_12_207"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(178 98) rotate(90) scale(98 178)"
          >
            <stop stopColor={color} stopOpacity="0.25" />
            <stop offset="0.34" stopColor={color} stopOpacity="0.12" />
            <stop offset="1" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
};

interface Layer1Props extends LayerProps {
  badge1?: string;
  badge2?: string;
}

const Layer1: React.FC<Layer1Props> = ({
  color,
  secondaryColor,
  badge1 = '+15.2%',
  badge2 = '+18.7%',
}) => {
  return (
    <div
      className="absolute top-4 left-4 z-[8] flex items-center gap-2 pointer-events-none"
      style={
        {
          '--color': color,
          '--secondary-color': secondaryColor,
        } as React.CSSProperties
      }
    >
      <div className="flex shrink-0 items-center rounded-full border border-slate-200/80 bg-white/70 px-2.5 py-0.5 shadow-2xs backdrop-blur-md transition-opacity duration-300 ease-in-out group-hover/animated-card:opacity-0 dark:border-zinc-800 dark:bg-black/40">
        <div className="h-1.5 w-1.5 rounded-full bg-[var(--color)] shadow-2xs" />
        <span className="ml-1.5 text-[10px] font-bold text-slate-800 dark:text-white">
          {badge1}
        </span>
      </div>
      <div className="flex shrink-0 items-center rounded-full border border-slate-200/80 bg-white/70 px-2.5 py-0.5 shadow-2xs backdrop-blur-md transition-opacity duration-300 ease-in-out group-hover/animated-card:opacity-0 dark:border-zinc-800 dark:bg-black/40">
        <div className="h-1.5 w-1.5 rounded-full bg-[var(--secondary-color)] shadow-2xs" />
        <span className="ml-1.5 text-[10px] font-bold text-slate-800 dark:text-white">
          {badge2}
        </span>
      </div>
    </div>
  );
};

interface Layer2Props {
  color: string;
  title: string;
  description: string;
}

const Layer2: React.FC<Layer2Props> = ({ color, title, description }) => {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[9] flex items-start justify-center p-4"
      style={{ '--color': color } as React.CSSProperties}
    >
      <div className="ease-[cubic-bezier(0.16,1,0.3,1)] flex -translate-y-4 flex-col rounded-xl border border-slate-200/90 bg-white/95 px-3.5 py-2 opacity-0 shadow-xl backdrop-blur-md transition-all duration-400 group-hover/animated-card:translate-y-0 group-hover/animated-card:opacity-100 dark:border-zinc-800 dark:bg-black/90">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 shrink-0 rounded-full bg-[var(--color)] shadow-2xs" />
          <p className="text-xs font-bold text-slate-900 dark:text-white">{title}</p>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">{description}</p>
      </div>
    </div>
  );
};

const Layer3: React.FC<{ color: string }> = ({ color }) => {
  return (
    <div className="ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none absolute inset-0 z-[6] flex items-center justify-center opacity-0 transition-opacity duration-500 group-hover/animated-card:opacity-100">
      <svg
        className="w-full h-full"
        viewBox="0 0 356 180"
        fill="none"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="356" height="180" fill="url(#paint0_linear_29_3)" />
        <defs>
          <linearGradient
            id="paint0_linear_29_3"
            x1="178"
            y1="0"
            x2="178"
            y2="180"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0.35" stopColor={color} stopOpacity="0" />
            <stop offset="1" stopColor={color} stopOpacity="0.22" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

const Layer4: React.FC<LayerProps> = ({ color, secondaryColor = '#38bdf8', hovered }) => {
  const rectsData = [
    {
      width: 14,
      height: 24,
      y: 110,
      hoverHeight: 28,
      hoverY: 122,
      x: 35,
      fill: '#cbd5e1',
      hoverFill: secondaryColor,
    },
    {
      width: 14,
      height: 24,
      y: 95,
      hoverHeight: 34,
      hoverY: 116,
      x: 55,
      fill: color,
      hoverFill: color,
    },
    {
      width: 14,
      height: 44,
      y: 75,
      hoverHeight: 48,
      hoverY: 102,
      x: 75,
      fill: color,
      hoverFill: color,
    },
    {
      width: 14,
      height: 34,
      y: 85,
      hoverHeight: 62,
      hoverY: 88,
      x: 95,
      fill: color,
      hoverFill: color,
    },
    {
      width: 14,
      height: 34,
      y: 110,
      hoverHeight: 52,
      hoverY: 98,
      x: 115,
      fill: '#cbd5e1',
      hoverFill: secondaryColor,
    },
    {
      width: 14,
      height: 54,
      y: 110,
      hoverHeight: 32,
      hoverY: 118,
      x: 135,
      fill: '#cbd5e1',
      hoverFill: secondaryColor,
    },
    {
      width: 14,
      height: 54,
      y: 65,
      hoverHeight: 42,
      hoverY: 108,
      x: 155,
      fill: color,
      hoverFill: color,
    },
    {
      width: 14,
      height: 34,
      y: 85,
      hoverHeight: 32,
      hoverY: 118,
      x: 175,
      fill: color,
      hoverFill: color,
    },
    {
      width: 14,
      height: 24,
      y: 110,
      hoverHeight: 52,
      hoverY: 98,
      x: 195,
      fill: '#cbd5e1',
      hoverFill: secondaryColor,
    },
    {
      width: 14,
      height: 44,
      y: 75,
      hoverHeight: 72,
      hoverY: 78,
      x: 215,
      fill: color,
      hoverFill: color,
    },
    {
      width: 14,
      height: 34,
      y: 110,
      hoverHeight: 82,
      hoverY: 68,
      x: 235,
      fill: '#cbd5e1',
      hoverFill: secondaryColor,
    },
    {
      width: 14,
      height: 54,
      y: 110,
      hoverHeight: 62,
      hoverY: 88,
      x: 255,
      fill: '#cbd5e1',
      hoverFill: secondaryColor,
    },
    {
      width: 14,
      height: 24,
      y: 110,
      hoverHeight: 92,
      hoverY: 58,
      x: 275,
      fill: '#cbd5e1',
      hoverFill: secondaryColor,
    },
    {
      width: 14,
      height: 34,
      y: 85,
      hoverHeight: 104,
      hoverY: 46,
      x: 295,
      fill: color,
      hoverFill: color,
    },
  ];

  return (
    <div className="ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none absolute inset-0 z-[8] flex h-full w-full items-center justify-center transition-transform duration-500 group-hover/animated-card:scale-110">
      <svg
        className="w-full h-full max-h-[190px] drop-shadow-sm"
        viewBox="0 0 340 180"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {rectsData.map((rect) => (
          <rect
            key={rect.x}
            width={rect.width}
            height={hovered ? rect.hoverHeight : rect.height}
            x={rect.x}
            y={hovered ? rect.hoverY : rect.y}
            fill={hovered ? rect.hoverFill : rect.fill}
            rx="3"
            ry="3"
            className="ease-[cubic-bezier(0.16,1,0.3,1)] transition-all duration-500"
          />
        ))}
      </svg>
    </div>
  );
};
