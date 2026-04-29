'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Bot, TrendingUp, CheckCircle2, Activity, Zap } from 'lucide-react';

/* ─── Task feed ─── */
const TASKS = [
  { id: 'a', agent: 'Lead Agent',     action: 'Qualified inbound lead — Habesha Food',   color: 'blue'    },
  { id: 'b', agent: 'Review Agent',   action: 'Responded to 3-star review on Google',     color: 'violet'  },
  { id: 'c', agent: 'SEO Agent',      action: 'Updated 12 local citations',               color: 'emerald' },
  { id: 'd', agent: 'Data Agent',     action: 'Synced CRM → analytics pipeline',          color: 'amber'   },
  { id: 'e', agent: 'Lead Agent',     action: 'Sent follow-up to 8 leads',                color: 'blue'    },
  { id: 'f', agent: 'Workflow Agent', action: 'Triggered onboarding sequence',            color: 'violet'  },
  { id: 'g', agent: 'SEO Agent',      action: 'Published 2 AI-generated location pages',  color: 'emerald' },
  { id: 'h', agent: 'Data Agent',     action: 'Cleaned 1,204 duplicate records',          color: 'amber'   },
];

const agentStyle: Record<string, { dot: string; badge: string; border: string }> = {
  blue:    { dot: 'bg-blue-400',    badge: 'bg-blue-500/20 text-blue-300',    border: 'border-l-blue-500'    },
  violet:  { dot: 'bg-violet-400',  badge: 'bg-violet-500/20 text-violet-300',border: 'border-l-violet-500'  },
  emerald: { dot: 'bg-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300', border: 'border-l-emerald-500' },
  amber:   { dot: 'bg-amber-400',   badge: 'bg-amber-500/20 text-amber-300',  border: 'border-l-amber-500'   },
};

/* ─── Count-up hook ─── */
function useCountUp(to: number, from: number, duration = 1600, delay = 800) {
  const [val, setVal] = useState(from);
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(from + (to - from) * ease));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(t);
  }, [to, from, duration, delay]);
  return val;
}

/* ─── Circular progress ring ─── */
function RingProgress({ value, max = 100, size = 72, stroke = 6, color = '#6366F1' }: {
  value: number; max?: number; size?: number; stroke?: number; color?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ * (1 - pct) }}
        transition={{ duration: 1.6, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  );
}

export default function Hero() {
  const [visible, setVisible] = useState(TASKS.slice(0, 3));
  const cursor = useRef(3);

  useEffect(() => {
    const id = setInterval(() => {
      const next = TASKS[cursor.current % TASKS.length];
      cursor.current += 1;
      setVisible(prev => [next, ...prev.slice(0, 2)]);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  const repScore  = useCountUp(94, 72, 1600, 900);
  const taskCount = useCountUp(1351, 1284, 1400, 1000);

  return (
    <section className="relative min-h-screen overflow-hidden flex items-center" style={{ backgroundColor: 'var(--color-bg)' }}>

      {/* ── Background ── */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* Brand gradient bloom — top left behind copy */}
        <div className="absolute -left-40 top-0 h-[500px] w-[600px] rounded-full opacity-25"
          style={{ background: 'radial-gradient(ellipse, #6366F1 0%, transparent 70%)', filter: 'blur(90px)' }} />
        {/* Cyan bloom — right panel */}
        <div className="absolute right-0 top-1/4 h-[400px] w-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(ellipse, #41A5FF 0%, transparent 70%)', filter: 'blur(100px)' }} />
        {/* Dot grid */}
        <div className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.07) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        {/* Right panel surface */}
        <div className="absolute inset-y-0 right-0 w-[52%] hidden lg:block"
          style={{ backgroundColor: 'var(--color-surface)', opacity: 0.7 }} />
        <div className="absolute inset-y-0 left-[44%] w-[16%] hidden lg:block"
          style={{ background: 'linear-gradient(to right, var(--color-bg), var(--color-surface))' }} />
      </div>

      <div className="container mx-auto max-w-7xl px-4 md:px-8 py-28 grid lg:grid-cols-2 gap-16 items-center">

        {/* ══════════════════════════════════════════
            LEFT — Upgraded copy
        ══════════════════════════════════════════ */}
        <div className="flex flex-col items-start">

          {/* Status pill — brand gradient dot */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 inline-flex items-center gap-2.5 rounded-full px-4 py-1.5"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                style={{ backgroundColor: '#6366F1' }} />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: '#6366F1' }} />
            </span>
            <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>AI agents active</span>
            <span className="h-3.5 w-px" style={{ backgroundColor: 'var(--color-border)' }} />
            <span className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>{taskCount.toLocaleString()} tasks today</span>
          </motion.div>

          {/* Headline — bigger, bolder */}
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-extrabold tracking-tight leading-[1.02] mb-6"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', color: 'var(--color-text)' }}
          >
            Your business,{' '}
            <span style={{ background: 'linear-gradient(135deg, #41A5FF 0%, #6366F1 50%, #2A52BE 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              running itself.
            </span>
          </motion.h1>

          {/* Subtext — shorter, punchier */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg leading-relaxed max-w-[420px] mb-10"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Autonomous AI agents that handle your reputation, leads, and workflows — 24/7, without lifting a finger.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-12"
          >
            <Link href="/contact"
              className="group inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 hover:shadow-xl"
              style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', boxShadow: '0 4px 24px rgba(99,102,241,0.35)' }}
            >
              Start free — no card needed
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/work"
              className="inline-flex items-center gap-1.5 px-4 py-3.5 text-sm font-semibold rounded-xl transition-colors"
              style={{ color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
            >
              See our work <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>

          {/* Social proof — real client chips */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.46, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-3"
          >
            <p className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
              Trusted by local businesses
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'Habesha Food',   initials: 'HF', color: '#10b981' },
                { name: 'Liya Cookies',   initials: 'LC', color: '#f43f5e' },
                { name: 'Nazaret Market', initials: 'NM', color: '#f59e0b' },
              ].map(client => (
                <div key={client.name}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                  <div className="h-5 w-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                    style={{ backgroundColor: client.color }}>
                    {client.initials}
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{client.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ══════════════════════════════════════════
            RIGHT — Upgraded Agent Console
        ══════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.75, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="relative hidden lg:flex flex-col gap-3"
        >
          {/* Floating chip — top right */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="absolute -top-4 right-0 z-10 flex items-center gap-2 rounded-xl px-3.5 py-2 shadow-lg"
            style={{ backgroundColor: 'rgba(15,17,26,0.9)', border: '1px solid rgba(99,102,241,0.3)', backdropFilter: 'blur(12px)' }}
          >
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold text-white">+1.2★ avg. reputation lift</span>
          </motion.div>

          {/* Floating chip — bottom left */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.05 }}
            className="absolute -bottom-4 -left-3 z-10 flex items-center gap-2 rounded-xl px-3.5 py-2 shadow-lg"
            style={{ backgroundColor: 'rgba(15,17,26,0.9)', border: '1px solid rgba(65,165,255,0.3)', backdropFilter: 'blur(12px)' }}
          >
            <Zap className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            <span className="text-xs font-semibold text-white">500+ integrations</span>
          </motion.div>

          {/* ── Main console card ── */}
          <div className="rounded-2xl overflow-hidden shadow-2xl"
            style={{ border: '1px solid rgba(99,102,241,0.2)', backgroundColor: '#0B101A', boxShadow: '0 0 60px rgba(99,102,241,0.12), 0 25px 50px rgba(0,0,0,0.5)' }}>

            {/* Title bar */}
            <div className="flex items-center justify-between px-5 py-3.5"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
                </div>
                <span className="text-[11px] font-mono text-slate-400">VyntRise · Agent Console</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">LIVE</span>
              </div>
            </div>

            {/* Reputation ring + metrics row */}
            <div className="flex items-center gap-0 divide-x divide-white/8" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

              {/* Reputation ring — hero metric */}
              <div className="flex flex-col items-center justify-center px-6 py-5 gap-1 relative">
                <div className="relative">
                  <RingProgress value={repScore} max={100} size={76} stroke={6} color="#6366F1" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-extrabold font-mono text-white">{repScore}</span>
                  </div>
                </div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Reputation</span>
              </div>

              {/* Tasks + Agents */}
              <div className="flex-1 grid grid-cols-2 divide-x divide-white/8">
                {[
                  { label: 'Tasks today', value: taskCount.toLocaleString(), color: '#41A5FF', Icon: Activity },
                  { label: 'Agents active', value: '3', color: '#a78bfa', Icon: Bot },
                ].map(({ label, value, color, Icon }) => (
                  <div key={label} className="px-5 py-5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Icon className="h-3 w-3" style={{ color }} />
                      <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">{label}</span>
                    </div>
                    <span className="text-2xl font-extrabold font-mono" style={{ color }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live task feed */}
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500">Live activity</span>
                <span className="text-[9px] font-mono text-slate-600">auto-updating</span>
              </div>

              <div className="flex flex-col gap-1.5 h-[138px] overflow-hidden">
                <AnimatePresence initial={false} mode="popLayout">
                  {visible.map((task) => {
                    const s = agentStyle[task.color];
                    return (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border-l-2 shrink-0 ${s.border}`}
                        style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                      >
                        <span className={`text-[10px] font-bold rounded-md px-1.5 py-0.5 shrink-0 ${s.badge}`}>
                          {task.agent}
                        </span>
                        <span className="text-xs text-slate-300 truncate flex-1">{task.action}</span>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer stats row */}
            <div className="grid grid-cols-3 divide-x divide-white/8" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                { value: '20+ hrs', label: 'saved / week',  color: '#41A5FF'  },
                { value: '< 30d',   label: 'first results', color: '#34d399'  },
                { value: '3.5x',    label: 'avg. ROI',      color: '#a78bfa'  },
              ].map(s => (
                <div key={s.label} className="px-4 py-3 text-center">
                  <p className="text-sm font-extrabold font-mono" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
