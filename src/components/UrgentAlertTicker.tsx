import React, { useState } from 'react';
import { Announcement } from '../types';
import { AlertTriangle, X, ChevronRight, BellRing } from 'lucide-react';

interface UrgentAlertTickerProps {
  urgentAnnouncements: Announcement[];
  onOpenAnnouncement: (announcement: Announcement) => void;
}

export const UrgentAlertTicker: React.FC<UrgentAlertTickerProps> = ({
  urgentAnnouncements,
  onOpenAnnouncement,
}) => {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const activeAlerts = urgentAnnouncements.filter((a) => !dismissedIds.includes(a.id));

  if (activeAlerts.length === 0) return null;

  const currentAlert = activeAlerts[0];

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds((prev) => [...prev, id]);
  };

  return (
    <div className="w-full bg-gradient-to-r from-rose-950 via-rose-900 to-amber-950 border-b border-rose-500/40 text-white px-4 py-2 text-xs shadow-lg relative z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        <div 
          onClick={() => onOpenAnnouncement(currentAlert)}
          className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <div className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono font-bold text-[10px] flex items-center gap-1 shrink-0 animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            <span>URGENT ACADEMIC ALERT</span>
          </div>

          <div className="truncate font-medium text-slate-100 flex items-center gap-2">
            <span className="font-bold text-rose-200">{currentAlert.title}:</span>
            <span className="truncate text-slate-300 hidden sm:inline">{currentAlert.content}</span>
          </div>

          <span className="text-[11px] text-rose-300 font-semibold underline shrink-0 flex items-center gap-0.5">
            Details &rarr;
          </span>
        </div>

        <button
          onClick={(e) => handleDismiss(currentAlert.id, e)}
          className="p-1 rounded-lg hover:bg-white/10 text-rose-300 hover:text-white transition-colors cursor-pointer shrink-0"
          title="Dismiss alert"
        >
          <X className="w-3.5 h-3.5" />
        </button>

      </div>
    </div>
  );
};
