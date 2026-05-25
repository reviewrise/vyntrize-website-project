'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday,
  addWeeks, subWeeks, startOfDay, getHours, getMinutes,
} from 'date-fns';
import {
  ChevronLeft, ChevronRight, Plus, X, MapPin, Clock,
  Calendar, AlignLeft, Loader2, Trash2,
} from 'lucide-react';

/* ─────────────── Types ─────────────── */
interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
}

type ViewMode = 'month' | 'week';

const EVENT_COLORS = [
  { bg: 'bg-blue-500',   light: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',   dot: 'bg-blue-500'   },
  { bg: 'bg-violet-500', light: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', dot: 'bg-violet-500' },
  { bg: 'bg-emerald-500',light: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', dot: 'bg-emerald-500' },
  { bg: 'bg-amber-500',  light: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', dot: 'bg-amber-500'  },
  { bg: 'bg-rose-500',   light: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',   dot: 'bg-rose-500'   },
];

function eventColor(id: string) {
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return EVENT_COLORS[hash % EVENT_COLORS.length];
}

/* ─────────────── EventModal ─────────────── */
interface EventModalProps {
  date?: Date;
  event?: CalendarEvent;
  onClose: () => void;
  onSave: () => void;
}

function EventModal({ date, event, onClose, onSave }: EventModalProps) {
  const isEditing = !!event;
  const defaultStart = date ? format(date, "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm");
  const defaultEnd   = date ? format(addDays(date, 0), "yyyy-MM-dd'T'") + '01:00' :
    format(new Date(Date.now() + 3600000), "yyyy-MM-dd'T'HH:mm");

  const [title, setTitle]       = useState(event?.title ?? '');
  const [description, setDesc]  = useState(event?.description ?? '');
  const [location, setLocation] = useState(event?.location ?? '');
  const [startTime, setStart]   = useState(event ? format(new Date(event.startTime), "yyyy-MM-dd'T'HH:mm") : defaultStart);
  const [endTime, setEnd]       = useState(event ? format(new Date(event.endTime), "yyyy-MM-dd'T'HH:mm") : defaultEnd);
  const [isAllDay, setAllDay]   = useState(event?.isAllDay ?? false);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError('');
    try {
      const payload = { title, description, location, startTime, endTime, isAllDay };
      const url     = isEditing ? `/api/calendar/${event!.id}` : '/api/calendar';
      const method  = isEditing ? 'PATCH' : 'POST';
      const res     = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error();
      onSave();
    } catch {
      setError('Failed to save event. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!event) return;
    setDeleting(true);
    try {
      await fetch(`/api/calendar/${event.id}`, { method: 'DELETE' });
      onSave();
    } catch {
      setError('Failed to delete event.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            {isEditing ? 'Edit Event' : 'New Event'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:opacity-80 transition-opacity" style={{ color: 'var(--color-text-muted)' }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <input
              type="text"
              placeholder="Event title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full px-0 py-1 text-lg font-semibold bg-transparent border-0 border-b-2 outline-none focus:border-blue-500 transition-colors"
              style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
            />
          </div>

          {/* All day toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div
              onClick={() => setAllDay(v => !v)}
              className={`relative w-9 h-5 rounded-full transition-colors ${isAllDay ? 'bg-blue-500' : ''}`}
              style={{ backgroundColor: isAllDay ? undefined : 'var(--color-border)' }}
            >
              <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isAllDay ? 'translate-x-4' : ''}`} />
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>All day</span>
          </label>

          {/* Times */}
          {!isAllDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-subtle)' }}>Start</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={e => setStart(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-subtle)' }}>End</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={e => setEnd(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
            </div>
          )}

          {/* Location */}
          <div className="flex items-start gap-2.5">
            <MapPin className="h-4 w-4 mt-2.5 shrink-0" style={{ color: 'var(--color-text-subtle)' }} />
            <input
              type="text"
              placeholder="Add location"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="flex-1 px-3 py-2 text-sm rounded-lg outline-none"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            />
          </div>

          {/* Description */}
          <div className="flex items-start gap-2.5">
            <AlignLeft className="h-4 w-4 mt-2.5 shrink-0" style={{ color: 'var(--color-text-subtle)' }} />
            <textarea
              placeholder="Add description"
              value={description}
              onChange={e => setDesc(e.target.value)}
              rows={3}
              className="flex-1 px-3 py-2 text-sm rounded-lg outline-none resize-none"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Delete
              </button>
            ) : <div />}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-xl transition-colors" style={{ color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !title.trim()}
                className="px-4 py-2 text-sm font-bold text-white rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isEditing ? 'Save changes' : 'Create event'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────── Month View ─────────────── */
function MonthView({ current, events, onDayClick, onEventClick }: {
  current: Date;
  events: CalendarEvent[];
  onDayClick: (d: Date) => void;
  onEventClick: (e: CalendarEvent) => void;
}) {
  const monthStart = startOfMonth(current);
  const monthEnd   = endOfMonth(monthStart);
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd    = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let d = gridStart;
  while (d <= gridEnd) { days.push(d); d = addDays(d, 1); }

  function eventsOnDay(day: Date) {
    return events.filter(ev => isSameDay(new Date(ev.startTime), day));
  }

  const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="flex-1 flex flex-col overflow-hidden rounded-2xl" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
      {/* Weekday headers */}
      <div className="grid grid-cols-7">
        {WEEK_LABELS.map(l => (
          <div key={l} className="py-2 text-center text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-subtle)', borderBottom: '1px solid var(--color-border)' }}>
            {l}
          </div>
        ))}
      </div>
      {/* Day cells */}
      <div className="flex-1 grid grid-cols-7" style={{ gridTemplateRows: `repeat(${days.length / 7}, minmax(0, 1fr))` }}>
        {days.map((day, i) => {
          const dayEvents = eventsOnDay(day);
          const inMonth = isSameMonth(day, current);
          const today   = isToday(day);
          return (
            <div
              key={i}
              onClick={() => onDayClick(day)}
              className="p-1.5 flex flex-col gap-1 cursor-pointer hover:opacity-90 transition-opacity min-h-[80px]"
              style={{
                borderRight:  (i + 1) % 7 !== 0 ? '1px solid var(--color-border)' : 'none',
                borderBottom: i < days.length - 7 ? '1px solid var(--color-border)' : 'none',
                backgroundColor: today ? 'rgba(59,130,246,0.04)' : undefined,
                opacity: inMonth ? 1 : 0.4,
              }}
            >
              <span
                className={`w-7 h-7 flex items-center justify-center text-sm font-medium rounded-full ${today ? 'bg-blue-600 text-white font-bold' : ''}`}
                style={{ color: today ? undefined : 'var(--color-text)' }}
              >
                {format(day, 'd')}
              </span>
              <div className="flex flex-col gap-0.5">
                {dayEvents.slice(0, 3).map(ev => {
                  const c = eventColor(ev.id);
                  return (
                    <button
                      key={ev.id}
                      onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                      className={`text-left text-[11px] font-medium px-1.5 py-0.5 rounded truncate ${c.light}`}
                    >
                      {ev.title}
                    </button>
                  );
                })}
                {dayEvents.length > 3 && (
                  <span className="text-[10px] pl-1.5" style={{ color: 'var(--color-text-subtle)' }}>+{dayEvents.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────── Week View ─────────────── */
function WeekView({ current, events, onSlotClick, onEventClick }: {
  current: Date;
  events: CalendarEvent[];
  onSlotClick: (d: Date) => void;
  onEventClick: (e: CalendarEvent) => void;
}) {
  const weekStart = startOfWeek(current, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const HOUR_HEIGHT = 56;

  function eventsOnDay(day: Date) {
    return events.filter(ev => isSameDay(new Date(ev.startTime), day));
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden rounded-2xl" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
      {/* Day headers */}
      <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))]" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div />
        {days.map((day, i) => (
          <div key={i} className="py-3 text-center" style={{ borderLeft: '1px solid var(--color-border)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-subtle)' }}>{format(day, 'EEE')}</p>
            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mt-0.5 ${isToday(day) ? 'bg-blue-600 text-white' : ''}`} style={{ color: isToday(day) ? undefined : 'var(--color-text)' }}>
              {format(day, 'd')}
            </span>
          </div>
        ))}
      </div>
      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative" style={{ minHeight: `${HOUR_HEIGHT * 24}px` }}>
          {/* Hour lines */}
          {hours.map(h => (
            <div key={h} className="absolute w-full flex" style={{ top: `${h * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}>
              <div className="w-14 pr-2 text-right flex-shrink-0">
                <span className="text-[10px] font-medium" style={{ color: 'var(--color-text-subtle)' }}>
                  {h === 0 ? '' : `${h.toString().padStart(2, '0')}:00`}
                </span>
              </div>
              <div className="flex-1" style={{ borderTop: '1px solid var(--color-border)' }} />
            </div>
          ))}
          {/* Day columns */}
          <div className="absolute inset-0 grid grid-cols-[56px_repeat(7,minmax(0,1fr))]">
            <div />
            {days.map((day, di) => {
              const dayEvts = eventsOnDay(day);
              return (
                <div
                  key={di}
                  className="relative cursor-pointer"
                  style={{ borderLeft: '1px solid var(--color-border)' }}
                  onClick={e => {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    const offsetY = e.clientY - rect.top;
                    const hour = Math.floor(offsetY / HOUR_HEIGHT);
                    const slot = new Date(day);
                    slot.setHours(hour, 0, 0, 0);
                    onSlotClick(slot);
                  }}
                >
                  {dayEvts.map(ev => {
                    const start = new Date(ev.startTime);
                    const end   = new Date(ev.endTime);
                    const top   = (getHours(start) + getMinutes(start) / 60) * HOUR_HEIGHT;
                    const height = Math.max(((end.getTime() - start.getTime()) / 3600000) * HOUR_HEIGHT, 20);
                    const c = eventColor(ev.id);
                    return (
                      <button
                        key={ev.id}
                        onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                        className={`absolute left-0.5 right-0.5 rounded-md px-1.5 py-1 text-left overflow-hidden ${c.light}`}
                        style={{ top: `${top}px`, height: `${height}px`, zIndex: 10 }}
                      >
                        <p className="text-[11px] font-bold truncate">{ev.title}</p>
                        {height > 30 && (
                          <p className="text-[10px] opacity-70">{format(start, 'h:mm a')}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Main Page ─────────────── */
export default function CalendarPage() {
  const [current, setCurrent]   = useState(new Date());
  const [view, setView]         = useState<ViewMode>('month');
  const [events, setEvents]     = useState<CalendarEvent[]>([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState<{ open: boolean; date?: Date; event?: CalendarEvent }>({ open: false });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/calendar');
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  function navigate(dir: 1 | -1) {
    if (view === 'month') setCurrent(v => dir === 1 ? addMonths(v, 1) : subMonths(v, 1));
    else setCurrent(v => dir === 1 ? addWeeks(v, 1) : subWeeks(v, 1));
  }

  const title = view === 'month'
    ? format(current, 'MMMM yyyy')
    : `${format(startOfWeek(current, { weekStartsOn: 1 }), 'MMM d')} – ${format(endOfWeek(current, { weekStartsOn: 1 }), 'MMM d, yyyy')}`;

  const todayEvents = events
    .filter(ev => isSameDay(new Date(ev.startTime), new Date()))
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Calendar</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Schedule and manage meetings</p>
        </div>
        <button
          onClick={() => setModal({ open: true })}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          New event
        </button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left sidebar */}
        <div className="w-60 flex-shrink-0 flex flex-col gap-4">
          {/* Mini nav */}
          <div className="rounded-2xl p-4" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{format(current, 'MMMM yyyy')}</span>
              <div className="flex gap-1">
                <button onClick={() => navigate(-1)} className="p-1 rounded hover:opacity-70 transition-opacity" style={{ color: 'var(--color-text-muted)' }}>
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => navigate(1)} className="p-1 rounded hover:opacity-70 transition-opacity" style={{ color: 'var(--color-text-muted)' }}>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <button
              onClick={() => setCurrent(new Date())}
              className="w-full text-xs font-semibold py-1.5 rounded-lg mb-3 transition-colors hover:opacity-80"
              style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}
            >
              Today
            </button>

            {/* View toggle */}
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
              {(['month', 'week'] as ViewMode[]).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="flex-1 py-1.5 text-xs font-semibold capitalize transition-colors"
                  style={{
                    backgroundColor: view === v ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: view === v ? '#fff' : 'var(--color-text-muted)',
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Today's events */}
          <div className="rounded-2xl p-4 flex-1 overflow-auto" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-subtle)' }}>Today</span>
            </div>
            {loading ? (
              <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--color-text-subtle)' }} /></div>
            ) : todayEvents.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: 'var(--color-text-subtle)' }}>No events today</p>
            ) : (
              <div className="space-y-2">
                {todayEvents.map(ev => {
                  const c = eventColor(ev.id);
                  return (
                    <button
                      key={ev.id}
                      onClick={() => setModal({ open: true, event: ev })}
                      className="w-full text-left p-2.5 rounded-xl hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                        <span className="text-xs font-semibold truncate" style={{ color: 'var(--color-text)' }}>{ev.title}</span>
                      </div>
                      {!ev.isAllDay && (
                        <div className="flex items-center gap-1 ml-4">
                          <Clock className="h-3 w-3" style={{ color: 'var(--color-text-subtle)' }} />
                          <span className="text-[10px]" style={{ color: 'var(--color-text-subtle)' }}>
                            {format(new Date(ev.startTime), 'h:mm a')}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Main calendar */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* Calendar nav */}
          <div className="flex items-center gap-3 mb-3 flex-shrink-0">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl transition-colors hover:opacity-80" style={{ color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="text-lg font-bold flex-1" style={{ color: 'var(--color-text)' }}>{title}</h2>
            <button onClick={() => navigate(1)} className="p-2 rounded-xl transition-colors hover:opacity-80" style={{ color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-text-subtle)' }} />
            </div>
          ) : view === 'month' ? (
            <MonthView
              current={current}
              events={events}
              onDayClick={date => setModal({ open: true, date })}
              onEventClick={event => setModal({ open: true, event })}
            />
          ) : (
            <WeekView
              current={current}
              events={events}
              onSlotClick={date => setModal({ open: true, date })}
              onEventClick={event => setModal({ open: true, event })}
            />
          )}
        </div>
      </div>

      {/* Modal */}
      {modal.open && (
        <EventModal
          date={modal.date}
          event={modal.event}
          onClose={() => setModal({ open: false })}
          onSave={() => { setModal({ open: false }); fetchEvents(); }}
        />
      )}
    </div>
  );
}
