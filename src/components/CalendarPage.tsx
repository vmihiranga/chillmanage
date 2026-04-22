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

  // Drawer (day events sidebar)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Modal (create/edit)
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
  }, [checkAdminStatus, fetchEvents]);

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

  const selectedEvents = selectedDate
    ? events.filter((ev) => {
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
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 py-4 bg-white border-b border-gray-200 calendar-header sm:px-6">
        {/* Logo + title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-md shadow-orange-200">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
          </div>
          <span className="text-lg font-extrabold tracking-tight text-gray-900 hidden sm:inline">
            ChillRide <span className="text-orange-500">Manage</span>
          </span>
        </div>

        {/* Month navigation */}
        <div className="flex items-center gap-2 month-nav">
          <button className="p-2 transition-colors border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600" onClick={prevMonth}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <span className="text-base font-bold text-gray-800 min-w-[140px] text-center">
            {MONTH_NAMES[month]} {year}
          </span>
          <button className="p-2 transition-colors border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600" onClick={nextMonth}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 calendar-header-actions">
          {isAdmin ? (
            <>
              <button className="hidden px-4 py-2 text-sm font-semibold text-gray-600 transition-colors border border-gray-200 rounded-lg lg:inline-flex hover:bg-gray-50" onClick={goToday}>
                Today
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white transition-all bg-orange-500 rounded-lg hover:bg-orange-600 shadow-lg shadow-orange-100" onClick={() => openCreateModal()}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                <span className="hidden md:inline">Add Event</span>
              </button>
              <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-orange-500 transition-colors" title="Logout Admin">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-orange-600 border-2 border-orange-100 rounded-xl hover:bg-orange-50 transition-all active:scale-95"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Admin Login
            </button>
          )}
        </div>
      </header>

      {/* ── Loading bar ── */}
      {loading && (
        <div className="relative h-0.5 overflow-hidden bg-gray-100">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-shimmer" />
        </div>
      )}

      {/* ── Calendar body ── */}
      <main className="flex flex-col flex-1 mx-4 my-4 overflow-hidden bg-white border border-gray-200 shadow-sm calendar-main rounded-2xl sm:mx-6 sm:my-6">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
             <span className="text-xs font-bold tracking-wider text-gray-500 uppercase">
              {events.length} event{events.length !== 1 ? 's' : ''} scheduled
            </span>
            {isAdmin && (
              <span className="px-2 py-0.5 text-[9px] font-black bg-orange-500 text-white rounded-full uppercase tracking-tighter">
                Admin Mode
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {events.slice(0, 5).map((ev) => (
              <div key={ev.id} className="w-2 h-2 rounded-full" style={{ background: ev.color }} />
            ))}
          </div>
        </div>

        <CalendarGrid
          year={year}
          month={month}
          events={events}
          selectedDate={selectedDate}
          onDayClick={handleDayClick}
        />
      </main>

      {/* ── Day events drawer ── */}
      {selectedDate && (
        <DayEventsDrawer
          date={selectedDate}
          events={selectedEvents}
          onClose={() => setSelectedDate(null)}
          onAddEvent={() => openCreateModal(selectedDate)}
          onEditEvent={openEditModal}
          isAdmin={isAdmin}
        />
      )}

      {/* ── Create / Edit modal ── */}
      {modal.open && isAdmin && (
        <EventModal
          mode={modal.mode}
          event={modal.event}
          initialDate={modal.initialDate}
          onClose={() => setModal({ open: false, mode: 'create' })}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      {/* ── Login Modal ── */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => {
            setIsAdmin(true);
            setShowLogin(false);
          }}
        />
      )}
    </div>
  );
}
