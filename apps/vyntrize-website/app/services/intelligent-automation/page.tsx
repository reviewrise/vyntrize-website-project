'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Bot, Users, Database, Settings, Zap, Shield, Activity, CheckCircle2, Star } from 'lucide-react';

const meta = { badge: 'AUTO · Service 02', headline: 'Intelligent AI & Automation', tagline: 'Tools that think, decide, and act on your behalf.', cta: 'Get started', ctaColor: 'bg-violet-600 hover:bg-violet-700' };

const stats = [
  { label: 'Hours saved / week', value: '20+', delta: 'per team', icon: Zap, color: 'text-violet-600' },
  { label: 'Agent accuracy rate', value: '99.9%', delta: 'across all agents', icon: Shield, color: 'text-blue-600' },
  { label: 'Integrations supported', value: '500+', delta: 'tools & platforms', icon: Settings, color: 'text-emerald-600' },
];

const testimonial = { quote: 'The AI agents handle our lead follow-up 24/7. Conversion rate up 40% since we launched. It just runs.', name: 'Priya Nair', role: 'VP Sales, Crestline SaaS', initials: 'PN' };

const modules = [
  {
    id: '2.1', icon: Users, title: 'Autonomous Lead & Sales Agents',
    description: 'Leads decay in minutes. Our AI agents engage, qualify, and act in real-time — from form fills to booked meetings, without human intervention.',
    outcome: 'Convert more leads, improve sales team efficiency, and never miss a high-intent prospect.',
    checklist: ['Real-time lead engagement', 'AI qualification scoring', 'Automated meeting booking', 'CRM sync & handoff'],
    metrics: [{ label: 'Lead response speed', value: 99 }, { label: 'Qualification accuracy', value: 94 }, { label: 'Booking conversion', value: 87 }],
  },
  {
    id: '2.2', icon: Database, title: 'Internal Knowledge & Operations Agents',
    description: 'RAG-powered AI "brains" trained on your manuals, SOPs, and project briefs — giving employees instant, accurate answers without digging through drives.',
    outcome: 'Drastically reduce training time, ensure policy compliance, and preserve institutional knowledge.',
    checklist: ['Custom RAG knowledge base', 'SOP & manual ingestion', 'Instant Q&A interface', 'Continuous learning pipeline'],
    metrics: [{ label: 'Answer accuracy', value: 97 }, { label: 'Knowledge coverage', value: 91 }, { label: 'Time-to-answer', value: 99 }],
  },
  {
    id: '2.3', icon: Settings, title: 'Multi-Agent Workflow Orchestration',
    description: 'Coordinated "crews" of specialized AI agents that hand off tasks to complete entire workflows autonomously — from content creation to customer onboarding.',
    outcome: 'Achieve complex, multi-step outcomes autonomously — scaling output without scaling headcount.',
    checklist: ['Agent crew design', 'Task handoff protocols', 'Parallel execution', 'Human-in-the-loop checkpoints'],
    metrics: [{ label: 'Workflow completion', value: 96 }, { label: 'Handoff accuracy', value: 93 }, { label: 'Parallel task capacity', value: 88 }],
  },
  {
    id: '2.4', icon: Zap, title: 'Intelligent Process Automation',
    description: 'Basic no-code automation lacks judgment. We infuse AI decision-points into critical processes like invoice processing, support triage, and compliance checks.',
    outcome: 'Automate not just the task, but the decision-making within the task — handling exceptions intelligently.',
    checklist: ['AI decision-point injection', 'Exception handling logic', 'Compliance automation', 'Audit trail generation'],
    metrics: [{ label: 'Exception handling', value: 92 }, { label: 'Process coverage', value: 85 }, { label: 'Error reduction', value: 98 }],
  },
];

export default function IntelligentAutomationService() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <section className="border-b border-slate-100 bg-slate-50/40 pt-20 pb-10 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <Link href="/services" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors"><ArrowLeft className="h-4 w-4" /> Back to Services</Link>
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shrink-0"><Bot className="h-7 w-7" /></div>
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
            <div className="h-10 w-10 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">{testimonial.initials}</div>
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
                      <div className="h-9 w-9 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600"><MIcon className="h-4 w-4" /></div>
                      <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Module {mod.id}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2">{mod.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">{mod.description}</p>
                    <ul className="space-y-1.5 mb-4">{mod.checklist.map(c => (<li key={c} className="flex items-center gap-2 text-xs text-slate-600"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />{c}</li>))}</ul>
                    <div className="rounded-lg bg-violet-50 border border-violet-100 px-4 py-3"><span className="text-[10px] font-bold uppercase tracking-wider text-violet-700">Outcome — </span><span className="text-xs text-violet-700">{mod.outcome}</span></div>
                  </div>
                  <div className="p-6 bg-slate-50/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-5">Performance indicators</p>
                    <div className="space-y-5">{mod.metrics.map(m => (
                      <div key={m.label}>
                        <div className="flex justify-between text-xs mb-1.5"><span className="text-slate-600">{m.label}</span><span className="font-bold text-slate-900">{m.value}%</span></div>
                        <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden"><motion.div initial={{ width: 0 }} whileInView={{ width: `${m.value}%` }} viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} className="h-full rounded-full bg-violet-500" /></div>
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
        <div className="pointer-events-none absolute inset-0"><div className="absolute left-1/2 top-0 -translate-x-1/2 h-[300px] w-[600px] rounded-full bg-violet-600/15 blur-[80px]" /></div>
        <div className="relative container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div><h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">Ready to automate your growth?</h2><p className="text-slate-400 text-sm max-w-md">Let&apos;s architect intelligent workflows that turn your stack into a proactive engine.</p></div>
          <div className="flex gap-3 shrink-0">
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-500 transition-colors shadow-lg shadow-violet-900/30">Get started <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/services" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors">All services</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
