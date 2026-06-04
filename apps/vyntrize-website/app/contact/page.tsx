'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  ArrowRight, Mail, MessageSquare, Clock, CheckCircle2,
  MapPin, Search, Bot, Code, Database, Sparkles, Phone
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
  { value: 'Growing', label: 'Bespoke partnerships' },
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
  const [loading, setLoading] = useState(false);
  const [experts, setExperts] = useState<any[]>([]);
  const [expertsLoading, setExpertsLoading] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);

  // Fetch experts on mount
  useEffect(() => {
    async function fetchExperts() {
      try {
        const res = await fetch('/api/experts');
        if (res.ok) {
          const data = await res.json();
          setExperts(data.experts || []);
        }
      } catch (err) {
        console.error('Failed to fetch experts:', err);
      } finally {
        setExpertsLoading(false);
      }
    }
    fetchExperts();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
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
          phone: formData.get('phone'),
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
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>

      {/* Header */}
      <section className="pt-20 pb-12 px-4 md:px-6" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[400px] w-[700px] rounded-full bg-[radial-gradient(ellipse_at_top,_#dbeafe_0%,_transparent_70%)] opacity-60 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle,_#94a3b818_1px,_transparent_1px)] bg-[size:28px_28px]" />
        </div>
        <div className="container mx-auto max-w-6xl">
          <div className="github-badge mb-4">CONTACT</div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3 leading-tight" style={{ color: 'var(--color-text)' }}>
            Let&apos;s talk about your goals
          </h1>
          <p className="text-lg max-w-xl" style={{ color: 'var(--color-text-muted)' }}>
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
              className="rounded-2xl shadow-sm overflow-hidden"
              style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}
            >
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
                  <div className="h-14 w-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-5">
                    <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-extrabold mb-2" style={{ color: 'var(--color-text)' }}>Message sent</h2>
                  <p className="text-sm max-w-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
                    We&apos;ll review your message and get back to you within a few hours. Check your inbox.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setLoading(false);
                    }}
                    className="text-sm font-semibold"
                    style={{ color: 'var(--color-primary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary-h)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} ref={formRef} className="p-7 space-y-6">
                  {/* Intent chips */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-subtle)' }}>
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
                            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${active ? 'shadow-sm' : ''}`}
                            style={{
                              borderColor: active ? 'var(--color-primary)' : 'var(--color-border)',
                              backgroundColor: active ? 'var(--color-primary)' : 'var(--color-bg)',
                              color: active ? '#ffffff' : 'var(--color-text-muted)'
                            }}
                            onMouseEnter={(e) => {
                              if (!active) {
                                e.currentTarget.style.borderColor = 'var(--color-border)';
                                e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!active) {
                                e.currentTarget.style.borderColor = 'var(--color-border)';
                                e.currentTarget.style.backgroundColor = 'var(--color-bg)';
                              }
                            }}
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
                      <label htmlFor="firstName" className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>First name</label>
                      <input
                        type="text" id="firstName" name="firstName" required
                        placeholder="Alex"
                        className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all"
                        style={{ 
                          border: '1px solid var(--color-border)', 
                          backgroundColor: 'var(--color-surface)',
                          color: 'var(--color-text)'
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="lastName" className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>Last name</label>
                      <input
                        type="text" id="lastName" name="lastName" required
                        placeholder="Rivera"
                        className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all"
                        style={{ 
                          border: '1px solid var(--color-border)', 
                          backgroundColor: 'var(--color-surface)',
                          color: 'var(--color-text)'
                        }}
                      />
                    </div>
                  </div>

                  {/* Email — full width */}
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>Work email</label>
                    <input
                      type="email" id="email" name="email" required
                      placeholder="alex@company.com"
                      className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all"
                      style={{ 
                        border: '1px solid var(--color-border)', 
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-text)'
                      }}
                    />
                  </div>

                  {/* Phone + Company */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="phone" className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>Phone number</label>
                      <input
                        type="tel" id="phone" name="phone"
                        placeholder="+1 (555) 000-0000"
                        className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all"
                        style={{ 
                          border: '1px solid var(--color-border)', 
                          backgroundColor: 'var(--color-surface)',
                          color: 'var(--color-text)'
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="company" className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>Company</label>
                      <input
                        type="text" id="company" name="company"
                        placeholder="Acme Inc."
                        className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all"
                        style={{ 
                          border: '1px solid var(--color-border)', 
                          backgroundColor: 'var(--color-surface)',
                          color: 'var(--color-text)'
                        }}
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <label htmlFor="message" className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                      What&apos;s your biggest challenge right now?
                    </label>
                    <textarea
                      id="message" name="message" rows={4} required
                      placeholder="Describe what you're trying to solve or build..."
                      className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all resize-none"
                      style={{ 
                        border: '1px solid var(--color-border)', 
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-text)'
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                    onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = 'var(--color-primary-h)')}
                    onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = 'var(--color-primary)')}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        Send message <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs" style={{ color: 'var(--color-text-subtle)' }}>
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
                  <div key={t.label} className="rounded-xl p-4 shadow-sm text-center" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                    <p className="text-lg font-extrabold" style={{ color: 'var(--color-primary)' }}>{t.value}</p>
                    <p className="text-[10px] mt-0.5 leading-tight" style={{ color: 'var(--color-text-subtle)' }}>{t.label}</p>
                  </div>
                ))}
              </motion.div>

              {/* What happens next */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="rounded-2xl p-6 shadow-sm"
                style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-subtle)' }}>What happens next</p>
                <div className="space-y-5">
                  {nextSteps.map((s) => (
                    <div key={s.step} className="flex gap-4">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 border border-blue-100 text-[10px] font-bold text-blue-600">
                        {s.step}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{s.title}</p>
                        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{s.detail}</p>
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
                className="rounded-2xl p-6 shadow-sm"
                style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-subtle)' }}>Email us directly</p>
                <div className="space-y-2.5">
                  {emails.map((e) => (
                    <a
                      key={e.address}
                      href={`mailto:${e.address}`}
                      className="flex items-center justify-between gap-3 group rounded-lg px-3 py-2 transition-colors"
                      onMouseEnter={(ev) => ev.currentTarget.style.backgroundColor = 'var(--color-surface)'}
                      onMouseLeave={(ev) => ev.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors shrink-0" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                          <Mail className="h-3.5 w-3.5 transition-colors" style={{ color: 'var(--color-text-muted)' }} />
                        </div>
                        <span className="text-sm transition-colors" style={{ color: 'var(--color-text)' }}>{e.address}</span>
                      </div>
                      <span className="text-[10px] shrink-0" style={{ color: 'var(--color-text-subtle)' }}>{e.label}</span>
                    </a>
                  ))}
                </div>
              </motion.div>

              {/* Call us */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.22 }}
                className="rounded-2xl p-6 shadow-sm"
                style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-subtle)' }}>Call us directly</p>
                <a
                  href="tel:+18005551234"
                  className="flex items-center justify-between gap-3 group rounded-lg px-3 py-2 transition-colors"
                  onMouseEnter={(ev) => ev.currentTarget.style.backgroundColor = 'var(--color-surface)'}
                  onMouseLeave={(ev) => ev.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors shrink-0" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                      <Phone className="h-3.5 w-3.5 transition-colors" style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                    <span className="text-sm font-semibold transition-colors" style={{ color: 'var(--color-text)' }}>+1 (800) 555-1234</span>
                  </div>
                  <span className="text-[10px] shrink-0" style={{ color: 'var(--color-text-subtle)' }}>Sales & Support</span>
                </a>
              </motion.div>

              {/* Address */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="rounded-2xl p-6 shadow-sm"
                style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-subtle)' }}>Book an Expert Directly</p>
                
                {expertsLoading ? (
                  <div className="flex items-center justify-center gap-2 py-5">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" style={{ color: 'var(--color-primary)' }}>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Loading experts...</span>
                  </div>
                ) : experts.length > 0 ? (
                  <div className="space-y-3">
                    {experts.map((expert) => (
                      <a
                        key={expert.id}
                        href={`${process.env.NEXT_PUBLIC_CRM_URL || 'https://crm.vyntrise.com'}/book/${expert.bookingSlug}`}
                        className="flex items-center justify-between gap-3 group rounded-lg p-2.5 transition-all border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                            {expert.displayName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{expert.displayName}</p>
                            <p className="text-xs text-slate-500 capitalize">{expert.role?.toLowerCase() || 'Expert'}</p>
                          </div>
                        </div>
                        <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </a>
                    ))}
                    <a
                      href={`${process.env.NEXT_PUBLIC_CRM_URL || 'https://crm.vyntrise.com'}/book`}
                      className="block w-full text-center mt-2 py-2 px-3 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      Let Us Match You
                    </a>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                      Schedule a free 30-minute discovery call with our team to discuss your goals and find the right expert for your project.
                    </p>
                    <a
                      href="mailto:hello@vyntrise.com?subject=Book%20a%20Discovery%20Call"
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg text-xs font-semibold text-white transition-colors"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-h)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Book a Discovery Call
                    </a>
                  </div>
                )}
              </motion.div>

              {/* Address */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="rounded-2xl p-6 shadow-sm"
                style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-subtle)' }}>Office address</p>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <MapPin className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text)' }}>VyntRise LLC</p>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
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
                className="rounded-2xl p-5"
                style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-subtle)' }}>Business hours</p>
                <div className="space-y-2">
                  {[
                    { day: 'Mon – Fri', hours: '9:00 AM – 6:00 PM EST' },
                    { day: 'Saturday', hours: '10:00 AM – 4:00 PM EST' },
                    { day: 'Sunday', hours: 'Closed' },
                  ].map((r) => (
                    <div key={r.day} className="flex justify-between text-xs">
                      <span style={{ color: 'var(--color-text-muted)' }}>{r.day}</span>
                      <span className={`font-semibold`} style={{ color: r.hours === 'Closed' ? 'var(--color-text-subtle)' : 'var(--color-text)' }}>{r.hours}</span>
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
