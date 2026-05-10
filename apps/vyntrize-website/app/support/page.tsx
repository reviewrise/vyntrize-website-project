'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import {
  MessageCircle, Mail, Phone, BookOpen, ArrowRight,
  CheckCircle2, Clock, Zap, LifeBuoy, FileText, Bot,
  ExternalLink, ChevronRight,
} from 'lucide-react';

const channels = [
  {
    icon: MessageCircle,
    color: 'blue',
    title: 'Live chat',
    desc: 'Chat with our team in real time. Available 24/7 for Professional and Enterprise customers.',
    cta: 'Start chat',
    href: '/contact',
    badge: 'Fastest',
  },
  {
    icon: Mail,
    color: 'violet',
    title: 'Email support',
    desc: 'Send us a detailed message and we\'ll respond within 24 hours (1 hour for priority plans).',
    cta: 'Send email',
    href: '/contact',
    badge: null,
  },
  {
    icon: Phone,
    color: 'emerald',
    title: 'Phone & video',
    desc: 'Schedule a call with your dedicated account manager. Available on Enterprise plans.',
    cta: 'Book a call',
    href: '/contact',
    badge: 'Enterprise',
  },
];

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  violet: 'bg-violet-50 text-violet-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
};

const resources = [
  {
    icon: BookOpen,
    title: 'Documentation',
    desc: 'Step-by-step guides for every feature.',
    href: '#',
  },
  {
    icon: Bot,
    title: 'AI Knowledge Base',
    desc: 'Ask our AI assistant anything about VyntRise.',
    href: '#',
  },
  {
    icon: FileText,
    title: 'API Reference',
    desc: 'Full REST API docs with code examples.',
    href: '#',
  },
  {
    icon: Zap,
    title: 'Quick-start guides',
    desc: 'Get up and running in under 30 minutes.',
    href: '#',
  },
];

const statusItems = [
  { label: 'API', status: 'operational' },
  { label: 'Dashboard', status: 'operational' },
  { label: 'Automation engine', status: 'operational' },
  { label: 'AI agents', status: 'operational' },
  { label: 'Integrations', status: 'operational' },
];

const popularTopics = [
  { label: 'How to set up your first workflow', href: '/faq#automation' },
  { label: 'Connecting your Google Business Profile', href: '/faq#general' },
  { label: 'Billing and plan changes', href: '/faq#billing' },
  { label: 'Data export and account deletion', href: '/faq#technical' },
  { label: 'HIPAA & SOC 2 compliance docs', href: '/faq#security' },
  { label: 'API authentication & rate limits', href: '/faq#technical' },
];

const slaTable = [
  { plan: 'Starter', channel: 'Email', time: '< 24 hours', hours: 'Business hours' },
  { plan: 'Professional', channel: 'Email + Live chat', time: '< 1 hour', hours: '24 / 7' },
  { plan: 'Enterprise', channel: 'Dedicated manager + Phone', time: '< 15 minutes', hours: '24 / 7' },
];

export default function SupportPage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>

      {/* Hero */}
      <section className="pt-20 pb-12 px-4 md:px-6" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <div className="container mx-auto max-w-6xl">
          <div className="github-badge mb-4">SUPPORT</div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight" style={{ color: 'var(--color-text)' }}>
            How can we help?
          </h1>
          <p className="text-lg max-w-xl" style={{ color: 'var(--color-text-muted)' }}>
            Find answers, reach our team, or browse resources — we&apos;re here whenever you need us.
          </p>
        </div>
      </section>

      {/* Contact channels */}
      <section className="px-4 md:px-6 py-14">
        <div className="container mx-auto max-w-6xl">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-subtle)' }}>Get in touch</p>
          <h2 className="text-2xl font-extrabold mb-8" style={{ color: 'var(--color-text)' }}>Contact our team</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {channels.map((ch, i) => (
              <motion.div
                key={ch.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                className="relative rounded-2xl p-6 shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow"
                style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}
              >
                {ch.badge && (
                  <span className={`absolute top-4 right-4 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    ch.badge === 'Fastest' ? 'bg-blue-600 text-white' : ''
                  }`} style={ch.badge !== 'Fastest' ? { backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' } : undefined}>
                    {ch.badge}
                  </span>
                )}
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${colorMap[ch.color]}`}>
                  <ch.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold mb-1" style={{ color: 'var(--color-text)' }}>{ch.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{ch.desc}</p>
                </div>
                <Link
                  href={ch.href}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {ch.cta} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* System status + SLA */}
      <section className="px-4 md:px-6 py-14" style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <div className="container mx-auto max-w-6xl grid md:grid-cols-2 gap-10">

          {/* Status */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-subtle)' }}>System status</p>
            <h2 className="text-xl font-extrabold mb-6" style={{ color: 'var(--color-text)' }}>All systems operational</h2>
            <div className="rounded-2xl shadow-sm overflow-hidden" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
              {statusItems.map((item, i) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between px-5 py-3.5`}
                  style={i < statusItems.length - 1 ? { borderBottom: '1px solid var(--color-border)' } : undefined}
                >
                  <span className="text-sm" style={{ color: 'var(--color-text)' }}>{item.label}</span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Operational
                  </span>
                </div>
              ))}
            </div>
            <a
              href="#"
              className="inline-flex items-center gap-1.5 mt-4 text-xs transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
            >
              View full status page <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* SLA table */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-subtle)' }}>Response times</p>
            <h2 className="text-xl font-extrabold mb-6" style={{ color: 'var(--color-text)' }}>Support SLA by plan</h2>
            <div className="rounded-2xl shadow-sm overflow-hidden" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
              <div className="grid grid-cols-4 px-5 py-2.5" style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                {['Plan', 'Channel', 'Response', 'Hours'].map((h) => (
                  <span key={h} className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-subtle)' }}>{h}</span>
                ))}
              </div>
              {slaTable.map((row, i) => (
                <div
                  key={row.plan}
                  className={`grid grid-cols-4 px-5 py-3.5 items-center`}
                  style={i < slaTable.length - 1 ? { borderBottom: '1px solid var(--color-border)' } : undefined}
                >
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{row.plan}</span>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{row.channel}</span>
                  <span className="text-xs font-semibold text-blue-600">{row.time}</span>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{row.hours}</span>
                </div>
              ))}
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 mt-4 text-xs transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
            >
              Compare plans <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="px-4 md:px-6 py-14" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="container mx-auto max-w-6xl">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-subtle)' }}>Self-serve</p>
          <h2 className="text-2xl font-extrabold mb-8" style={{ color: 'var(--color-text)' }}>Resources & documentation</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {resources.map((r, i) => (
              <motion.a
                key={r.title}
                href={r.href}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.07 }}
                className="group rounded-xl p-5 hover:shadow-md transition-all"
                style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
              >
                <div className="h-9 w-9 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors" style={{ backgroundColor: 'var(--color-surface)' }}>
                  <r.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                </div>
                <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--color-text)' }}>{r.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{r.desc}</p>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Popular topics */}
      <section className="px-4 md:px-6 py-14" style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-subtle)' }}>Quick answers</p>
              <h2 className="text-2xl font-extrabold" style={{ color: 'var(--color-text)' }}>Popular topics</h2>
            </div>
            <Link href="/faq" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors shrink-0">
              Browse all FAQs <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {popularTopics.map((topic) => (
              <Link
                key={topic.label}
                href={topic.href}
                className="flex items-center justify-between rounded-xl px-5 py-3.5 text-sm hover:shadow-sm transition-all group"
                style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.color = 'var(--color-text)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.color = 'var(--color-text)';
                }}
              >
                <span>{topic.label}</span>
                <ChevronRight className="h-4 w-4 transition-colors shrink-0" style={{ color: 'var(--color-text-subtle)' }} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 md:px-6 py-16 bg-slate-900">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <LifeBuoy className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white mb-2">Need hands-on help?</h2>
              <p className="text-slate-400 text-sm max-w-md">
                Our team can walk you through setup, troubleshoot issues, or help you get more out of VyntRise.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
              Contact support <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/pricing" className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
              <Clock className="h-4 w-4" /> View SLA plans
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
