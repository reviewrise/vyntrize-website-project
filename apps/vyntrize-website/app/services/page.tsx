'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight, Search, Bot, Code, Database, Sparkles,
  ChevronRight, TrendingUp, Zap, Shield, Users, Mail,
  CheckCircle2, Settings, Activity,
} from 'lucide-react';

const services = [
  {
    id: 'ai-search',
    badge: 'AISO · 01',
    label: 'AI Search & Reputation',
    href: '/services/ai-search',
    icon: Search,
    color: 'blue',
    tagline: 'Dominate search. Build trust.',
    description: 'AI-powered SEO and centralized reputation management that ensures customers find you and choose you — across every platform.',
    capabilities: ['AI-Driven Local & Organic SEO', 'Review Centralization', 'Intelligent Profile Management', 'Reputation Audits'],
    outcomes: [
      { label: 'Avg. traffic increase', value: '250%', icon: TrendingUp },
      { label: 'Avg. review rating', value: '4.7★', icon: Activity },
      { label: 'Review response rate', value: '98%', icon: CheckCircle2 },
    ],
    before: [
      { label: 'Google ranking', from: '#18', to: '#3' },
      { label: 'Review score', from: '3.8★', to: '4.7★' },
      { label: 'Monthly visits', from: '420', to: '1,470' },
    ],
    testimonial: { quote: '250% traffic increase in 3 months. Review rating went from 3.8 to 4.7 stars.', name: 'Sarah M.', role: 'Martinez Dental Group' },
  },
  {
    id: 'intelligent-automation',
    badge: 'AUTO · 02',
    label: 'Intelligent Automation',
    href: '/services/intelligent-automation',
    icon: Bot,
    color: 'violet',
    tagline: 'Tools that think, decide, and act.',
    description: 'Autonomous agents and multi-agent workflows that perceive context, make decisions, and execute tasks end-to-end — without human intervention.',
    capabilities: ['Autonomous Lead & Sales Agents', 'Knowledge Brains (RAG)', 'Multi-Agent Orchestration', 'Intelligent Process Automation'],
    outcomes: [
      { label: 'Hours saved / week', value: '20+', icon: Zap },
      { label: 'Agent accuracy rate', value: '99.9%', icon: Shield },
      { label: 'Integrations', value: '500+', icon: Settings },
    ],
    before: [
      { label: 'Lead response time', from: '4 hrs', to: '< 2 min' },
      { label: 'Manual tasks / week', from: '40+', to: '~3' },
      { label: 'Conversion rate', from: 'baseline', to: '+40%' },
    ],
    testimonial: { quote: 'The AI agents handle our lead follow-up 24/7. Conversion rate up 40% since we launched.', name: 'Priya N.', role: 'VP Sales, Crestline SaaS' },
  },
  {
    id: 'custom-software',
    badge: 'DEV · 03',
    label: 'Custom Software',
    href: '/services/custom-software',
    icon: Code,
    color: 'emerald',
    tagline: 'Built for your exact workflow.',
    description: 'Bespoke web applications and AI integrations engineered around your unique business logic — not the other way around.',
    capabilities: ['Bespoke AI Implementation', 'Niche E-commerce Platforms', 'Mini-ERP & Ops Tools', 'Legacy-to-Cloud Migration'],
    outcomes: [
      { label: 'Projects delivered', value: '100+', icon: Code },
      { label: 'On-time delivery', value: '95%', icon: CheckCircle2 },
      { label: 'Client satisfaction', value: '4.9/5', icon: Activity },
    ],
    before: [
      { label: 'Deploy time', from: '14 days', to: '3 days' },
      { label: 'Manual steps', from: '100%', to: '20%' },
      { label: 'On-time delivery', from: '60%', to: '95%' },
    ],
    testimonial: { quote: 'Delivered exactly what we needed, on time and within budget. Exceptional team.', name: 'Emily R.', role: 'CEO, GrowthHub Agency' },
  },
  {
    id: 'data-architecture',
    badge: 'DATA · 04',
    label: 'Data & Analytics',
    href: '/services/data-architecture',
    icon: Database,
    color: 'amber',
    tagline: 'Chaos to clarity.',
    description: 'Organize, connect, and activate your scattered data — transforming it from a liability into a clear, actionable source of truth.',
    capabilities: ['Spreadsheet-to-Database Migration', 'Universal Data Connector', 'Data Cleansing & Governance', 'Real-Time Analytics Dashboards'],
    outcomes: [
      { label: 'Data accuracy', value: '100%', icon: Shield },
      { label: 'Reporting speed', value: '10x', icon: TrendingUp },
      { label: 'Manual silos eliminated', value: '0', icon: Database },
    ],
    before: [
      { label: 'Report time', from: '8 hrs', to: '45 min' },
      { label: 'Data sources unified', from: '1', to: '12' },
      { label: 'Accuracy', from: '71%', to: '100%' },
    ],
    testimonial: { quote: 'Our data was a mess across 6 tools. VyntRise unified everything in under 3 weeks.', name: 'James O.', role: 'COO, Meridian Logistics' },
  },
  {
    id: 'digital-marketing',
    badge: 'MKT · 05',
    label: 'Digital Marketing',
    href: '/services/digital-marketing',
    icon: Sparkles,
    color: 'rose',
    tagline: 'Human creativity, AI scale.',
    description: 'A hybrid model where authentic human expertise meets AI efficiency — real connection at scale, without losing the human touch.',
    capabilities: ['Authentic Video Service', 'Community Management', 'Hybrid Email Strategy', 'Strategic Content & SEO'],
    outcomes: [
      { label: 'Engagement rate', value: '5x', icon: TrendingUp },
      { label: 'Email open rate', value: '42%', icon: Mail },
      { label: 'Community growth', value: '3x', icon: Users },
    ],
    before: [
      { label: 'Email open rate', from: '21%', to: '42%' },
      { label: 'Engagement rate', from: '1x', to: '5x' },
      { label: 'Content output', from: '2/mo', to: '20/mo' },
    ],
    testimonial: { quote: 'The automation tools saved our team 20+ hours per week. We focus on strategy now.', name: 'Michael C.', role: 'CTO, TechStart Solutions' },
  },
];

const colorIcon: Record<string, string> = {
  blue:    'bg-blue-50 text-blue-600 border-blue-100',
  violet:  'bg-violet-50 text-violet-600 border-violet-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  amber:   'bg-amber-50 text-amber-600 border-amber-100',
  rose:    'bg-rose-50 text-rose-600 border-rose-100',
};

const colorText: Record<string, string> = {
  blue:    'text-blue-600',
  violet:  'text-violet-600',
  emerald: 'text-emerald-600',
  amber:   'text-amber-600',
  rose:    'text-rose-600',
};

const colorBar: Record<string, string> = {
  blue:    'bg-blue-500',
  violet:  'bg-violet-500',
  emerald: 'bg-emerald-500',
  amber:   'bg-amber-500',
  rose:    'bg-rose-500',
};

export default function Services() {
  const [active, setActive] = useState(services[0].id);
  const current = services.find(s => s.id === active)!;
  const Icon = current.icon;

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0d1117]">

      {/* Page header */}
      <section className="border-b border-slate-100 dark:border-[#21262d] bg-slate-50/40 dark:bg-[#161b22] pt-20 pb-12 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="github-badge mb-4">SERVICES</div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4 leading-tight">
            What we build for you
          </h1>
          <p className="text-lg text-slate-500 dark:text-[#8b949e] max-w-xl">
            Five focused service lines. Each one a precision instrument for a specific growth problem.
          </p>
        </div>
      </section>

      {/* Dashboard layout */}
      <section className="flex-1 px-4 md:px-6 py-10">
        <div className="container mx-auto max-w-6xl flex flex-col lg:flex-row gap-6">

          {/* Sidebar */}
          <nav className="lg:w-60 shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-[#8b949e] mb-3 px-1">Services</p>
            <ul className="space-y-1">
              {services.map(s => {
                const SIcon = s.icon;
                const isActive = s.id === active;
                return (
                  <li key={s.id}>
                    <button onClick={() => setActive(s.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                        isActive ? 'bg-slate-900 dark:bg-[#4B6CF7] text-white shadow-sm' : 'text-slate-600 dark:text-[#8b949e] hover:bg-slate-100 dark:hover:bg-[#161b22] hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <SIcon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{s.label}</span>
                      {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-50 shrink-0" />}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-8 rounded-xl border border-slate-200 dark:border-[#21262d] bg-white dark:bg-[#161b22] p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-800 dark:text-white mb-1">Not sure where to start?</p>
              <p className="text-xs text-slate-500 dark:text-[#8b949e] mb-3 leading-relaxed">We&apos;ll map the right services to your goals in a free 30-min call.</p>
              <Link href="/contact" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                Talk to us <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </nav>

          {/* Main panel */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease: 'easeOut' }} className="space-y-4">

                {/* Header card */}
                <div className="rounded-2xl border border-slate-200 dark:border-[#21262d] bg-white dark:bg-[#161b22] p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-xl border flex items-center justify-center shrink-0 ${colorIcon[current.color]}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-[#8b949e] uppercase mb-0.5">{current.badge}</p>
                        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{current.label}</h2>
                        <p className={`text-sm font-medium mt-0.5 ${colorText[current.color]}`}>{current.tagline}</p>
                      </div>
                    </div>
                    <Link href={current.href} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-[#4B6CF7] px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 dark:hover:bg-[#3d5ce0] transition-colors shrink-0">
                      Full details <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-[#8b949e] leading-relaxed">{current.description}</p>
                </div>

                {/* Outcomes row */}
                <div className="grid grid-cols-3 gap-3">
                  {current.outcomes.map(o => {
                    const OIcon = o.icon;
                    return (
                      <div key={o.label} className="rounded-xl border border-slate-200 dark:border-[#21262d] bg-white dark:bg-[#161b22] p-4 shadow-sm">
                        <OIcon className={`h-4 w-4 mb-2 ${colorText[current.color]}`} />
                        <p className={`text-2xl font-extrabold ${colorText[current.color]}`}>{o.value}</p>
                        <p className="text-[11px] text-slate-400 dark:text-[#8b949e] mt-0.5 leading-tight">{o.label}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Capabilities + Before/After */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 dark:border-[#21262d] bg-white dark:bg-[#161b22] p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-[#8b949e] mb-4">Capabilities</p>
                    <ul className="space-y-2.5">
                      {current.capabilities.map(c => (
                        <li key={c} className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-[#e6edf3]">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />{c}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-[#21262d] bg-white dark:bg-[#161b22] p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-[#8b949e] mb-4">Before → After</p>
                    <div className="space-y-3">
                      {current.before.map(b => (
                        <div key={b.label} className="flex items-center justify-between text-sm">
                          <span className="text-slate-500 dark:text-[#8b949e] text-xs">{b.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-xs line-through">{b.from}</span>
                            <ChevronRight className="h-3 w-3 text-slate-300 dark:text-[#30363d]" />
                            <span className={`text-xs font-bold ${colorText[current.color]}`}>{b.to}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Testimonial */}
                <div className="rounded-xl border border-slate-200 dark:border-[#21262d] bg-slate-50/60 dark:bg-[#161b22] p-5 flex items-start gap-4">
                  <div className={`h-9 w-9 rounded-full ${colorBar[current.color]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {current.testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm text-slate-700 dark:text-[#e6edf3] leading-relaxed mb-1.5">&ldquo;{current.testimonial.quote}&rdquo;</p>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">{current.testimonial.name}</p>
                    <p className="text-[11px] text-slate-400 dark:text-[#8b949e]">{current.testimonial.role}</p>
                  </div>
                </div>

                {/* CTA */}
                <div className="rounded-xl border border-slate-200 dark:border-[#21262d] bg-white dark:bg-[#161b22] p-5 flex items-center justify-between gap-4 flex-wrap shadow-sm">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Ready to get started with {current.label}?</p>
                    <p className="text-xs text-slate-500 dark:text-[#8b949e] mt-0.5">No commitment — let&apos;s talk about your goals first.</p>
                  </div>
                  <div className="flex gap-2.5 shrink-0">
                    <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-[#4B6CF7] px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 dark:hover:bg-[#3d5ce0] transition-colors">
                      Get started <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link href={current.href} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-[#21262d] bg-white dark:bg-[#0d1117] px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-[#e6edf3] hover:bg-slate-50 dark:hover:bg-[#161b22] transition-colors">
                      Learn more
                    </Link>
                  </div>
                </div>

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

    </div>
  );
}
