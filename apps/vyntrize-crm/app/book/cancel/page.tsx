"use client";

import { useState, use } from "react";

export default function CancelPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const resolvedParams = use(searchParams);
  const token = resolvedParams.token;
  
  const [status, setStatus] = useState<"idle" | "cancelling" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center text-slate-500">Invalid link. No token provided.</div>
      </div>
    );
  }

  const handleCancel = async () => {
    setStatus("cancelling");
    try {
      const res = await fetch("/api/book/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to cancel meeting.");
      }

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
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Meeting Cancelled</h2>
          <p className="text-slate-600 mb-6">
            Your meeting has been successfully cancelled and removed from the calendar.
          </p>
          <a href="https://vyntrise.com" className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors block text-center">
            Return to Website
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100">
        <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Cancel Meeting?</h2>
        <p className="text-slate-600 mb-8">
          Are you sure you want to cancel this meeting? This action cannot be undone.
        </p>

        {status === "error" && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
            {errorMessage}
          </div>
        )}

        <button 
          onClick={handleCancel}
          disabled={status === "cancelling"}
          className="w-full py-3.5 px-4 bg-red-600 text-white rounded-xl font-medium shadow-md shadow-red-200 hover:bg-red-700 focus:ring-4 focus:ring-red-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {status === "cancelling" ? "Cancelling..." : "Yes, Cancel Meeting"}
        </button>
      </div>
    </div>
  );
}
