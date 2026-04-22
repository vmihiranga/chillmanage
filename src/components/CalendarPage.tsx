'use client';

import { useState, useEffect, useCallback } from 'react';
import { Event } from '@/lib/types';
import CalendarGrid from '@/components/CalendarGrid';
import DayEventsDrawer from '@/components/DayEventsDrawer';
import EventModal from '@/components/EventModal';
import LoginModal from '@/components/LoginModal';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [sentReminders, setSentReminders] = useState<Record<string, string[]>>({});
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [modal, setModal] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    event?: Event;
    initialDate?: string;
  }>({ open: false, mode: 'create' });

  const checkAdminStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/auth');
      const data = await res.json();
      setIsAdmin(data.isAdmin);
    } catch {
      setIsAdmin(false);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const pad = month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
      const res = await fetch(`/api/events?month=${year}-${pad}`);
      if (!res.ok) throw new Error('Failed to load');
      const data: Event[] = await res.json();
      setEvents(data);
    } catch {
      console.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    checkAdminStatus();
    fetchEvents();

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Notifications Check Loop
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && Notification.permission === 'granted' && events.length > 0) {
        const nowMs = Date.now();
        
        events.forEach((ev) => {
          const evTime = new Date(ev.date).getTime();
          const diffMin = (evTime - nowMs) / (1000 * 60);
          
          const levels = [
            { id: '1d', threshold: 1440, msg: '1 day' },
            { id: '4h', threshold: 240, msg: '4 hours' },
            { id: '30m', threshold: 30, msg: '30 minutes' },
          ];

          levels.forEach((lvl) => {
            // If we are within the threshold window (up to 5 mins past it) and haven't notified for this level yet
            if (diffMin > 0 && diffMin <= lvl.threshold && diffMin > lvl.threshold - 10) {
              const alreadySent = sentReminders[ev.id] || [];
              if (!alreadySent.includes(lvl.id)) {
                new Notification(`Reminder: ${ev.title}`, {
                  body: `Starting in ${lvl.msg}`,
                  icon: '/icon-512x512.png',
                });
                setSentReminders(prev => ({
                  ...prev,
                  [ev.id]: [...(prev[ev.id] || []), lvl.id]
                }));
              }
            }
          });
        });
      }
    }, 30000); // Check every 30s

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearInterval(interval);
    };
  }, [checkAdminStatus, fetchEvents, events, sentReminders]);

  useEffect(() => {
    if (typeof window !== 'undefined' && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined') return;
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      new Notification('Chill Calendar', { body: 'Notifications enabled!' });
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  const handleLogout = async () => {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    });
    setIsAdmin(false);
  };

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
    setSelectedDate(null);
  };

  const goToday = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setSelectedDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  const filteredEvents = events.filter((ev) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return ev.title.toLowerCase().includes(q) || ev.description?.toLowerCase().includes(q);
  });

  const selectedEvents = selectedDate
    ? filteredEvents.filter((ev) => {
        const d = new Date(ev.date);
        return (
          d.getFullYear() === selectedDate.getFullYear() &&
          d.getMonth() === selectedDate.getMonth() &&
          d.getDate() === selectedDate.getDate()
        );
      })
    : [];

  const openCreateModal = (date?: Date) => {
    if (!isAdmin) return;
    const d = date || selectedDate || new Date();
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setModal({ open: true, mode: 'create', initialDate: iso });
  };

  const openEditModal = (event: Event) => {
    if (!isAdmin) return;
    setModal({ open: true, mode: 'edit', event });
  };

  const handleSave = (saved: Event) => {
    setEvents((prev) => {
      const exists = prev.find((e) => e.id === saved.id);
      if (exists) return prev.map((e) => (e.id === saved.id ? saved : e));
      return [...prev, saved];
    });
    setModal({ open: false, mode: 'create' });
  };

  const handleDelete = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setModal({ open: false, mode: 'create' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* ── Top Nav ── */}
      <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 py-2 bg-white border-b border-gray-100 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 shadow-md shadow-orange-200">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
          </div>
          <span className="text-base font-black tracking-tight text-gray-900">
            Chill <span className="text-orange-500">Calendar</span>
          </span>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-xs mx-4 hidden md:block">
          <div className="relative group">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-orange-50 focus:border-orange-500 outline-none transition-all placeholder:text-gray-300"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-gray-500"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button className="p-1.5 transition-colors border border-gray-100 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-orange-500" onClick={prevMonth}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <span className="text-sm font-black text-gray-800 min-w-[120px] text-center">
            {MONTH_NAMES[month]} {year}
          </span>
          <button className="p-1.5 transition-colors border border-gray-100 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-orange-500" onClick={nextMonth}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 p-1.5 bg-gray-50 border border-gray-100 rounded-xl mr-2">
            <button onClick={() => setZoom(z => Math.max(0.6, z - 0.2))} className="p-1 text-gray-400 hover:text-orange-500 hover:bg-white rounded-lg transition-all active:scale-90" title="Zoom Out">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14"/></svg>
            </button>
            <span className="text-[9px] font-black w-7 text-center text-gray-400">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(1.6, z + 0.2))} className="p-1 text-gray-400 hover:text-orange-500 hover:bg-white rounded-lg transition-all active:scale-90" title="Zoom In">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          </div>

          <div className="flex items-center gap-2">
          {/* Notification Toggle */}
          <button
            onClick={requestNotificationPermission}
            className={`p-1.5 rounded-xl border transition-all ${notificationsEnabled ? 'bg-orange-500 text-white border-orange-600' : 'bg-gray-50 text-gray-400 border-gray-100 hover:text-orange-500'}`}
            title={notificationsEnabled ? 'Notifications Active' : 'Enable Notifications'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
          </button>

          {showInstallBtn && (
              <button onClick={handleInstallClick} className="flex items-center justify-center w-9 h-9 text-orange-600 bg-orange-100 border border-orange-200 rounded-xl hover:bg-orange-200 transition-all active:scale-95 shadow-sm animate-bounce-subtle" title="Install App">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              </button>
            )}
            {isAdmin ? (
              <>
                <button className="hidden px-3 py-1.5 text-xs font-bold text-gray-600 transition-colors border border-gray-100 rounded-lg lg:inline-flex hover:bg-gray-50" onClick={goToday}>Today</button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-white transition-all bg-orange-500 rounded-lg hover:bg-orange-600 shadow-lg shadow-orange-100" onClick={() => openCreateModal()}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
                  <span>Event</span>
                </button>
                <button onClick={handleLogout} className="p-1.5 text-gray-400 hover:text-orange-500 transition-colors" title="Logout Admin">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                </button>
              </>
            ) : (
              <button onClick={() => setShowLogin(true)} className="flex items-center justify-center w-9 h-9 text-orange-600 bg-orange-50 border border-orange-100 rounded-xl hover:bg-orange-100 transition-all active:scale-95 shadow-sm" title="Admin Login">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </button>
            )}
          </div>
        </div>
      </header>

      {loading && (
        <div className="relative h-0.5 overflow-hidden bg-gray-100">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-shimmer" />
        </div>
      )}

      <main className="flex flex-col flex-1 mx-4 my-4 overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl sm:mx-6 sm:my-6">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
             <span className="text-xs font-bold tracking-wider text-gray-500 uppercase">
              {searchQuery ? `${filteredEvents.length} matches found` : `${events.length} event${events.length !== 1 ? 's' : ''} scheduled`}
            </span>
            {isAdmin && <span className="px-2 py-0.5 text-[9px] font-black bg-orange-500 text-white rounded-full uppercase tracking-tighter">Admin Mode</span>}
          </div>
          <div className="flex items-center gap-1.5">
            {filteredEvents.slice(0, 5).map((ev) => (
              <div key={ev.id} className="w-2 h-2 rounded-full" style={{ background: ev.color }} />
            ))}
          </div>
        </div>
        <CalendarGrid year={year} month={month} events={filteredEvents} selectedDate={selectedDate} onDayClick={handleDayClick} zoom={zoom} />
      </main>

      {selectedDate && <DayEventsDrawer date={selectedDate} events={selectedEvents} onClose={() => setSelectedDate(null)} onAddEvent={() => openCreateModal(selectedDate)} onEditEvent={openEditModal} isAdmin={isAdmin} />}
      {modal.open && isAdmin && <EventModal mode={modal.mode} event={modal.event} initialDate={modal.initialDate} onClose={() => setModal({ open: false, mode: 'create' })} onSave={handleSave} onDelete={handleDelete} />}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onSuccess={() => { setIsAdmin(true); setShowLogin(false); }} />}
    </div>
  );
}
