'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  ArrowRight, Mail, MessageSquare, Clock, CheckCircle2,
  MapPin, Search, Bot, Code, Database, Sparkles,
} from 'lucide-react';
import { getAnalytics } from '@/lib/analytics';

const intents = [
  { id: 'ai-search', label: 'AI Search & Reputation', icon: Search },
  { id: 'automation', label: 'Intelligent Automation', icon: Bot },
  { id: 'custom-software', label: 'Custom Software', icon: Code },
  { id: 'data', label: 'Data & Analytics', icon: Database },
  { id: 'marketing', label: 'Digital Marketing', icon: Sparkles },
  { id: 'other', label: 'Something else', icon: MessageSquare },
];

const nextSteps = [
  { step: '01', title: 'We review your message', detail: 'A real human reads every submission — usually within a few hours.' },
  { step: '02', title: 'Discovery call', detail: 'We schedule a 30-min call to understand your goals and constraints.' },
  { step: '03', title: 'Concrete proposal', detail: 'You get a scoped plan with timeline and pricing — no vague estimates.' },
];

const trust = [
  { value: '< 4h', label: 'Avg. first response' },
  { value: '500+', label: 'Businesses helped' },
  { value: '14-day', label: 'Free trial on all plans' },
];

const emails = [
  { address: 'hello@vyntrise.com', label: 'General contact' },
  { address: 'sales@vyntrise.com', label: 'New clients' },
  { address: 'support@vyntrise.com', label: 'Customer help' },
  { address: 'info@vyntrise.com', label: 'Business inquiries' },
  { address: 'billing@vyntrise.com', label: 'Invoices & payments' },
];

export default function Contact() {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    // Get analytics IDs
    const analytics = getAnalytics();
    const visitorId = analytics?.getVisitorId();
    const sessionId = analytics?.getSessionId();

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.get('firstName'),
          lastName: formData.get('lastName'),
          email: formData.get('email'),
          company: formData.get('company'),
          intent: selected,
          message: formData.get('message'),
          visitorId,
          sessionId,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        
        // Track form submission
        if (analytics) {
          analytics.trackFormSubmit('contact-form', {
            intent: selected,
            hasCompany: !!formData.get('company'),
          });
        }
      } else {
        console.error('Failed to submit form');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0d1117]">

      {/* Header */}
      <section className="border-b border-slate-100 dark:border-[#21262d] bg-slate-50/60 dark:bg-[#161b22] pt-20 pb-12 px-4 md:px-6">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[400px] w-[700px] rounded-full bg-[radial-gradient(ellipse_at_top,_#dbeafe_0%,_transparent_70%)] opacity-60 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle,_#94a3b818_1px,_transparent_1px)] bg-[size:28px_28px]" />
        </div>
        <div className="container mx-auto max-w-6xl">
          <div className="github-badge mb-4">CONTACT</div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-3 leading-tight">
            Let&apos;s talk about your goals
          </h1>
          <p className="text-lg text-slate-500 max-w-xl">
            Tell us what you&apos;re working on. We&apos;ll come back with a concrete plan — not a sales pitch.
          </p>
        </div>
      </section>

      {/* Main layout */}
      <section className="flex-1 px-4 md:px-6 pb-20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-[1fr_380px] gap-10 items-start">

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
            >
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
                  <div className="h-14 w-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-5">
                    <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Message sent</h2>
                  <p className="text-slate-500 text-sm max-w-sm mb-8">
                    We&apos;ll review your message and get back to you within a few hours. Check your inbox.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} ref={formRef} className="p-7 space-y-6">
                  {/* Intent chips */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      What are you interested in?
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {intents.map((intent) => {
                        const IIcon = intent.icon;
                        const active = selected === intent.id;
                        return (
                          <button
                            key={intent.id}
                            type="button"
                            onClick={() => setSelected(intent.id)}
                            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${active
                              ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                          >
                            <IIcon className="h-3.5 w-3.5" />
                            {intent.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Name row */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="firstName" className="text-xs font-semibold text-slate-700">First name</label>
                      <input
                        type="text" id="firstName" name="firstName" required
                        placeholder="Alex"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="lastName" className="text-xs font-semibold text-slate-700">Last name</label>
                      <input
                        type="text" id="lastName" name="lastName" required
                        placeholder="Rivera"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Email + Company */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="email" className="text-xs font-semibold text-slate-700">Work email</label>
                      <input
                        type="email" id="email" name="email" required
                        placeholder="alex@company.com"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="company" className="text-xs font-semibold text-slate-700">Company</label>
                      <input
                        type="text" id="company" name="company"
                        placeholder="Acme Inc."
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <label htmlFor="message" className="text-xs font-semibold text-slate-700">
                      What&apos;s your biggest challenge right now?
                    </label>
                    <textarea
                      id="message" name="message" rows={4} required
                      placeholder="Describe what you're trying to solve or build..."
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    Send message <ArrowRight className="h-4 w-4" />
                  </button>

                  <p className="text-center text-xs text-slate-400">
                    No spam. No lock-in. We respond within 4 hours on business days.
                  </p>
                </form>
              )}
            </motion.div>

            {/* Right sidebar */}
            <div className="space-y-5">

              {/* Trust stats */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid grid-cols-3 gap-3"
              >
                {trust.map((t) => (
                  <div key={t.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
                    <p className="text-lg font-extrabold text-blue-600">{t.value}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{t.label}</p>
                  </div>
                ))}
              </motion.div>

              {/* What happens next */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">What happens next</p>
                <div className="space-y-5">
                  {nextSteps.map((s) => (
                    <div key={s.step} className="flex gap-4">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 border border-blue-100 text-[10px] font-bold text-blue-600">
                        {s.step}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{s.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{s.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Direct contact */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Email us directly</p>
                <div className="space-y-2.5">
                  {emails.map((e) => (
                    <a
                      key={e.address}
                      href={`mailto:${e.address}`}
                      className="flex items-center justify-between gap-3 group rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center group-hover:border-blue-200 group-hover:bg-blue-50 transition-colors shrink-0">
                          <Mail className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                        <span className="text-sm text-slate-700 group-hover:text-blue-600 transition-colors">{e.address}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{e.label}</span>
                    </a>
                  ))}
                </div>
              </motion.div>

              {/* Address */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Office address</p>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-0.5">VyntRise LLC</p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      205 Van Buren Street, Suite 120, #063<br />
                      Herndon, VA 20170<br />
                      United States
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Hours */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Business hours</p>
                <div className="space-y-2">
                  {[
                    { day: 'Mon – Fri', hours: '9:00 AM – 6:00 PM EST' },
                    { day: 'Saturday', hours: '10:00 AM – 4:00 PM EST' },
                    { day: 'Sunday', hours: 'Closed' },
                  ].map((r) => (
                    <div key={r.day} className="flex justify-between text-xs">
                      <span className="text-slate-500">{r.day}</span>
                      <span className={`font-semibold ${r.hours === 'Closed' ? 'text-slate-400' : 'text-slate-700'}`}>{r.hours}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-emerald-600 font-semibold">Support available during business hours</span>
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
