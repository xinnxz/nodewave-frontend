'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Add01Icon,
  Briefcase01Icon,
  Cancel01Icon,
  Database01Icon,
  PaintBoardIcon,
  ProfileIcon,
  QuillWrite01Icon,
  Search01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';

export interface Member {
  id: string;
  name: string;
  status: string;
  online: boolean;
  role: string;
  roleType: 'pm' | 'designer' | 'data' | 'creator';
  avatar: string;
}

const ALL_MEMBERS: Member[] = [
  {
    id: '01',
    name: 'Andi Pratama',
    status: 'Online',
    online: true,
    role: 'Product Manager',
    roleType: 'pm',
    avatar: '/avatar-3d.png',
  },
  {
    id: '02',
    name: 'Siti Rahma',
    status: '12m ago',
    online: false,
    role: 'UI/UX Designer',
    roleType: 'designer',
    avatar: '/avatar-3d.png',
  },
  {
    id: '03',
    name: 'Budi Santoso',
    status: 'Online',
    online: true,
    role: 'Frontend Lead',
    roleType: 'creator',
    avatar: '/avatar-3d.png',
  },
  {
    id: '04',
    name: 'Eko Wijaya',
    status: 'Online',
    online: true,
    role: 'Backend Architect',
    roleType: 'data',
    avatar: '/avatar-3d.png',
  },
  {
    id: '05',
    name: 'PT Maju Jaya',
    status: 'Active Stakeholder',
    online: true,
    role: 'Client Guest',
    roleType: 'pm',
    avatar: '/avatar-3d.png',
  },
];

const ACTIVE_MEMBERS = ALL_MEMBERS.filter((m) => m.online);

const sweepSpring = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 35,
  mass: 0.5,
};

const RoleBadge = ({
  type,
  label,
}: {
  type: Member['roleType'];
  label: string;
}) => {
  const styles = {
    pm: {
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      border: 'border-indigo-500/30',
      icon: Briefcase01Icon,
    },
    designer: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
      icon: PaintBoardIcon,
    },
    data: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      icon: Database01Icon,
    },
    creator: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      icon: QuillWrite01Icon,
    },
  };

  const style = styles[type] || styles.pm;
  const Icon = style.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2 py-0.5 rounded-full border shrink-0',
        style.bg,
        style.text,
        style.border,
      )}
    >
      <HugeiconsIcon icon={Icon} size={11} strokeWidth={1.8} />
      <span className="text-[10px] font-medium tracking-tight uppercase whitespace-nowrap truncate max-w-[80px] sm:max-w-none">
        {label}
      </span>
    </div>
  );
};

const MemberItem = ({ member }: { member: Member }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, x: 10, y: 15, rotate: 1 },
      visible: { opacity: 1, x: 0, y: 0, rotate: 0 },
    }}
    transition={sweepSpring}
    style={{ originX: 1, originY: 1 }}
    className="flex items-center group py-3 first:pt-0 border-b border-zinc-800/60 last:border-0"
  >
    <div className="relative mr-3 shrink-0">
      <img
        src={member.avatar}
        alt={member.name}
        className="w-10 h-10 rounded-full ring-2 ring-zinc-800 shadow-sm object-contain p-0.5 bg-zinc-900 group-hover:scale-105 transition-all duration-300"
      />
      {member.online && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-black rounded-full flex items-center justify-center shadow-sm">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-xs font-semibold text-white tracking-tight leading-none mb-1 truncate">
        {member.name}
      </h3>
      <div className="flex items-center gap-1.5 opacity-80">
        {member.online && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
        <p
          className={cn(
            'text-[10px] font-medium leading-none',
            member.online ? 'text-emerald-400' : 'text-zinc-500',
          )}
        >
          {member.status}
        </p>
      </div>
    </div>
    <div className="shrink-0 ml-2">
      <RoleBadge type={member.roleType} label={member.role} />
    </div>
  </motion.div>
);

export function StackedList({ className }: { className?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAllMembers = useMemo(
    () =>
      ALL_MEMBERS.filter(
        (m) =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.role.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [searchQuery],
  );

  return (
    <div className={cn('relative w-full h-full flex flex-col', className)}>
      <div className="relative w-full h-full rounded-2xl border border-zinc-800/80 bg-[#0d0f14]/90 flex flex-col overflow-hidden shadow-xl">
        <div className="flex flex-col h-full">
          <div className="p-4 pb-2 border-b border-zinc-800/60">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-white tracking-tight flex items-center gap-2">
                Active Teammates
                <span className="text-[10px] bg-zinc-800/80 border border-zinc-700/60 px-1.5 py-0.5 rounded-full text-zinc-300 leading-none font-mono">
                  {ACTIVE_MEMBERS.length}
                </span>
              </h2>
              <span className="text-[10px] text-zinc-500 font-medium">NodeWave Core</span>
            </div>

            <div className="relative mb-2">
              <HugeiconsIcon
                icon={Search01Icon}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 z-10"
                size={14}
              />
              <Input
                placeholder="Search teammates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-3 bg-zinc-900/60 border-zinc-800 rounded-lg text-xs text-white placeholder:text-zinc-500 transition-all w-full"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 pb-16 custom-scrollbar">
            <motion.div
              initial={false}
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
              className="space-y-0.5"
            >
              {ACTIVE_MEMBERS.map((member) => (
                <MemberItem key={`active-${member.id}`} member={member} />
              ))}
            </motion.div>
          </div>
        </div>

        {/* Expandable Member Directory Drawer */}
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
          <div
            className={`flex items-center justify-between px-3 h-[54px] shrink-0 transition-colors ${
              isExpanded ? 'border-b border-zinc-800' : 'hover:bg-zinc-800/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover/bar:scale-105 transition-transform">
                <HugeiconsIcon icon={ProfileIcon} size={16} strokeWidth={2} />
              </div>
              <motion.div layout="position">
                <h4 className="text-xs font-semibold text-white tracking-tight leading-none">
                  Member Directory
                </h4>
                <p className="text-[10px] text-zinc-400 mt-1">
                  {ALL_MEMBERS.length} Members Registered
                </p>
              </motion.div>
            </div>

            <div className="flex items-center gap-2">
              {!isExpanded && (
                <div className="flex items-center">
                  <div className="flex -space-x-2">
                    {ALL_MEMBERS.slice(0, 3).map((m) => (
                      <img
                        key={`sum-${m.id}`}
                        src={m.avatar}
                        className="w-7 h-7 rounded-full ring-2 ring-zinc-900 object-contain p-0.5 bg-zinc-800"
                        alt="avatar"
                      />
                    ))}
                    <div className="w-7 h-7 rounded-full ring-2 ring-zinc-900 bg-zinc-800 flex items-center justify-center shadow-sm">
                      <span className="text-[9px] font-mono text-zinc-400">
                        +{ALL_MEMBERS.length - 3}
                      </span>
                    </div>
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
                      placeholder="Filter all members..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8 bg-zinc-900/60 border-zinc-800 rounded-lg text-xs text-white placeholder:text-zinc-500 transition-all w-full pl-8"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
              <motion.div
                initial="hidden"
                animate={isExpanded ? 'visible' : 'hidden'}
                variants={{
                  visible: {
                    transition: { staggerChildren: 0.03, delayChildren: 0.1 },
                  },
                  hidden: {
                    transition: { staggerChildren: 0.02, staggerDirection: -1 },
                  },
                }}
                className="space-y-0.5"
              >
                {filteredAllMembers.map((member) => (
                  <MemberItem key={`list-${member.id}`} member={member} />
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
