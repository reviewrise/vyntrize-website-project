'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Search, Globe, BarChart3, MessageSquare, Shield, TrendingUp, Activity, CheckCircle2, Star } from 'lucide-react';

const meta = {
  badge: 'AISO · Service 01',
  color: 'blue' as const,
  headline: 'AI Search & Reputation Optimization',
  tagline: 'Dominate search results and build unbreakable trust.',
  cta: 'Get started',
  ctaColor: 'bg-blue-600 hover:bg-blue-700',
};

const stats = [
  { label: 'Avg. traffic increase', value: '250%', delta: 'within 90 days', icon: TrendingUp, color: 'text-blue-600' },
  { label: 'Avg. review rating', value: '4.7★', delta: 'up from 3.8 avg', icon: Activity, color: 'text-violet-600' },
  { label: 'Review response rate', value: '98%', delta: 'vs 34% industry avg', icon: CheckCircle2, color: 'text-emerald-600' },
];

const testimonial = {
  quote: '250% traffic increase in 3 months. Our review rating went from 3.8 to 4.7 stars. VyntRise completely transformed our online presence.',
  name: 'Sarah Martinez',
  role: 'Owner, Martinez Dental Group',
  initials: 'SM',
};

const modules = [
  {
    id: '1.1',
    icon: Globe,
    title: 'AI-Driven Local & Organic SEO',
    description: 'Move beyond basic keywords. We use AI to analyze search intent, optimize for E-E-A-T, and secure high-value local citations through strategic PR.',
    outcome: 'Rank higher for what matters, attract qualified traffic, and establish unmatched topical authority.',
    checklist: ['AI keyword intent mapping', 'E-E-A-T content optimization', 'Local citation building', 'Google Business Profile management'],
    metrics: [{ label: 'Keyword rankings', value: 91 }, { label: 'Citation coverage', value: 84 }, { label: 'E-E-A-T score', value: 88 }],
  },
  {
    id: '1.2',
    icon: BarChart3,
    title: 'Review Aggregation & Centralization',
    description: 'Stop checking 10 different sites. One unified dashboard pulling reviews from Google, Yelp, Facebook, Glassdoor, and industry platforms.',
    outcome: 'Instantly understand your reputation landscape, track sentiment trends, and never miss customer feedback.',
    checklist: ['Unified review dashboard', 'Real-time sentiment tracking', 'Multi-platform aggregation', 'Instant alert system'],
    metrics: [{ label: 'Platform coverage', value: 95 }, { label: 'Sentiment accuracy', value: 92 }, { label: 'Alert speed', value: 99 }],
  },
  {
    id: '1.3',
    icon: MessageSquare,
    title: 'Intelligent Review Response & Profile Management',
    description: 'AI drafts context-aware response suggestions for new reviews and ensures your business data (NAP) is consistent everywhere.',
    outcome: 'Professionally managed reputation that builds social proof, improves local SEO, and turns feedback into growth.',
    checklist: ['AI-drafted response suggestions', 'NAP consistency enforcement', 'Profile completeness audits', 'Competitor gap analysis'],
    metrics: [{ label: 'Response quality', value: 96 }, { label: 'NAP consistency', value: 100 }, { label: 'Profile completeness', value: 94 }],
  },
  {
    id: '1.4',
    icon: Shield,
    title: 'Insight-Driven Reputation Audits',
    description: 'Deep-dive reports analyzing review themes, competitor reputation gaps, and profile completeness to inform your strategy.',
    outcome: 'Actionable insights to improve customer experience, competitive positioning, and conversion rates.',
    checklist: ['Monthly reputation reports', 'Competitor benchmarking', 'Review theme analysis', 'Conversion impact scoring'],
    metrics: [{ label: 'Competitor gap analysis', value: 87 }, { label: 'Theme detection', value: 93 }, { label: 'Conversion impact', value: 79 }],
  },
];

export default function AISearchService() {
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>

      {/* Header */}
      <section className="pt-20 pb-10 px-4 md:px-6" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <div className="container mx-auto max-w-6xl">
          <Link href="/services" className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 transition-colors" style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
          >
            <ArrowLeft className="h-4 w-4" /> Back to Services
          </Link>
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Search className="h-7 w-7" />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: 'var(--color-text-subtle)' }}>{meta.badge}</p>
                <h1 className="text-2xl md:text-3xl font-extrabold" style={{ color: 'var(--color-text)' }}>{meta.headline}</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>{meta.tagline}</p>
              </div>
            </div>
            <Link href="/contact" className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors shrink-0 ${meta.ctaColor}`}>
              {meta.cta} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 md:px-6 py-8" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="container mx-auto max-w-6xl grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((s, i) => {
            const SIcon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="rounded-xl p-5 shadow-sm"
                style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <SIcon className={`h-4 w-4 ${s.color}`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-subtle)' }}>{s.label}</span>
                </div>
                <p className={`text-4xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-subtle)' }}>{s.delta}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Testimonial */}
      <section className="px-4 md:px-6 py-8" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-start gap-4 max-w-2xl">
            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
              {testimonial.initials}
            </div>
            <div>
              <div className="flex gap-0.5 mb-2">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--color-text)' }}>&ldquo;{testimonial.quote}&rdquo;</p>
              <p className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>{testimonial.name} <span className="font-normal" style={{ color: 'var(--color-text-subtle)' }}>— {testimonial.role}</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="px-4 md:px-6 py-14">
        <div className="container mx-auto max-w-6xl">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-8" style={{ color: 'var(--color-text-subtle)' }}>Service Modules</p>
          <div className="space-y-5">
            {modules.map((mod, i) => {
              const MIcon = mod.icon;
              return (
                <motion.div
                  key={mod.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  className="rounded-2xl shadow-sm overflow-hidden"
                  style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}
                >
                  <div className="grid md:grid-cols-[1fr_300px]">
                    {/* Left */}
                    <div className="p-6 border-b md:border-b-0 md:border-r" style={{ borderColor: 'var(--color-border)' }}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-9 w-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                          <MIcon className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--color-text-subtle)' }}>Module {mod.id}</span>
                      </div>
                      <h3 className="text-base font-bold mb-2" style={{ color: 'var(--color-text)' }}>{mod.title}</h3>
                      <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-text-muted)' }}>{mod.description}</p>
                      {/* Checklist */}
                      <ul className="space-y-1.5 mb-4">
                        {mod.checklist.map(c => (
                          <li key={c} className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            {c}
                          </li>
                        ))}
                      </ul>
                      <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Outcome — </span>
                        <span className="text-xs text-blue-700">{mod.outcome}</span>
                      </div>
                    </div>
                    {/* Right: metrics */}
                    <div className="p-6" style={{ backgroundColor: 'var(--color-surface)' }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-5" style={{ color: 'var(--color-text-subtle)' }}>Performance indicators</p>
                      <div className="space-y-5">
                        {mod.metrics.map(m => (
                          <div key={m.label}>
                            <div className="flex justify-between text-xs mb-1.5">
                              <span style={{ color: 'var(--color-text-muted)' }}>{m.label}</span>
                              <span className="font-bold" style={{ color: 'var(--color-text)' }}>{m.value}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
                              <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: `${m.value}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                                className="h-full rounded-full bg-blue-500"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-slate-900 px-4 md:px-6 py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[300px] w-[600px] rounded-full bg-blue-600/15 blur-[80px]" />
        </div>
        <div className="relative container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">Ready to dominate search?</h2>
            <p className="text-slate-400 text-sm max-w-md">Let&apos;s build your unbreakable online reputation and drive more qualified traffic.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/30">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/services" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
              All services
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
