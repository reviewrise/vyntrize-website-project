'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Clock } from 'lucide-react';
import { cases, colorTokens } from '@/lib/work-data';

const filters = ['All', 'Web Design', 'AI Search', 'Automation', 'Custom Software', 'Data & Analytics'];

/* ── Metrics visual (for AI/Data/Automation cases) ── */
function MetricsVisual({ c }: { c: typeof cases[0] }) {
  const col = colorTokens[c.color];
  return (
    <div
      className="relative h-48 flex flex-col justify-between p-5 overflow-hidden"
      style={{ backgroundColor: 'var(--color-raised)' }}
    >
      {/* Subtle gradient blob */}
      <div
        className={`absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-2xl ${col.bar}`}
      />
      <div className="flex items-center justify-between relative z-10">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
          Key results
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${col.text}`}>
          {c.timeline}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 relative z-10">
        {c.metrics.map(m => (
          <div key={m.label} className="rounded-xl p-3" style={{ backgroundColor: 'var(--color-surface)' }}>
            <p className={`text-xl font-extrabold font-mono ${col.text}`}>{m.value}</p>
            <p className="text-[10px] mt-0.5 leading-tight" style={{ color: 'var(--color-text-muted)' }}>{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Portfolio visual (full-bleed image, Webflow/Dribbble style) ── */
function PortfolioVisual({ c }: { c: typeof cases[0] }) {
  return (
    <div className="relative h-52 overflow-hidden">
      {c.heroImage ? (
        <Image
          src={c.heroImage}
          alt={`${c.client} preview`}
          fill
          className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 400px"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'var(--color-raised)' }}>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Drop → public/images/work/{c.slug}/hero.jpg
          </p>
        </div>
      )}
      {/* Gradient overlay at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
      {/* Industry badge */}
      <span className="absolute top-3 right-3 text-[10px] font-bold rounded-full px-2.5 py-1 bg-black/40 text-white backdrop-blur-sm">
        {c.industry}
      </span>
    </div>
  );
}
function ScreenshotVisual({ c }: { c: typeof cases[0] }) {
  const hasImage = !!c.heroImage;
  return (
    <div className="relative h-48 overflow-hidden" style={{ backgroundColor: 'var(--color-raised)' }}>
      {/* Browser chrome */}
      <div
        className="absolute inset-x-0 top-0 h-7 flex items-center gap-1.5 px-3 z-10"
        style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="h-2 w-2 rounded-full bg-red-400/60" />
        <div className="h-2 w-2 rounded-full bg-amber-400/60" />
        <div className="h-2 w-2 rounded-full bg-emerald-400/60" />
        <div
          className="ml-2 flex-1 h-3.5 rounded-sm text-[9px] flex items-center px-2"
          style={{ backgroundColor: 'var(--color-raised)', color: 'var(--color-text-muted)' }}
        >
          {c.liveUrl ?? `app.${c.client.toLowerCase().replace(/\s+/g, '')}.com`}
        </div>
      </div>

      {/* Screenshot or placeholder */}
      {hasImage ? (
        <Image
          src={c.heroImage!}
          alt={`${c.client} screenshot`}
          fill
          className="object-cover object-top pt-7"
          sizes="(max-width: 768px) 100vw, 400px"
        />
      ) : (
        /* Placeholder grid — replaced when real screenshot is dropped in */
        <div className="absolute inset-0 pt-7 flex flex-col gap-2 p-3" style={{ backgroundColor: 'var(--color-raised)' }}>
          <div className="flex gap-2">
            <div className="h-16 flex-1 rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }} />
            <div className="h-16 w-24 rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }} />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-32 rounded-md" style={{ backgroundColor: 'var(--color-surface)' }} />
            <div className="h-8 flex-1 rounded-md" style={{ backgroundColor: 'var(--color-surface)' }} />
          </div>
          <div className="h-10 rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }} />
          <p className="text-[10px] text-center mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Drop screenshot → public/images/work/{c.slug}-hero.png
          </p>
        </div>
      )}
    </div>
  );
}

export default function WorkPage() {
  const [active, setActive] = useState('All');
  const filtered = active === 'All' ? cases : cases.filter(c => c.filter === active);

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>

      {/* Header */}
      <section
        className="pt-20 pb-14 px-4 md:px-6"
        style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="container mx-auto max-w-6xl">
          <div className="github-badge mb-4">OUR WORK</div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight" style={{ color: 'var(--color-text)' }}>
            Real clients. Real results.
          </h1>
          <p className="text-lg max-w-xl mb-10" style={{ color: 'var(--color-text-muted)' }}>
            Every engagement is measured by outcomes — not deliverables. Here&apos;s what that looks like in practice.
          </p>
          <div className="flex flex-wrap gap-2">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setActive(f)}
                className="rounded-full px-4 py-1.5 text-sm font-semibold transition-all"
                style={{
                  backgroundColor: active === f ? 'var(--color-primary)' : 'var(--color-raised)',
                  color: active === f ? '#fff' : 'var(--color-text-muted)',
                  border: `1px solid ${active === f ? 'var(--color-primary)' : 'var(--color-border)'}`,
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="px-4 md:px-6 py-14">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((c, i) => {
              const col = colorTokens[c.color];
              const CIcon = c.icon;
              return (
                <motion.div
                  key={c.slug}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                >
                  <Link
                    href={`/work/${c.slug}`}
                    className="group flex flex-col rounded-2xl overflow-hidden h-full transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                  >
                    {/* Visual — portfolio, screenshot, or metrics */}
                    {c.visualType === 'portfolio'
                      ? <PortfolioVisual c={c} />
                      : c.visualType === 'screenshot'
                      ? <ScreenshotVisual c={c} />
                      : <MetricsVisual c={c} />
                    }

                    {/* Card body */}
                    <div className="p-5 flex flex-col gap-3 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${col.icon}`}>
                            <CIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold leading-tight" style={{ color: 'var(--color-text)' }}>{c.client}</p>
                            <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{c.industry}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-semibold rounded-full border px-2 py-0.5 shrink-0 ${col.badge}`}>
                          {c.filter}
                        </span>
                      </div>
                      <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--color-text)' }}>
                        {c.tagline}
                      </p>
                    </div>

                    {/* Footer */}
                    <div
                      className="px-5 py-3 flex items-center justify-between"
                      style={{ borderTop: '1px solid var(--color-border)' }}
                    >
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" style={{ color: 'var(--color-text-muted)' }} />
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{c.timeline}</span>
                      </div>
                      <span
                        className="text-xs font-semibold flex items-center gap-1 group-hover:gap-1.5 transition-all"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        Read case study <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="px-4 md:px-6 py-20"
        style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: 'var(--color-text)' }}>
            Ready to be our next case study?
          </h2>
          <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: 'var(--color-text-muted)' }}>
            Tell us your challenge. We&apos;ll scope a plan and show you what results look like for your business.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2 rounded-xl px-8 py-4 text-sm font-bold text-white transition-colors"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Start a project <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-sm font-semibold transition-colors"
              style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              Explore services
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
