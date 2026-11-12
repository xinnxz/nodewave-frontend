'use client';

import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { DailyStandupSummary } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Calendar, CheckCircle2, Clock, RefreshCw, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface StandupSummaryModalProps {
  projectId: string;
  projectName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function StandupSummaryModal({
  projectId,
  projectName = 'E-Commerce Redesign (PT Maju Jaya)',
  isOpen,
  onClose,
}: StandupSummaryModalProps) {
  const [activeTab, setActiveTab] = useState<'completed' | 'in_progress' | 'blocked'>('completed');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['standup-summary', projectId],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: DailyStandupSummary }>(
        `/projects/${projectId}/daily-summary`,
      );
      return res.data.data;
    },
    enabled: isOpen,
  });

  if (!isOpen) return null;

  const completedTotal = data?.completedYesterday?.total || 3;
  const inProgressTotal = 4;
  const blockedTotal = data?.blockedToday?.total || 2;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="standup-title"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Modal Header matching Mockup */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-800 shadow-2xs">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h2 id="standup-title" className="text-sm font-bold text-slate-900 leading-tight">
                Daily Standup Auto-Summary
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Project: {data?.projectName || projectName} • Period: 9 Nov 2026, 00:00 - 10 Nov
                2026, 23:59
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Tabs Header */}
        <div className="flex items-center gap-6 border-b border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={cn(
              'flex items-center gap-1.5 pb-2.5 text-xs font-bold transition-all cursor-pointer relative',
              activeTab === 'completed' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-700',
            )}
          >
            <span>✓</span>
            <span>Completed Yesterday ({completedTotal})</span>
            {activeTab === 'completed' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-950 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('in_progress')}
            className={cn(
              'flex items-center gap-1.5 pb-2.5 text-xs font-bold transition-all cursor-pointer relative',
              activeTab === 'in_progress'
                ? 'text-slate-900'
                : 'text-slate-400 hover:text-slate-700',
            )}
          >
            <span>▷</span>
            <span>In Progress Today ({inProgressTotal})</span>
            {activeTab === 'in_progress' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-950 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('blocked')}
            className={cn(
              'flex items-center gap-1.5 pb-2.5 text-xs font-bold transition-all cursor-pointer relative',
              activeTab === 'blocked' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-700',
            )}
          >
            <span>⊘</span>
            <span>Blocked Items ({blockedTotal})</span>
            {activeTab === 'blocked' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-950 rounded-full" />
            )}
          </button>
        </div>

        {/* Modal Tab Content Body */}
        <div className="mt-4 min-h-[220px] max-h-[360px] overflow-y-auto space-y-2 pr-1">
          {isLoading && (
            <div className="flex h-44 items-center justify-center gap-2 text-xs text-slate-500">
              <RefreshCw className="h-4 w-4 animate-spin text-slate-600" />
              <span>Memuat ringkasan audit standup...</span>
            </div>
          )}

          {isError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              Gagal memuat ringkasan standup dari server.
            </div>
          )}

          {!isLoading && activeTab === 'completed' && (
            <div className="space-y-2">
              {/* Row 1: UI/UX */}
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 p-3 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-purple-50 border border-purple-200/80 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                    UI/UX (1)
                  </span>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-900">
                      Design Shopping Cart UI
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] font-bold text-slate-400">NW-1001</span>
                  <span className="text-[11px] text-slate-500">
                    Completed 14h ago by Siti Rahma
                  </span>
                </div>
              </div>

              {/* Row 2: Frontend */}
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 p-3 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    FRONTEND (1)
                  </span>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-900">
                      Integrate Cart UI with API
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] font-bold text-slate-400">NW-1022</span>
                  <span className="text-[11px] text-slate-500">
                    Completed 10h ago by Budi Santoso
                  </span>
                </div>
              </div>

              {/* Row 3: Backend */}
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 p-3 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    BACKEND (1)
                  </span>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-900">
                      Build Payment Gateway Integration
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] font-bold text-slate-400">NW-1008</span>
                  <span className="text-[11px] text-slate-500">Completed 8h ago by Eko Wijaya</span>
                </div>
              </div>
            </div>
          )}

          {!isLoading && activeTab === 'in_progress' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 p-3 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    FRONTEND (1)
                  </span>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-900">
                      Frontend Slicing Homepage
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] font-bold text-slate-400">NW-1005</span>
                  <span className="text-[11px] text-slate-500">
                    Active · Assigned to Budi Santoso
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 p-3 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    BACKEND (1)
                  </span>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-900">
                      Build Product Catalog API
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] font-bold text-slate-400">NW-1002</span>
                  <span className="text-[11px] text-slate-500">
                    Active · Assigned to Eko Wijaya
                  </span>
                </div>
              </div>
            </div>
          )}

          {!isLoading && activeTab === 'blocked' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/30 p-3 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                    FRONTEND (1)
                  </span>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        Frontend Slicing Cart & Checkout
                      </span>
                      <p className="text-[10px] text-rose-600 mt-0.5 font-medium">
                        Terkunci: Menunggu prasyarat Design Shopping Cart UI & Payment Gateway
                      </p>
                    </div>
                  </div>
                </div>
                <span className="font-mono text-[10px] font-bold text-slate-400">NW-1007</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end pt-4 border-t border-slate-100 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-950 px-5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
