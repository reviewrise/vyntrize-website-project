'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight, ChevronRight, Shield, Globe, BarChart3, Zap,
  Building2, Stethoscope, ShoppingCart, TrendingUp, CheckCircle2,
  Activity, Users, Search, Bot, Code, Database
} from 'lucide-react';

const industries = [
  {
    id: 'healthcare',
    icon: Stethoscope,
    label: 'Healthcare',
    color: 'blue',
    tagline: 'Compliant, patient-first automation.',
    description: 'Streamline patient intake, automate appointment scheduling, and build a 5-star reputation that attracts more patients — all within HIPAA-compliant guardrails.',
    challenges: ['Manual intake forms slow staff down', 'Missed reviews damage trust', 'Scheduling gaps cost revenue'],
    solutions: [
      { icon: Bot, label: 'Automated patient intake & follow-up' },
      { icon: Search, label: 'HIPAA-compliant reputation management' },
      { icon: Database, label: 'EHR data sync & reporting' },
    ],
    stats: [
      { label: 'Avg. Booking Increase', value: '40%' },
      { label: 'Review Response Rate', value: '98%' },
      { label: 'Admin Hours Saved', value: '15+/wk' },
    ],
  },
  {
    id: 'ecommerce',
    icon: ShoppingCart,
    label: 'E-commerce',
    color: 'violet',
    tagline: 'Sell smarter, support faster.',
    description: 'Enhance product discovery with AI search, automate customer support around the clock, and optimize inventory with data pipelines that keep everything in sync.',
    challenges: ['Cart abandonment from poor search', '24/7 support is expensive', 'Inventory data lives in silos'],
    solutions: [
      { icon: Search, label: 'AI-powered product search & recommendations' },
      { icon: Bot, label: '24/7 autonomous customer support agent' },
      { icon: Database, label: 'Inventory & order management sync' },
    ],
    stats: [
      { label: 'Conversion Lift', value: '28%' },
      { label: 'Support Cost Reduction', value: '60%' },
      { label: 'Inventory Accuracy', value: '99.9%' },
    ],
  },
  {
    id: 'financial',
    icon: BarChart3,
    label: 'Financial Services',
    color: 'emerald',
    tagline: 'Compliant, fast, and trusted.',
    description: 'Automate compliance reporting, streamline client onboarding, and build trust through proactive reputation management — without adding headcount.',
    challenges: ['Compliance reporting is manual & slow', 'Client onboarding takes weeks', 'Negative reviews go unanswered'],
    solutions: [
      { icon: Shield, label: 'Automated compliance & audit reporting' },
      { icon: Bot, label: 'Intelligent client onboarding workflows' },
      { icon: Search, label: 'Proactive reputation monitoring' },
    ],
    stats: [
      { label: 'Onboarding Time', value: '-70%' },
      { label: 'Compliance Coverage', value: '100%' },
      { label: 'Client Satisfaction', value: '4.9★' },
    ],
  },
  {
    id: 'realestate',
    icon: Building2,
    label: 'Real Estate',
    color: 'amber',
    tagline: 'Qualify leads. Close faster.',
    description: 'Automate lead qualification, schedule viewings instantly, and manage property listings with AI tools that work while your agents focus on closing.',
    challenges: ['Leads go cold without instant follow-up', 'Scheduling viewings is time-consuming', 'Listing data is inconsistent across platforms'],
    solutions: [
      { icon: Bot, label: 'Instant lead qualification & booking agent' },
      { icon: Code, label: 'Custom listing management platform' },
      { icon: Database, label: 'Cross-platform data sync & NAP consistency' },
    ],
    stats: [
      { label: 'Lead Response Time', value: '<2 min' },
      { label: 'Viewing Bookings', value: '+55%' },
      { label: 'Listing Accuracy', value: '100%' },
    ],
  },
];

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
  violet: 'bg-violet-50 text-violet-600 border-violet-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
};

const accentMap: Record<string, string> = {
  blue: 'bg-blue-600 hover:bg-blue-700',
  violet: 'bg-violet-600 hover:bg-violet-700',
  emerald: 'bg-emerald-600 hover:bg-emerald-700',
  amber: 'bg-amber-600 hover:bg-amber-700',
};

const barMap: Record<string, string> = {
  blue: 'bg-blue-500',
  violet: 'bg-violet-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
};

export default function SolutionsPage() {
  const [active, setActive] = useState(industries[0].id);
  const current = industries.find((i) => i.id === active)!;
  const Icon = current.icon;

  return (
    <div className="flex flex-col min-h-screen bg-white">

      {/* Header */}
      <section className="border-b border-slate-100 bg-slate-50/60 pt-20 pb-12 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="github-badge mb-4">INDUSTRY SOLUTIONS</div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
            Built for your industry
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl">
            The same AI platform, configured for the specific challenges and compliance requirements of your sector.
          </p>
        </div>
      </section>

      {/* Dashboard layout */}
      <section className="flex-1 px-4 md:px-6 py-10">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Sidebar */}
            <nav className="lg:w-64 shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 px-2">Industries</p>
              <ul className="space-y-1">
                {industries.map((ind) => {
                  const IIcon = ind.icon;
                  const isActive = ind.id === active;
                  return (
                    <li key={ind.id}>
                      <button
                        onClick={() => setActive(ind.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                      >
                        <IIcon className="h-4 w-4 shrink-0" />
                        <span className="flex-1">{ind.label}</span>
                        {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-700 mb-1">Don&apos;t see your industry?</p>
                <p className="text-xs text-slate-500 mb-3">Our solutions adapt to any sector. Let&apos;s talk.</p>
                <Link href="/contact" className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700">
                  Get a custom solution <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </nav>

            {/* Main panel */}
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="space-y-5"
                >
                  {/* Panel header */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-xl border flex items-center justify-center ${colorMap[current.color]}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-slate-900">{current.label}</h2>
                          <p className="text-sm text-slate-500 mt-0.5">{current.tagline}</p>
                        </div>
                      </div>
                      <Link
                        href="/contact"
                        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors shrink-0 ${accentMap[current.color]}`}
                      >
                        Get started <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                    <p className="mt-4 text-slate-600 text-sm leading-relaxed max-w-2xl">{current.description}</p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    {current.stats.map((s) => (
                      <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">{s.label}</p>
                        <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Challenges + Solutions */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Common Challenges</p>
                      <ul className="space-y-3">
                        {current.challenges.map((c) => (
                          <li key={c} className="flex items-start gap-3 text-sm text-slate-600">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">How We Solve It</p>
                      <ul className="space-y-3">
                        {current.solutions.map((s) => {
                          const SIcon = s.icon;
                          return (
                            <li key={s.label} className="flex items-center gap-3 text-sm text-slate-700">
                              <div className={`h-7 w-7 rounded-lg border flex items-center justify-center shrink-0 ${colorMap[current.color]}`}>
                                <SIcon className="h-3.5 w-3.5" />
                              </div>
                              {s.label}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>

                  {/* CTA strip */}
                  <div className={`rounded-xl border p-5 flex items-center justify-between gap-4 flex-wrap ${colorMap[current.color]}`}>
                    <div>
                      <p className="font-semibold text-sm">Ready to solve these challenges in {current.label}?</p>
                      <p className="text-xs opacity-70 mt-0.5">We&apos;ll map the right services to your specific situation.</p>
                    </div>
                    <Link
                      href="/contact"
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-colors shrink-0"
                    >
                      Talk to us <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* All industries quick grid */}
      <section className="border-t border-slate-100 bg-slate-50/60 px-4 md:px-6 py-16">
        <div className="container mx-auto max-w-6xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6">All Industries</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {industries.map((ind) => {
              const IIcon = ind.icon;
              return (
                <button
                  key={ind.id}
                  onClick={() => { setActive(ind.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`group rounded-xl border bg-white p-5 shadow-sm text-left hover:shadow-md transition-all hover:ring-2 ${ind.id === active ? 'ring-2 ring-slate-900' : 'ring-transparent'
                    }`}
                >
                  <div className={`h-9 w-9 rounded-lg border flex items-center justify-center mb-3 ${colorMap[ind.color]}`}>
                    <IIcon className="h-4 w-4" />
                  </div>
                  <p className="font-semibold text-sm text-slate-900 mb-1">{ind.label}</p>
                  <p className="text-xs text-slate-500">{ind.tagline}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
}
