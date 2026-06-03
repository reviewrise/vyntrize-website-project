"use client";

import { useState, useEffect } from "react";
import { format, addDays, startOfToday, parseISO } from "date-fns";

type TimeSlot = {
  start: string;
  end: string;
};

type Expert = {
  id: string;
  displayName: string;
  bookingSlug: string | null;
  timezone: string | null;
  durationMinutes?: number;
};

export default function RescheduleClient({ token, expert }: { token: string; expert: Expert }) {
  const today = startOfToday();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [bookingResult, setBookingResult] = useState<{ meetLink?: string | null; cancelToken?: string | null; rescheduleToken?: string | null } | null>(null);
  const [visitorTimezone, setVisitorTimezone] = useState("UTC");

  useEffect(() => {
    setVisitorTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  const availableDates = Array.from({ length: 14 }).map((_, i) => addDays(today, i));

  useEffect(() => {
    async function fetchAvailability() {
      setLoading(true);
      try {
        const dateString = format(selectedDate, "yyyy-MM-dd");
        // We can fetch availability by user ID instead of slug, since the slug might have changed
        const res = await fetch(`/api/availability/${expert.id}?date=${dateString}`);
        if (!res.ok) throw new Error("Could not fetch availability");
        const data = await res.json();
        setSlots(data.slots || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAvailability();
    setSelectedSlot(null);
  }, [selectedDate, expert.id]);

  const handleReschedule = async () => {
    if (!selectedSlot) return;
    setStatus("submitting");
    try {
      const res = await fetch(`/api/book/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          startTime: selectedSlot.start,
          endTime: selectedSlot.end,
        }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Reschedule failed");
      }
      
      const data = await res.json();
      setBookingResult(data);
      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message);
    }
  };

  if (status === "success") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100 animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Meeting Rescheduled!</h2>
          <p className="text-slate-600 mb-6">
            Your meeting has been successfully moved. We've sent an updated calendar invitation to your email.
          </p>

          <div className="bg-slate-50 rounded-xl p-5 text-left border border-slate-100 mb-6">
            <div className="flex items-center text-slate-900 font-medium mb-1">
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {format(parseISO(selectedSlot!.start), "EEEE, MMMM d, yyyy")}
            </div>
            <div className="flex items-center text-slate-600 text-sm ml-7 mb-4">
              {format(parseISO(selectedSlot!.start), "h:mm a")} - {format(parseISO(selectedSlot!.end), "h:mm a")}
            </div>

            {bookingResult?.meetLink && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-4">
                <div className="flex items-center text-blue-800 font-medium mb-2">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Google Meet
                </div>
                <a 
                  href={bookingResult.meetLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full text-center py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors text-sm"
                >
                  Join Meeting
                </a>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-center space-x-4 text-sm font-medium">
            {bookingResult?.cancelToken && (
              <a href={`/book/cancel?token=${bookingResult.cancelToken}`} className="text-slate-500 hover:text-slate-800 transition-colors">
                Cancel Meeting
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row min-h-[600px]">
        
        {/* Left Panel: Info */}
        <div className="md:w-1/3 bg-slate-900 p-8 text-white flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-orange-500 rounded-full opacity-20 blur-3xl"></div>
          
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">Reschedule</h1>
            <p className="text-slate-400 mb-8 text-sm">With {expert.displayName}</p>
            
            {selectedSlot ? (
              <div className="space-y-4 text-sm animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="flex items-center text-slate-300">
                  <svg className="w-5 h-5 mr-3 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {format(parseISO(selectedSlot.start), "EEEE, MMMM d, yyyy")}
                </div>
                <div className="flex items-center text-slate-300">
                  <svg className="w-5 h-5 mr-3 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {format(parseISO(selectedSlot.start), "h:mm a")} - {format(parseISO(selectedSlot.end), "h:mm a")} ({expert.durationMinutes || 30} min)
                </div>
                <div className="flex items-center text-slate-300">
                  <svg className="w-5 h-5 mr-3 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {visitorTimezone} <span className="text-slate-500 ml-2">({expert.timezone})</span>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-sm leading-relaxed">
                Pick a new date and time that works better for you.
              </p>
            )}
          </div>
        </div>

        {/* Right Panel: Picker */}
        <div className="md:w-2/3 p-8 flex flex-col h-full bg-white relative">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">Select a New Date & Time</h2>
            
            <div className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide mb-6 -mx-2 px-2">
              {availableDates.map(date => {
                const isSelected = date.getTime() === selectedDate.getTime();
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={`flex flex-col items-center justify-center flex-shrink-0 w-16 h-20 rounded-2xl transition-all duration-200 border ${
                      isSelected 
                      ? 'bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-200 translate-y-[-2px]' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`text-xs font-medium uppercase tracking-wider mb-1 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                      {format(date, 'MMM')}
                    </span>
                    <span className="text-xl font-bold">
                      {format(date, 'd')}
                    </span>
                    <span className={`text-[10px] mt-1 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                      {format(date, 'E')}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-medium text-slate-500 mb-4">{format(selectedDate, 'EEEE, MMMM d')}</h3>
              {loading ? (
                <div className="grid grid-cols-3 gap-3 animate-pulse">
                  {[1,2,3,4,5,6].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl"></div>)}
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-500">No available slots on this day.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {slots.map((slot, i) => {
                    const isSelected = selectedSlot?.start === slot.start;
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-3 px-4 rounded-xl border font-medium transition-all duration-200 active:scale-95 ${
                          isSelected
                          ? 'border-orange-500 bg-orange-500 text-white shadow-md shadow-orange-200'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700'
                        }`}
                      >
                        {format(parseISO(slot.start), "h:mm a")}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="pt-8 mt-auto border-t border-slate-100">
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                {errorMessage}
              </div>
            )}
            <button 
              onClick={handleReschedule}
              disabled={!selectedSlot || status === "submitting"}
              className="w-full py-3.5 px-4 bg-orange-500 text-white rounded-xl font-medium shadow-md shadow-orange-200 hover:bg-orange-600 focus:ring-4 focus:ring-orange-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "submitting" ? "Rescheduling..." : "Confirm New Time"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
