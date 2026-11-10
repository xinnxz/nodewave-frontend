'use client';

import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import type { DailyStandupSummary } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

interface StandupSummaryModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function StandupSummaryModal({ projectId, isOpen, onClose }: StandupSummaryModalProps) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="standup-title"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 id="standup-title" className="text-lg font-bold text-slate-900">
              Daily Standup Auto-Summary (24 Jam Terakhir)
            </h2>
            <p className="text-xs text-slate-600">
              Agregasi otomatis dari Immutable Audit Trail per departemen
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2.5 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            Tutup (Esc)
          </button>
        </div>

        <div className="mt-4">
          {isLoading && (
            <div className="py-8 text-center text-sm text-slate-600">
              Mengagregasi catatan Audit Trail 24 jam terakhir...
            </div>
          )}

          {isError && (
            <div className="rounded-lg border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
              Gagal memuat ringkasan standup harian.
            </div>
          )}

          {data && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-4 py-2.5 text-xs text-slate-700 border border-slate-200">
                <span>
                  Proyek: <strong className="text-slate-900">{data.projectName}</strong>
                </span>
                <span>Digenerate: {formatDateTime(data.generatedAt)}</span>
              </div>

              {/* Completed Yesterday */}
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
                <h3 className="text-sm font-bold text-emerald-950">
                  Diselesaikan 24 Jam Terakhir ({data.completedYesterday.total} Tugas)
                </h3>
                {Object.keys(data.completedYesterday.byDepartment).length === 0 ? (
                  <p className="mt-2 text-xs text-slate-600">
                    Belum ada tugas yang bertransisi ke DONE dalam 24 jam terakhir.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {Object.entries(data.completedYesterday.byDepartment).map(([dept, items]) => (
                      <div key={dept} className="rounded-md bg-white p-3 border border-emerald-200">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                          Divisi {dept}
                        </span>
                        <ul className="mt-1.5 space-y-1 text-xs text-slate-800">
                          {items.map((item, idx) => (
                            <li key={idx}>
                              • <strong>{item.taskTitle}</strong> (diselesaikan oleh{' '}
                              {item.completedBy})
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Blocked Today */}
              <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-4">
                <h3 className="text-sm font-bold text-rose-950">
                  Terblokir Hari Ini ({data.blockedToday.total} Tugas)
                </h3>
                {Object.keys(data.blockedToday.byDepartment).length === 0 ? (
                  <p className="mt-2 text-xs text-slate-600">
                    Tidak ada tugas yang terblokir saat ini.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {Object.entries(data.blockedToday.byDepartment).map(([dept, items]) => (
                      <div key={dept} className="rounded-md bg-white p-3 border border-rose-200">
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-900">
                          Divisi {dept}
                        </span>
                        <ul className="mt-1.5 space-y-2 text-xs text-slate-800">
                          {items.map((item, idx) => (
                            <li key={idx}>
                              <p>
                                • <strong>{item.taskTitle}</strong>{' '}
                                {item.assignee ? `(Assignee: ${item.assignee})` : ''}
                              </p>
                              {item.blockedBy.length > 0 && (
                                <p className="ml-3 mt-0.5 text-[11px] font-medium text-rose-800">
                                  Menunggu Prerequisite: {item.blockedBy.join(', ')}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Structured JSON Output Preview */}
              <div>
                <p className="mb-1.5 text-xs font-semibold text-slate-700">
                  Structured JSON Output (API Response):
                </p>
                <pre className="max-h-48 overflow-x-auto rounded-lg bg-slate-900 p-3 text-[11px] text-slate-100">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
