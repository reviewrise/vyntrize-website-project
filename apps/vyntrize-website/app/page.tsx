'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight, Search, Bot, Code, Database,
  ShieldCheck, Star, CheckCircle2, X, Check,
  TrendingUp, Clock, Zap, ChevronRight,
  BarChart3, Users, Globe, Layers,
} from 'lucide-react';
import Hero from '@/components/Hero';

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */

/* const logos = [
  { name: 'Acme Corp',  abbr: 'AC' },
  { name: 'NovaTech',   abbr: 'NT' },
  { name: 'Meridian',   abbr: 'ME' },
  { name: 'Stackflow',  abbr: 'SF' },
  { name: 'Orbis',      abbr: 'OR' },
  { name: 'Luminary',   abbr: 'LU' },
  { name: 'Crestline',  abbr: 'CR' },
  { name: 'Vantage',    abbr: 'VA' },
  { name: 'Pinnacle',   abbr: 'PI' },
  { name: 'Solaris',    abbr: 'SO' },
]; */

const steps = [
  {
    n: '01',
    icon: Layers,
    color: 'blue',
    title: 'Connect your stack',
    body: 'Link your CRM, review platforms, and data sources in minutes. 500+ native integrations, zero engineering required.',
  },
  {
    n: '02',
    icon: Bot,
    color: 'violet',
    title: 'Deploy AI agents',
    body: 'Autonomous agents go live across reputation, leads, and workflows — trained on your business data from day one.',
  },
  {
    n: '03',
    icon: TrendingUp,
    color: 'emerald',
    title: 'Watch results compound',
    body: 'Real-time dashboards track every outcome. Most clients see measurable growth within the first 30 days.',
  },
];

const services = [
  {
    id: 'ai-search',
    label: 'AI Search & Reputation',
    icon: Search,
    headline: 'Dominate search. Build unbreakable trust.',
    body: 'AI-powered SEO and centralized reputation management that ensures customers find you and choose you — across every platform.',
    points: ['AI-driven local & organic SEO', 'Review centralization across all platforms', 'Intelligent profile & response management', 'Insight-driven reputation audits'],
    stat: { value: '250%', label: 'avg. traffic increase' },
    href: '/services/ai-search',
    color: 'blue',
    visual: [
      { label: 'Google ranking', before: 18, after: 3, unit: '#' },
      { label: 'Review score', before: 38, after: 47, unit: '★', scale: 10 },
      { label: 'Monthly visits', before: 420, after: 1470, unit: '' },
    ],
  },
  {
    id: 'automation',
    label: 'Intelligent Automation',
    icon: Bot,
    headline: 'Tools that think, decide, and act.',
    body: 'Autonomous agents and multi-agent workflows that perceive context, make decisions, and execute tasks end-to-end.',
    points: ['Autonomous lead & sales agents', 'Internal knowledge brains (RAG)', 'Multi-agent workflow orchestration', 'Intelligent process automation'],
    stat: { value: '20+ hrs', label: 'saved per team per week' },
    href: '/services/intelligent-automation',
    color: 'violet',
    visual: [
      { label: 'Leads followed up', before: 12, after: 100, unit: '%' },
      { label: 'Hours saved / wk', before: 0, after: 22, unit: 'h' },
      { label: 'Response time', before: 240, after: 2, unit: 'min' },
    ],
  },
  {
    id: 'custom-software',
    label: 'Custom Software',
    icon: Code,
    headline: 'Built for your exact workflow.',
    body: 'Bespoke web applications and AI integrations engineered around your unique business logic — not the other way around.',
    points: ['Bespoke AI implementation & integration', 'Niche e-commerce & booking platforms', 'Mini-ERP & operations tools', 'Legacy-to-cloud migration'],
    stat: { value: '95%', label: 'on-time delivery rate' },
    href: '/services/custom-software',
    color: 'emerald',
    visual: [
      { label: 'On-time delivery', before: 60, after: 95, unit: '%' },
      { label: 'Manual steps cut', before: 0, after: 80, unit: '%' },
      { label: 'Deploy time', before: 14, after: 3, unit: 'd' },
    ],
  },
  {
    id: 'data',
    label: 'Data & Analytics',
    icon: Database,
    headline: 'Chaos to clarity.',
    body: 'Organize, connect, and activate your scattered data — transforming it from a liability into a clear, actionable source of truth.',
    points: ['Spreadsheet-to-database migration', 'Universal data connector & sync', 'Data cleansing & governance', 'Real-time analytics dashboards'],
    stat: { value: '10x', label: 'faster reporting' },
    href: '/services/data-architecture',
    color: 'amber',
    visual: [
      { label: 'Report time', before: 480, after: 45, unit: 'min' },
      { label: 'Data sources', before: 1, after: 12, unit: '' },
      { label: 'Accuracy', before: 71, after: 99, unit: '%' },
    ],
  },
];



const comparisons = [
  { label: 'Results in < 30 days', us: true },
  { label: 'Outcome-based pricing', us: true },
  { label: 'Explainable AI systems', us: true },
  { label: 'Dedicated success manager', us: true },
  { label: 'SOC 2 / HIPAA compliant', us: true },
  { label: 'Lock-in annual contracts', us: false },
  { label: 'Black-box automation', us: false },
  { label: 'Months-long onboarding', us: false },
];

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
  violet: 'bg-violet-50 text-violet-600 border-violet-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
};

const tabAccent: Record<string, string> = {
  blue: 'border-blue-600 text-blue-600',
  violet: 'border-violet-600 text-violet-600',
  emerald: 'border-emerald-600 text-emerald-600',
  amber: 'border-amber-600 text-amber-600',
};

const stepColor: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
  violet: 'bg-violet-50 text-violet-600 border-violet-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
};

const barColor: Record<string, string> = {
  blue: 'bg-blue-500',
  violet: 'bg-violet-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
};

/* ─────────────────────────────────────────
   SERVICE VISUAL — before/after bars
───────────────────────────────────────── */
function ServiceVisual({ service }: { service: typeof services[0] }) {
  return (
    <div className="rounded-2xl shadow-sm p-7 flex flex-col gap-5" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-subtle)' }}>Before → After</p>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${colorMap[service.color]}`}>
          {service.stat.value} {service.stat.label}
        </span>
      </div>
      {service.visual.map((row) => {
        const maxVal = Math.max(row.before, row.after);
        const beforePct = Math.round((row.before / maxVal) * 100);
        const afterPct = 100;
        return (
          <div key={row.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{row.label}</span>
              <span className={`text-xs font-bold ${barColor[service.color].replace('bg-', 'text-')}`}>
                {row.after}{row.unit}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] w-10 shrink-0" style={{ color: 'var(--color-text-subtle)' }}>Before</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-surface)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${beforePct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: 'var(--color-border)' }}
                  />
                </div>
                <span className="text-[10px] w-10 text-right shrink-0" style={{ color: 'var(--color-text-subtle)' }}>{row.before}{row.unit}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] w-10 shrink-0" style={{ color: 'var(--color-text-subtle)' }}>After</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-surface)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${afterPct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className={`h-full rounded-full ${barColor[service.color]}`}
                  />
                </div>
                <span className={`text-[10px] font-bold w-10 text-right shrink-0 ${barColor[service.color].replace('bg-', 'text-')}`}>
                  {row.after}{row.unit}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────
   PAGE
───────────────────────────────────────── */
export default function Home() {
  const [activeService, setActiveService] = useState(services[0].id);
  const current = services.find(s => s.id === activeService)!;
  const CIcon = current.icon;
  {/* Vyntrise — Agent Ops booking chatbot */ }


  return (

    <div className="flex flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* ── 1. Hero ── */}
      <Hero />

      {/* ── 2. Client Showcase ── */}
      <section className="py-16 border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <div className="container mx-auto max-w-6xl px-4 md:px-6">
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-subtle)' }}>Real clients. Real results.</p>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Local businesses growing with VyntRise AI agents.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                name: 'Habesha Food', initials: 'HF', color: '#10b981',
                bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)',
                industry: 'Food & Hospitality',
                metric: '+1.4★', metricLabel: 'review rating lift',
                result: 'AI reputation management and local SEO driving consistent new customers.',
              },
              {
                name: 'Liya Cookies', initials: 'LC', color: '#f43f5e',
                bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.2)',
                industry: 'E-commerce & Bakery',
                metric: '100%', metricLabel: 'review response rate',
                result: 'Autonomous review agents maintaining customer trust around the clock.',
              },
              {
                name: 'Nazaret Market', initials: 'NM', color: '#f59e0b',
                bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)',
                industry: 'Local Retail',
                metric: '24/7', metricLabel: 'AI agent coverage',
                result: 'Fully automated lead qualification and customer routing with zero manual effort.',
              },
            ].map((client, i) => (
              <motion.div
                key={client.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className="rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all"
                style={{ border: `1px solid ${client.border}`, backgroundColor: 'var(--color-bg)' }}
              >
                {/* Client identity */}
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                    style={{ backgroundColor: client.color }}
                  >
                    {client.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{client.name}</p>
                    <p className="text-[11px] font-medium" style={{ color: 'var(--color-text-subtle)' }}>{client.industry}</p>
                  </div>
                </div>
                {/* Metric highlight */}
                <div className="rounded-xl px-4 py-3.5" style={{ backgroundColor: client.bg, border: `1px solid ${client.border}` }}>
                  <p className="text-2xl font-extrabold font-mono leading-none" style={{ color: client.color }}>{client.metric}</p>
                  <p className="text-[11px] font-semibold mt-1" style={{ color: client.color, opacity: 0.7 }}>{client.metricLabel}</p>
                </div>
                {/* Result description */}
                <p className="text-xs leading-relaxed flex-1" style={{ color: 'var(--color-text-muted)' }}>{client.result}</p>
                {/* Live badge */}
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ backgroundColor: client.color }} />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: client.color }} />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: client.color, opacity: 0.7 }}>Active</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. How it works ── */}
      <section className="px-4 md:px-6 py-24" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="github-badge mb-4">HOW IT WORKS</div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4" style={{ color: 'var(--color-text)' }}>
              Up and running in days, not months
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--color-text-muted)' }}>
              No long onboarding. No engineering team required. Just results.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-blue-200 via-violet-200 to-emerald-200 dark:from-blue-900 dark:via-violet-900 dark:to-emerald-900" />

            {steps.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative flex flex-col gap-5 rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow"
                style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}
              >
                <div className="flex items-center justify-between">
                  <div className={`h-10 w-10 rounded-xl border flex items-center justify-center ${stepColor[step.color]}`}>
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="text-3xl font-black font-mono" style={{ color: 'var(--color-border)' }}>{step.n}</span>
                </div>
                <div>
                  <h3 className="text-base font-bold mb-2" style={{ color: 'var(--color-text)' }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{step.body}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <a
              href={`${process.env.NEXT_PUBLIC_CRM_URL || 'http://localhost:3014'}/book`}
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold text-white transition-colors shadow-md"
              style={{ backgroundColor: 'var(--color-primary)' }}
              onMouseEnter={(e) => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--color-primary-h)'}
              onMouseLeave={(e) => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--color-primary)'}
            >
              Book a free consultation <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ── 4. Bento feature grid ── */}
      <section className="px-4 md:px-6 py-24" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <div className="github-badge mb-4">PLATFORM</div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4" style={{ color: 'var(--color-text)' }}>
              Everything your business needs to scale
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--color-text-muted)' }}>
              One platform. Five service lines. Measurable outcomes from day one.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[180px]">

            {/* Large: AI Agents */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="col-span-2 row-span-2 rounded-2xl shadow-sm p-7 flex flex-col justify-between group hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all overflow-hidden"
              style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}
            >
              <div>
                <div className="h-11 w-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-5">
                  <Bot className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Autonomous AI Agents</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>Deploy agents that engage leads, answer questions, and complete workflows — without human intervention.</p>
              </div>
              {/* Live capability feed */}
              <div className="mt-4 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(99,102,241,0.15)', backgroundColor: '#0f172a' }}>
                <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500">Agent capabilities</span>
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400 font-bold">LIVE 24/7</span>
                  </div>
                </div>
                <div className="flex flex-col divide-y" style={{ ['--tw-divide-color']: 'rgba(255,255,255,0.04)' } as any}>
                  {[
                    { label: 'Instant lead qualification & routing',    color: 'bg-blue-500/20 text-blue-300',    dot: '#60a5fa' },
                    { label: 'Autonomous review responses',              color: 'bg-violet-500/20 text-violet-300', dot: '#a78bfa' },
                    { label: 'Automated search citation updates',        color: 'bg-emerald-500/20 text-emerald-300', dot: '#34d399' },
                    { label: 'CRM & data pipeline synchronization',     color: 'bg-amber-500/20 text-amber-300',  dot: '#fbbf24' },
                  ].map((cap, idx) => (
                    <div key={idx} className="flex items-center gap-3 px-4 py-2.5" style={{ borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <span className="relative flex h-1.5 w-1.5 shrink-0">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50" style={{ backgroundColor: cap.dot, animationDelay: `${idx * 0.4}s` }} />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cap.dot }} />
                      </span>
                      <span className="text-[11px] text-slate-300 flex-1">{cap.label}</span>
                      <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Small: reputation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
              className="col-span-1 rounded-2xl shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all"
              style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}
            >
              <div className="h-9 w-9 rounded-lg bg-violet-50 dark:bg-violet-900/30 border border-violet-100 dark:border-violet-800 flex items-center justify-center text-violet-600">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-subtle)' }}>Avg. reputation lift</p>
                <p className="text-3xl font-extrabold" style={{ color: 'var(--color-text)' }}>+1.2★</p>
              </div>
            </motion.div>

            {/* Small: time to value */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15 }}
              className="col-span-1 rounded-2xl shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all"
              style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}
            >
              <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center text-emerald-600">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-subtle)' }}>First results in</p>
                <p className="text-2xl font-extrabold" style={{ color: 'var(--color-text)' }}>&lt; 30 days</p>
              </div>
            </motion.div>

            {/* Wide: integrations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}
              className="col-span-2 rounded-2xl shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all"
              style={{ border: '1px solid var(--color-border)', backgroundColor: '#0f172a' }}
            >
              <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center text-white">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h3 className="font-bold text-white mb-1">Enterprise-grade security</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">SOC 2, GDPR, CCPA, and HIPAA compliant by default.</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {['SOC 2', 'GDPR', 'HIPAA'].map(b => (
                    <span key={b} className="text-[9px] font-bold rounded-md bg-white/10 border border-white/10 px-2 py-1 text-slate-300">{b}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 5. Services tabs ── */}
      <section className="px-4 md:px-6 py-24" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <div className="github-badge mb-4">SERVICES</div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4" style={{ color: 'var(--color-text)' }}>
              Five ways we grow your business
            </h2>
          </div>

          {/* Tab bar */}
          <div className="flex gap-0 overflow-x-auto pb-px mb-10" style={{ borderBottom: '1px solid var(--color-border)' }}>
            {services.map((s) => {
              const SIcon = s.icon;
              const isActive = s.id === activeService;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveService(s.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-all ${isActive ? `${tabAccent[s.color]}` : 'border-transparent'}`}
                  style={{ color: isActive ? undefined : 'var(--color-text-muted)' }}
                  onMouseEnter={(e) => !isActive && (e.currentTarget.style.color = 'var(--color-text)')}
                  onMouseLeave={(e) => !isActive && (e.currentTarget.style.color = 'var(--color-text-muted)')}
                >
                  <SIcon className="h-4 w-4" />
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeService}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="grid lg:grid-cols-2 gap-12 items-start"
            >
              {/* Copy */}
              <div>
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold mb-5 ${colorMap[current.color]}`}>
                  <CIcon className="h-3.5 w-3.5" />
                  {current.label}
                </div>
                <h3 className="text-2xl md:text-3xl font-extrabold mb-4 leading-tight" style={{ color: 'var(--color-text)' }}>{current.headline}</h3>
                <p className="leading-relaxed mb-6" style={{ color: 'var(--color-text-muted)' }}>{current.body}</p>
                <ul className="space-y-2.5 mb-8">
                  {current.points.map(p => (
                    <li key={p} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--color-text)' }}>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
                <Link
                  href={current.href}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-h)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
                >
                  Explore {current.label} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Before/after visual */}
              <ServiceVisual service={current} />
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ── 6. Testimonials — removed, using real work showcase instead ── */}

      {/* ── 7. Featured work ── */}
      <section className="px-4 md:px-6 py-20" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-end justify-between gap-4 mb-10">
            <div>
              <div className="github-badge mb-3">OUR WORK & RESULTS</div>
              <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: 'var(--color-text)' }}>
                Work we&apos;re proud of: AI Agents for Reviews & Reputation
              </h2>
            </div>
            <Link href="/work" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold shrink-0 transition-colors" style={{ color: 'var(--color-primary)' }}>
              View all work <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="max-w-4xl">
            {[
              {
                slug: 'vyntrise-agent',
                client: 'VyntRise Agent Platform',
                service: 'Full-Stack SaaS Product',
                tagline: 'AI-Powered Business Automation Platform with review response agents, calendar-aware scheduling, and lead qualification.',
                image: '/images/work/vyntrise-agent/dashboard.png',
                color: 'bg-violet-600',
                initials: 'VR',
              },
            ].map((item, i) => (
              <motion.div
                key={item.client}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Link
                  href={`/work/${item.slug}`}
                  className="group flex flex-col md:flex-row rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}
                >
                  {/* Image */}
                  <div className="relative md:w-3/5 h-64 md:h-auto min-h-[300px] overflow-hidden" style={{ backgroundColor: 'var(--color-raised)' }}>
                    <Image
                      src={item.image}
                      alt={`${item.client} - VyntRise AI Reputation Agent`}
                      fill
                      sizes="(max-width: 768px) 100vw, 60vw"
                      className="object-cover object-left-top transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/40 to-transparent md:hidden" />
                  </div>
                  {/* Body */}
                  <div className="p-6 md:p-8 flex flex-col flex-1 justify-center border-t md:border-t-0 md:border-l" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`h-8 w-8 rounded-lg ${item.color} flex items-center justify-center text-white text-[10px] font-bold shadow-sm`}>
                        {item.initials}
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>{item.service}</p>
                    </div>
                    <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>{item.client}</h3>
                    <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--color-text-muted)' }}>{item.tagline}</p>
                    <div className="flex items-center gap-2 mt-auto">
                      <span className="text-sm font-semibold flex items-center gap-1.5 group-hover:gap-2 transition-all" style={{ color: 'var(--color-text)' }}>
                        Read case study <ArrowRight className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link href="/work" className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
              View all work <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 8. Why VyntRise comparison ── */}
      <section className="px-4 md:px-6 py-24" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <div className="github-badge mb-4">WHY VYNTRISE</div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: 'var(--color-text)' }}>Built different</h2>
            <p className="max-w-md mx-auto text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Most agencies sell retainers. We sell outcomes.
            </p>
          </div>

          <div className="rounded-2xl shadow-sm overflow-hidden" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
            {/* Header */}
            <div className="grid grid-cols-[1fr_140px_140px] px-6 py-3.5" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-subtle)' }}>What you get</span>
              <div className="flex items-center justify-center gap-1.5">
                <div className="h-4 w-4 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
                  <Zap className="h-2.5 w-2.5 text-white" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>VyntRise</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-center" style={{ color: 'var(--color-text-subtle)' }}>Typical Agency</span>
            </div>

            {comparisons.map((row, i) => (
              <motion.div
                key={row.label}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className={`grid grid-cols-[1fr_140px_140px] px-6 py-3.5 items-center last:border-0`}
                style={{ 
                  borderBottom: '1px solid var(--color-border-muted)',
                  backgroundColor: i % 2 === 0 ? 'var(--color-bg)' : 'var(--color-surface)'
                }}
              >
                <span className="text-sm" style={{ color: 'var(--color-text)' }}>{row.label}</span>
                {/* VyntRise column — highlighted */}
                <div className="flex justify-center">
                  {row.us
                    ? <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500"><Check className="h-3.5 w-3.5 text-white" /></span>
                    : <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--color-surface)' }}><X className="h-3.5 w-3.5" style={{ color: 'var(--color-text-subtle)' }} /></span>
                  }
                </div>
                {/* Agency column */}
                <div className="flex justify-center">
                  {!row.us
                    ? <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100"><Check className="h-3.5 w-3.5 text-emerald-600" /></span>
                    : <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--color-surface)' }}><X className="h-3.5 w-3.5" style={{ color: 'var(--color-text-subtle)' }} /></span>
                  }
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. Final CTA ── */}
      <section className="relative overflow-hidden bg-slate-900 px-4 md:px-6 py-28">
        {/* Gradient accent — Stripe style */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[400px] w-[700px] rounded-full bg-blue-600/15 blur-[80px]" />
          <div className="absolute left-1/4 bottom-0 h-[300px] w-[500px] rounded-full bg-violet-600/10 blur-[80px]" />
        </div>

        <div className="relative container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 mb-8">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold text-slate-300">14-day free trial · No credit card</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6 tracking-tight">
            Ready to put VyntRise AI agents to work?
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Built for small businesses that are ready to grow. Start free and see results in your first 30 days.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={`${process.env.NEXT_PUBLIC_CRM_URL || 'http://localhost:3014'}/book`}
              className="group inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-sm font-bold text-white hover:bg-blue-500 transition-colors shadow-xl shadow-blue-900/40"
            >
              Book a consultation
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-8 py-4 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Explore services <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Trust row */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            {['SOC 2 certified', 'GDPR compliant', '99.9% uptime SLA', 'Cancel anytime'].map(t => (
              <div key={t} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
