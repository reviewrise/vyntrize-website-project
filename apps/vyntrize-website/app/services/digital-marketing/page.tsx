'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Sparkles, Play, MessageSquare, Mail, Search, TrendingUp, Users, CheckCircle2, Star } from 'lucide-react';

const meta = { badge: 'MKT · Service 05', headline: 'Digital Marketing', tagline: 'Human creativity amplified by AI efficiency.', cta: 'Boost your marketing', ctaColor: 'bg-rose-600 hover:bg-rose-700' };

const stats = [
  { label: 'Engagement rate', value: '5x', delta: 'vs industry avg', icon: TrendingUp, color: 'text-rose-600' },
  { label: 'Email open rate', value: '42%', delta: 'avg 21% industry', icon: Mail, color: 'text-violet-600' },
  { label: 'Community growth', value: '3x', delta: 'in 90 days', icon: Users, color: 'text-blue-600' },
];

const testimonial = { quote: 'The automation tools saved our team 20+ hours per week. We focus on strategy while VyntRise handles the execution.', name: 'Michael Chen', role: 'CTO, TechStart Solutions', initials: 'MC' };

const modules = [
  {
    id: '5.1', icon: Play, title: 'Authentic Storytelling Video Service',
    description: 'Generic AI avatars feel cold. A Content Coach extracts your real stories (Human Core), while AI tools optimize and edit at scale (AI Amplifier).',
    outcome: 'A consistent pipeline of authentic, high-quality video content that builds rapport and authority.',
    checklist: ['Story extraction sessions', 'AI-assisted editing', 'Multi-platform formatting', 'Performance analytics'],
    metrics: [{ label: 'Authenticity score', value: 96 }, { label: 'Production velocity', value: 88 }, { label: 'Audience retention', value: 82 }],
  },
  {
    id: '5.2', icon: MessageSquare, title: '"AI-Proof" Community Management',
    description: 'AI monitors conversations and flags opportunities (AI Sentinel), while human Community Managers craft personalized, genuine responses (Human Ambassador).',
    outcome: 'A loyal, engaged following and a protected, positive brand reputation online.',
    checklist: ['24/7 AI monitoring', 'Human response crafting', 'Sentiment trend tracking', 'Crisis escalation protocols'],
    metrics: [{ label: 'Response authenticity', value: 100 }, { label: 'Sentiment monitoring', value: 97 }, { label: 'Community health', value: 91 }],
  },
  {
    id: '5.3', icon: Mail, title: 'Hybrid Email & Newsletter Strategy',
    description: 'AI handles segmentation and send-time optimization, while specialists curate content in an editorial style that feels like a direct line to leadership.',
    outcome: 'A high-open-rate channel that drives loyalty and sales — not another ignored blast.',
    checklist: ['AI audience segmentation', 'Editorial content curation', 'Send-time optimization', 'A/B testing framework'],
    metrics: [{ label: 'Open rate', value: 84 }, { label: 'Click-through rate', value: 76 }, { label: 'Unsubscribe rate (low)', value: 97 }],
  },
  {
    id: '5.4', icon: Search, title: 'Strategic Content & SEO (E-E-A-T)',
    description: 'AI identifies gaps and optimizes structure, while human expertise is captured via interviews to produce authoritative guides that rank and convert.',
    outcome: 'Sustainable organic growth built on content that establishes your authority and converts visitors.',
    checklist: ['AI content gap analysis', 'Expert interview capture', 'E-E-A-T optimization', 'Conversion-focused structure'],
    metrics: [{ label: 'Keyword rankings', value: 89 }, { label: 'E-E-A-T score', value: 93 }, { label: 'Organic conversion', value: 78 }],
  },
];

export default function DigitalMarketingService() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <section className="border-b border-slate-100 bg-slate-50/40 pt-20 pb-10 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <Link href="/services" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors"><ArrowLeft className="h-4 w-4" /> Back to Services</Link>
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0"><Sparkles className="h-7 w-7" /></div>
              <div>
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1">{meta.badge}</p>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">{meta.headline}</h1>
                <p className="text-slate-500 text-sm mt-1">{meta.tagline}</p>
              </div>
            </div>
            <Link href="/contact" className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors shrink-0 ${meta.ctaColor}`}>{meta.cta} <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6 py-8 border-b border-slate-100">
        <div className="container mx-auto max-w-6xl grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((s, i) => { const SIcon = s.icon; return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.08 }} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2"><SIcon className={`h-4 w-4 ${s.color}`} /><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</span></div>
              <p className={`text-4xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.delta}</p>
            </motion.div>
          ); })}
        </div>
      </section>

      <section className="px-4 md:px-6 py-8 border-b border-slate-100 bg-slate-50/40">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-start gap-4 max-w-2xl">
            <div className="h-10 w-10 rounded-full bg-rose-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">{testimonial.initials}</div>
            <div>
              <div className="flex gap-0.5 mb-2">{[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}</div>
              <p className="text-sm text-slate-700 leading-relaxed mb-2">&ldquo;{testimonial.quote}&rdquo;</p>
              <p className="text-xs font-semibold text-slate-900">{testimonial.name} <span className="font-normal text-slate-400">— {testimonial.role}</span></p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6 py-14">
        <div className="container mx-auto max-w-6xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-8">Service Modules</p>
          <div className="space-y-5">
            {modules.map((mod, i) => { const MIcon = mod.icon; return (
              <motion.div key={mod.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.07 }} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="grid md:grid-cols-[1fr_300px]">
                  <div className="p-6 border-b md:border-b-0 md:border-r border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-9 w-9 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600"><MIcon className="h-4 w-4" /></div>
                      <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Module {mod.id}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2">{mod.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">{mod.description}</p>
                    <ul className="space-y-1.5 mb-4">{mod.checklist.map(c => (<li key={c} className="flex items-center gap-2 text-xs text-slate-600"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />{c}</li>))}</ul>
                    <div className="rounded-lg bg-rose-50 border border-rose-100 px-4 py-3"><span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Outcome — </span><span className="text-xs text-rose-700">{mod.outcome}</span></div>
                  </div>
                  <div className="p-6 bg-slate-50/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-5">Performance indicators</p>
                    <div className="space-y-5">{mod.metrics.map(m => (
                      <div key={m.label}>
                        <div className="flex justify-between text-xs mb-1.5"><span className="text-slate-600">{m.label}</span><span className="font-bold text-slate-900">{m.value}%</span></div>
                        <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden"><motion.div initial={{ width: 0 }} whileInView={{ width: `${m.value}%` }} viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} className="h-full rounded-full bg-rose-500" /></div>
                      </div>
                    ))}</div>
                  </div>
                </div>
              </motion.div>
            ); })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-slate-900 px-4 md:px-6 py-20">
        <div className="pointer-events-none absolute inset-0"><div className="absolute left-1/2 top-0 -translate-x-1/2 h-[300px] w-[600px] rounded-full bg-rose-600/12 blur-[80px]" /></div>
        <div className="relative container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div><h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">Ready to connect and convert?</h2><p className="text-slate-400 text-sm max-w-md">Let&apos;s deploy a hybrid marketing model that genuinely connects with your audience.</p></div>
          <div className="flex gap-3 shrink-0">
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white hover:bg-rose-500 transition-colors shadow-lg shadow-rose-900/20">Boost your marketing <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/services" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors">All services</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
