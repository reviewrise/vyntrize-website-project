'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Code, Zap, ShoppingCart, Settings, CheckCircle2, Activity, Star } from 'lucide-react';

const meta = { badge: 'DEV · Service 03', headline: 'Custom Software Development', tagline: 'Built for your exact workflow — not the other way around.', cta: 'Discuss your project', ctaColor: 'bg-emerald-600 hover:bg-emerald-700' };

const stats = [
  { label: 'Projects delivered', value: '100+', delta: 'since 2022', icon: Code, color: 'text-emerald-600' },
  { label: 'On-time delivery', value: '95%', delta: 'across all projects', icon: CheckCircle2, color: 'text-blue-600' },
  { label: 'Client satisfaction', value: '4.9/5', delta: 'avg rating', icon: Activity, color: 'text-violet-600' },
];

const testimonial = { quote: 'Outstanding custom development. Delivered exactly what we needed, on time and within budget. The team was exceptional throughout.', name: 'Emily Rodriguez', role: 'CEO, GrowthHub Agency', initials: 'ER' };

const modules = [
  {
    id: '3.1', icon: Zap, title: 'Bespoke AI Implementation & Integration',
    description: 'Generic AI tools aren\'t built for your specific data or workflow. We build custom AI interfaces and integrations that work within your exact environment and brand.',
    outcome: 'Leverage cutting-edge AI safely and effectively, with outputs tailored to your brand and data.',
    checklist: ['Custom AI model fine-tuning', 'Brand-aligned interfaces', 'Secure data pipelines', 'SOC 2 compliant deployment'],
    metrics: [{ label: 'Integration depth', value: 94 }, { label: 'Brand alignment', value: 98 }, { label: 'Security compliance', value: 100 }],
  },
  {
    id: '3.2', icon: ShoppingCart, title: 'Targeted E-commerce & Business Platforms',
    description: 'Off-the-shelf platforms can\'t accommodate unique business models. We build custom digital storefronts, wholesale portals, and complex booking systems.',
    outcome: 'A perfect digital front door that converts better because it\'s built for your customer\'s journey.',
    checklist: ['Custom checkout flows', 'Wholesale & B2B portals', 'Complex booking systems', 'Payment gateway integration'],
    metrics: [{ label: 'Conversion rate lift', value: 87 }, { label: 'UX score', value: 95 }, { label: 'Load performance', value: 97 }],
  },
  {
    id: '3.3', icon: Settings, title: 'Operations & Efficiency Tools (Mini-ERPs)',
    description: 'You\'re piecing together 5+ apps, or enterprise ERP is too expensive. We build streamlined, custom "light-ERP" systems that do exactly what you need — nothing more.',
    outcome: 'Eliminate app fatigue, reduce manual data reconciliation, and gain complete clarity over operations.',
    checklist: ['Unified operations dashboard', 'Custom workflow automation', 'Role-based access control', 'Real-time reporting'],
    metrics: [{ label: 'Process consolidation', value: 91 }, { label: 'Data accuracy', value: 99 }, { label: 'Team adoption', value: 93 }],
  },
];

export default function CustomSoftwareService() {
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <section className="pt-20 pb-10 px-4 md:px-6" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <div className="container mx-auto max-w-6xl">
          <Link href="/services" className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 transition-colors" style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
          ><ArrowLeft className="h-4 w-4" /> Back to Services</Link>
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0"><Code className="h-7 w-7" /></div>
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: 'var(--color-text-subtle)' }}>{meta.badge}</p>
                <h1 className="text-2xl md:text-3xl font-extrabold" style={{ color: 'var(--color-text)' }}>{meta.headline}</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>{meta.tagline}</p>
              </div>
            </div>
            <Link href="/contact" className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors shrink-0 ${meta.ctaColor}`}>{meta.cta} <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6 py-8" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="container mx-auto max-w-6xl grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((s, i) => { const SIcon = s.icon; return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.08 }} className="rounded-xl p-5 shadow-sm" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
              <div className="flex items-center gap-2 mb-2"><SIcon className={`h-4 w-4 ${s.color}`} /><span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-subtle)' }}>{s.label}</span></div>
              <p className={`text-4xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-subtle)' }}>{s.delta}</p>
            </motion.div>
          ); })}
        </div>
      </section>

      <section className="px-4 md:px-6 py-8" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-start gap-4 max-w-2xl">
            <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">{testimonial.initials}</div>
            <div>
              <div className="flex gap-0.5 mb-2">{[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}</div>
              <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--color-text)' }}>&ldquo;{testimonial.quote}&rdquo;</p>
              <p className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>{testimonial.name} <span className="font-normal" style={{ color: 'var(--color-text-subtle)' }}>— {testimonial.role}</span></p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6 py-14">
        <div className="container mx-auto max-w-6xl">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-8" style={{ color: 'var(--color-text-subtle)' }}>Service Modules</p>
          <div className="space-y-5">
            {modules.map((mod, i) => { const MIcon = mod.icon; return (
              <motion.div key={mod.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.07 }} className="rounded-2xl shadow-sm overflow-hidden" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                <div className="grid md:grid-cols-[1fr_300px]">
                  <div className="p-6 border-b md:border-b-0 md:border-r" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-9 w-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600"><MIcon className="h-4 w-4" /></div>
                      <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--color-text-subtle)' }}>Module {mod.id}</span>
                    </div>
                    <h3 className="text-base font-bold mb-2" style={{ color: 'var(--color-text)' }}>{mod.title}</h3>
                    <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-text-muted)' }}>{mod.description}</p>
                    <ul className="space-y-1.5 mb-4">{mod.checklist.map(c => (<li key={c} className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />{c}</li>))}</ul>
                    <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3"><span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Outcome — </span><span className="text-xs text-emerald-700">{mod.outcome}</span></div>
                  </div>
                  <div className="p-6" style={{ backgroundColor: 'var(--color-surface)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-5" style={{ color: 'var(--color-text-subtle)' }}>Performance indicators</p>
                    <div className="space-y-5">{mod.metrics.map(m => (
                      <div key={m.label}>
                        <div className="flex justify-between text-xs mb-1.5"><span style={{ color: 'var(--color-text-muted)' }}>{m.label}</span><span className="font-bold" style={{ color: 'var(--color-text)' }}>{m.value}%</span></div>
                        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}><motion.div initial={{ width: 0 }} whileInView={{ width: `${m.value}%` }} viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} className="h-full rounded-full bg-emerald-500" /></div>
                      </div>
                    ))}</div>
                  </div>
                </div>
              </motion.div>
            ); })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden px-4 md:px-6 py-20" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="pointer-events-none absolute inset-0"><div className="absolute left-1/2 top-0 -translate-x-1/2 h-[300px] w-[600px] rounded-full bg-white/10 blur-[80px]" /></div>
        <div className="relative container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div><h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">Ready to build your advantage?</h2><p className="text-white/70 text-sm max-w-md">Let&apos;s engineer custom software solutions tailored to your unique business needs.</p></div>
          <div className="flex gap-3 shrink-0">
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold transition-colors shadow-lg" style={{ color: 'var(--color-primary)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.9)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
            >Discuss your project <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/services" className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors">All services</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
