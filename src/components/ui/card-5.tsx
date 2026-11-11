'use client';

import { cn } from '@/lib/utils';
import { type Variants, motion } from 'framer-motion';
import * as React from 'react';

// Pre-defined color themes for the card
const colorThemes = {
  default: {
    from: '142 76% 40%',
    to: '160 60% 44%',
    foreground: '0 0% 100%',
  },
  blue: {
    from: '217 91% 56%',
    to: '221 83% 48%',
    foreground: '0 0% 100%',
  },
  violet: {
    from: '262 83% 54%',
    to: '262 70% 46%',
    foreground: '0 0% 100%',
  },
  orange: {
    from: '24 94% 48%',
    to: '35 92% 54%',
    foreground: '0 0% 100%',
  },
};

export interface HighlightCardProps {
  title: string;
  description: string;
  metricValue: string;
  metricLabel: string;
  buttonText?: string;
  onButtonClick?: () => void;
  icon: React.ReactNode;
  color?: keyof typeof colorThemes; // 'default' | 'blue' | 'violet' | 'orange'
  className?: string;
}

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: 'easeOut',
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
};

export const HighlightCard = React.forwardRef<HTMLDivElement, HighlightCardProps>(
  (
    {
      title,
      description,
      metricValue,
      metricLabel,
      buttonText = 'Lihat',
      onButtonClick,
      icon,
      color = 'default',
      className,
    },
    ref,
  ) => {
    const theme = colorThemes[color] || colorThemes.default;

    return (
      <motion.div
        ref={ref}
        className={cn(
          'relative w-full overflow-hidden rounded-2xl p-4 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5',
          className,
        )}
        style={
          {
            '--card-from-color': `hsl(${theme.from})`,
            '--card-to-color': `hsl(${theme.to})`,
            '--card-foreground-color': `hsl(${theme.foreground})`,
            color: 'var(--card-foreground-color)',
            backgroundImage: `
            radial-gradient(circle at 1px 1px, hsla(0,0%,100%,0.2) 1px, transparent 0),
            linear-gradient(to bottom right, var(--card-from-color), var(--card-to-color))
          `,
            backgroundSize: '0.45rem 0.45rem, 100% 100%',
          } as React.CSSProperties
        }
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Bookmark ribbon with icon */}
        <div className="absolute top-0 right-4 h-11 w-9 bg-white/95 backdrop-blur-sm [clip-path:polygon(0%_0%,_100%_0%,_100%_100%,_50%_75%,_0%_100%)] shadow-2xs z-10">
          <div
            className="absolute inset-0 flex items-center justify-center pb-2"
            style={{ color: 'var(--card-from-color)' }}
          >
            {icon}
          </div>
        </div>

        <div className="flex h-full flex-col justify-between pr-8">
          {/* Top section */}
          <div>
            <motion.h3
              variants={itemVariants}
              className="text-xs sm:text-sm font-bold tracking-tight text-white leading-tight"
            >
              {title}
            </motion.h3>
            <motion.p
              variants={itemVariants}
              className="mt-0.5 text-[10px] text-white/85 truncate max-w-[220px]"
            >
              {description}
            </motion.p>
          </div>

          {/* Divider */}
          <motion.div variants={itemVariants} className="my-2 h-px w-full bg-white/20" />

          {/* Bottom section */}
          <div className="flex items-end justify-between gap-2">
            <motion.div variants={itemVariants}>
              <p className="text-xl sm:text-2xl font-black tracking-tight text-white leading-none">
                {metricValue}
              </p>
              <p className="text-[9.5px] text-white/85 font-medium mt-0.5">{metricLabel}</p>
            </motion.div>
            {buttonText && onButtonClick && (
              <motion.button
                type="button"
                variants={itemVariants}
                onClick={onButtonClick}
                className="rounded-full bg-white/20 hover:bg-white/30 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 active:scale-95 shadow-2xs cursor-pointer shrink-0"
                aria-label={buttonText}
              >
                {buttonText}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    );
  },
);

HighlightCard.displayName = 'HighlightCard';
