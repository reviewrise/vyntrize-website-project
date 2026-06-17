'use client';

import { useState } from 'react';
import { CalendarDays, Loader2, CheckCircle2, AlertCircle, X, Video, Link2 } from 'lucide-react';

interface Props {
  to: string;
  toName?: string;
  leadId?: string;
  contactId?: string;
  bookingSlug?: string | null;
}

type Mode = 'schedule' | 'booking-link';

export function SendMeetingLinkButton({ to, toName, leadId, contactId, bookingSlug }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('schedule');
  const [note, setNote] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [meetLink, setMeetLink] = useState<string | null>(null);

  function resetForm() {
    setNote('');
    setTitle('');
    setDate('');
    setStartTime('');
    setDuration(30);
    setStatus('idle');
    setError(null);
    setMeetLink(null);
  }

  function handleClose() {
    setOpen(false);
    resetForm();
  }

  async function handleSend() {
    setSending(true);
    setError(null);
    setMeetLink(null);

    try {
      let scheduledTime: { startISO: string; endISO: string; title: string } | undefined;

      if (mode === 'schedule') {
        if (!date || !startTime) {
          setError('Please select a date and start time.');
          setSending(false);
          return;
        }
        const start = new Date(`${date}T${startTime}:00`);
        if (isNaN(start.getTime())) {
          setError('Invalid date or time.');
          setSending(false);
          return;
        }
        const end = new Date(start.getTime() + duration * 60 * 1000);
        scheduledTime = {
          startISO: start.toISOString(),
          endISO: end.toISOString(),
          title: title.trim() || `Meeting with ${toName ?? to}`,
        };
      }

      const res = await fetch('/api/email/send-meeting-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          toName: toName || undefined,
          leadId: leadId || undefined,
          contactId: contactId || undefined,
          personalNote: note.trim() || undefined,
          scheduledTime,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');

      setMeetLink(data.meetLink ?? null);
      setStatus('sent');
      setTimeout(() => {
        handleClose();
      }, 3500);
    } catch (err: any) {
      setStatus('error');
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  // Minimum date = today
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <>
      <button
        onClick={() => { setOpen(true); resetForm(); }}
        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
        style={{
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-raised)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface)'; }}
      >
        <Video className="h-4 w-4" style={{ color: '#1a73e8' }} />
        Send Meeting Link
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div
            className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#e8f0fe' }}>
                  <Video className="h-4 w-4" style={{ color: '#1a73e8' }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Send Google Meet Invitation</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>to {toName || to}</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-100" style={{ color: 'var(--color-text-muted)' }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Mode selector */}
            <div className="px-5 pt-4">
              <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                <button
                  onClick={() => setMode('schedule')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-colors"
                  style={{
                    backgroundColor: mode === 'schedule' ? '#1a73e8' : 'transparent',
                    color: mode === 'schedule' ? '#fff' : 'var(--color-text-muted)',
                  }}
                >
                  <Video className="h-3.5 w-3.5" />
                  Schedule Now
                </button>
                <button
                  onClick={() => setMode('booking-link')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-colors"
                  style={{
                    backgroundColor: mode === 'booking-link' ? '#1a73e8' : 'transparent',
                    color: mode === 'booking-link' ? '#fff' : 'var(--color-text-muted)',
                    borderLeft: '1px solid var(--color-border)',
                  }}
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Let Them Pick a Time
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4">

              {mode === 'schedule' && (
                <>
                  {/* Meeting title */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>
                      Meeting Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={`Meeting with ${toName ?? to}`}
                      className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                      style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                      disabled={sending || status === 'sent'}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Date */}
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>
                        Date <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="date"
                        value={date}
                        min={minDate}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                        style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                        disabled={sending || status === 'sent'}
                      />
                    </div>

                    {/* Start time */}
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>
                        Start Time <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                        style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                        disabled={sending || status === 'sent'}
                      />
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>
                      Duration
                    </label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                      style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                      disabled={sending || status === 'sent'}
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={90}>1.5 hours</option>
                      <option value={120}>2 hours</option>
                    </select>
                  </div>

                  {/* Info strip */}
                  <div className="rounded-xl px-4 py-3 flex items-start gap-2.5" style={{ backgroundColor: '#e8f0fe', border: '1px solid #c5d8fc' }}>
                    <Video className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#1a73e8' }} />
                    <p className="text-xs leading-relaxed" style={{ color: '#1558d6' }}>
                      A Google Meet link will be generated and sent to the contact. The meeting will appear in your Google Calendar.
                      <br /><span className="font-medium">Requires Google Calendar connected in Settings → Integrations.</span>
                    </p>
                  </div>
                </>
              )}

              {mode === 'booking-link' && (
                <div className="rounded-xl px-4 py-3 flex items-start gap-2.5" style={{ backgroundColor: '#e8f0fe', border: '1px solid #c5d8fc' }}>
                  <Link2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#1a73e8' }} />
                  <p className="text-xs leading-relaxed" style={{ color: '#1558d6' }}>
                    The contact will receive a link to your booking page where they can pick any available slot.
                    A Google Meet is automatically created when they book.
                    {!bookingSlug && <><br /><span className="font-medium">No booking slug set — they'll see the general booking hub.</span></>}
                  </p>
                </div>
              )}

              {/* Personal note */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>
                  Personal Note <span className="font-normal" style={{ color: 'var(--color-text-muted)' }}>(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Looking forward to discussing your project..."
                  className="w-full rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2"
                  style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                  disabled={sending || status === 'sent'}
                />
              </div>

              {/* Status feedback */}
              {status === 'sent' && (
                <div className="flex flex-col gap-2 rounded-xl px-4 py-3" style={{ backgroundColor: 'rgb(240 253 244)', border: '1px solid rgb(187 247 208)' }}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: 'rgb(22 101 52)' }} />
                    <p className="text-sm font-medium" style={{ color: 'rgb(22 101 52)' }}>
                      {mode === 'schedule' ? 'Meeting invitation sent!' : 'Booking link sent!'}
                    </p>
                  </div>
                  {meetLink && (
                    <a
                      href={meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-medium ml-6"
                      style={{ color: '#1a73e8' }}
                    >
                      <Video className="h-3.5 w-3.5" />
                      {meetLink}
                    </a>
                  )}
                </div>
              )}
              {status === 'error' && error && (
                <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ backgroundColor: 'rgb(254 242 242)', border: '1px solid rgb(254 202 202)' }}>
                  <AlertCircle className="h-4 w-4 shrink-0" style={{ color: 'rgb(153 27 27)' }} />
                  <p className="text-sm" style={{ color: 'rgb(153 27 27)' }}>{error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4" style={{ borderTop: '1px solid var(--color-border)' }}>
              <button
                onClick={handleClose}
                disabled={sending}
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending || status === 'sent'}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60 transition-colors"
                style={{ backgroundColor: '#1a73e8' }}
                onMouseEnter={(e) => { if (!sending && status !== 'sent') e.currentTarget.style.backgroundColor = '#1557b0'; }}
                onMouseLeave={(e) => { if (!sending && status !== 'sent') e.currentTarget.style.backgroundColor = '#1a73e8'; }}
              >
                {sending
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                  : status === 'sent'
                  ? <><CheckCircle2 className="h-4 w-4" /> Sent!</>
                  : mode === 'schedule'
                  ? <><Video className="h-4 w-4" /> Send Meet Invite</>
                  : <><Link2 className="h-4 w-4" /> Send Booking Link</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
