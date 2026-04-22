'use client';

import { Event } from '@/lib/types';

interface DayEventsDrawerProps {
  date: Date;
  events: Event[];
  onClose: () => void;
  onAddEvent: () => void;
  onEditEvent: (event: Event) => void;
  isAdmin: boolean;
}

function formatTime(isoString: string) {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function DayEventsDrawer({
  date,
  events,
  onClose,
  onAddEvent,
  onEditEvent,
  isAdmin,
}: DayEventsDrawerProps) {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const isToday = (() => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  })();

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-end pointer-events-none sm:items-stretch">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto animate-fade-in"
        onClick={onClose}
      />

      <div
        className={`
          relative w-full sm:max-w-md h-[85vh] sm:h-screen bg-white shadow-2xl border-t sm:border-t-0 sm:border-l border-gray-200
          flex flex-col pointer-events-auto animate-[slideInRight_0.4s_cubic-bezier(0.34,1.56,0.64,1)] rounded-t-3xl sm:rounded-none
        `}
      >
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
        </div>

        <div className="sticky top-0 z-10 px-6 py-6 border-b border-gray-100 bg-white/80 backdrop-blur-md">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-black uppercase tracking-widest text-orange-500">
                  {dayNames[date.getDay()]}
                </span>
                {isToday && (
                  <span className="px-2 py-0.5 text-[9px] font-bold bg-orange-100 text-orange-600 rounded-full tracking-wider uppercase">
                    Today
                  </span>
                )}
              </div>
              <h2 className="text-4xl font-black leading-none text-gray-900">
                {date.getDate()}
              </h2>
              <p className="mt-1 text-sm font-medium text-gray-500">
                {monthNames[date.getMonth()]} {date.getFullYear()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 transition-all bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 active:scale-90"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 px-6 py-6 space-y-4 overflow-y-auto bg-gray-50/50">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex items-center justify-center w-16 h-16 mb-4 bg-white border border-gray-200 rounded-2xl shadow-sm shadow-gray-100">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
              </div>
              <p className="text-sm font-bold text-gray-800">Clear for now</p>
              <p className="mt-1 text-xs font-medium text-gray-400">No events scheduled for this day.</p>
            </div>
          ) : (
            events.map((ev) => (
              <button
                key={ev.id}
                onClick={() => isAdmin && onEditEvent(ev)}
                disabled={!isAdmin}
                className={`group w-full flex items-stretch gap-4 p-4 transition-all bg-white border border-gray-100 rounded-2xl text-left ${isAdmin ? 'hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5 active:scale-[0.98]' : 'cursor-default'}`}
              >
                <div
                  className="w-1.5 rounded-full transition-all group-hover:scale-x-150"
                  style={{ background: ev.color, boxShadow: `0 0 12px ${ev.color}40` }}
                />
                <div className="flex-1 py-1">
                  <h3 className="text-sm font-bold text-gray-900 truncate">
                    {ev.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs font-semibold text-gray-400">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {formatTime(ev.date)}
                  </div>
                  {ev.description && (
                    <p className="mt-2 text-xs font-medium text-gray-400 line-clamp-1 italic">
                      "{ev.description}"
                    </p>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex items-center pr-1 transition-opacity opacity-0 group-hover:opacity-100">
                    <div className="p-1.5 bg-orange-50 text-orange-500 rounded-lg">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {isAdmin && (
          <div className="p-6 border-t border-gray-100 bg-white">
            <button
              className="flex items-center justify-center w-full gap-2 py-4 text-sm font-bold text-white transition-all bg-orange-500 rounded-xl hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-200 active:scale-95"
              onClick={onAddEvent}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Schedule New Event
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
