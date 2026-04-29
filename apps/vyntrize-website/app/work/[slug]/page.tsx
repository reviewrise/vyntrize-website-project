'use client';

import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { use, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Calendar, Tag, ExternalLink } from 'lucide-react';
import { cases, colorTokens } from '@/lib/work-data';

/* ── Hero visual for screenshot cases ── */
function HeroScreenshot({ c }: { c: typeof cases[0] }) {
  const hasImage = !!c.heroImage;
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid var(--color-border)' }}
    >
      {/* Browser chrome */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-400/70" />
          <div className="h-3 w-3 rounded-full bg-amber-400/70" />
          <div className="h-3 w-3 rounded-full bg-emerald-400/70" />
        </div>
        <div
          className="flex-1 h-5 rounded-md flex items-center px-3 text-[11px] mx-4"
          style={{ backgroundColor: 'var(--color-raised)', color: 'var(--color-text-muted)' }}
        >
          {c.liveUrl ?? `app.${c.client.toLowerCase().replace(/\s+/g, '')}.com`}
        </div>
        {c.liveUrl && (
          <a href={c.liveUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
          </a>
        )}
      </div>

      {/* Screenshot */}
      {hasImage ? (
        <div className="relative aspect-[16/10]">
          <Image
            src={c.heroImage!}
            alt={`${c.client} — hero screenshot`}
            fill
            className="object-cover object-top"
            sizes="(max-width: 768px) 100vw, 800px"
            priority
          />
        </div>
      ) : (
        <div
          className="aspect-[16/10] flex flex-col items-center justify-center gap-3"
          style={{ backgroundColor: 'var(--color-raised)' }}
        >
          <div className="grid grid-cols-3 gap-3 w-3/4 opacity-40">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }} />
            ))}
          </div>
          <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
            Drop screenshot → <code className="font-mono">public/images/work/{c.slug}-hero.png</code>
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Gallery for screenshot cases ── */
function Gallery({ c }: { c: typeof cases[0] }) {
  const [active, setActive] = useState(0);
  const images = c.galleryImages ?? [];
  if (images.length === 0) return null;

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-muted)' }}>
        Screenshots
      </p>
      {/* Main view */}
      <div
        className="rounded-2xl overflow-hidden mb-3"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <div className="relative aspect-[16/10]" style={{ backgroundColor: 'var(--color-raised)' }}>
          {images[active] ? (
            <Image
              src={images[active]}
              alt={`${c.client} screenshot ${active + 1}`}
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, 800px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Drop → public/images/work/{c.slug}-gallery-{active + 1}.png
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="relative rounded-lg overflow-hidden flex-1 aspect-[16/10] transition-all"
              style={{
                border: `2px solid ${active === i ? 'var(--color-primary)' : 'var(--color-border)'}`,
                backgroundColor: 'var(--color-raised)',
              }}
            >
              {img ? (
                <Image src={img} alt={`Thumbnail ${i + 1}`} fill className="object-cover object-top" sizes="120px" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{i + 1}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WorkDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const c = cases.find(x => x.slug === slug);
  if (!c) notFound();

  const col = colorTokens[c.color];
  const CIcon = c.icon;
  const related = cases.filter(x => x.slug !== c.slug).slice(0, 2);

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>

      {/* ── Hero ── */}
      <section
        className="pt-20 pb-14 px-4 md:px-6"
        style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="container mx-auto max-w-4xl">
          <Link
            href="/work"
            className="inline-flex items-center gap-1.5 text-sm font-medium mb-8 transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <ArrowLeft className="h-4 w-4" /> Back to Work
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${col.icon}`}>
              <CIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{c.client}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{c.industry}</p>
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight mb-6" style={{ color: 'var(--color-text)' }}>
            {c.tagline}
          </h1>

          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-full border px-3 py-1 ${col.badge}`}>
              <Tag className="h-3 w-3" /> {c.service}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1"
              style={{ backgroundColor: 'var(--color-raised)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
              <Clock className="h-3 w-3" /> {c.timeline}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1"
              style={{ backgroundColor: 'var(--color-raised)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
              <Calendar className="h-3 w-3" /> {c.year}
            </span>
            {c.liveUrl && (
              <a href={c.liveUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1 transition-colors"
                style={{ backgroundColor: 'var(--color-raised)', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
                <ExternalLink className="h-3 w-3" /> Visit live site
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── Hero visual (portfolio, screenshot, or metrics) ── */}
      <section className="px-4 md:px-6 py-10" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="container mx-auto max-w-4xl">
          {c.visualType === 'portfolio' ? (
            /* Full-bleed image — Webflow/Dribbble style */
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
              {c.heroImage ? (
                <div className="relative aspect-[16/9]">
                  <Image
                    src={c.heroImage}
                    alt={`${c.client} — project preview`}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 100vw, 800px"
                    priority
                  />
                </div>
              ) : (
                <div className="aspect-[16/9] flex items-center justify-center" style={{ backgroundColor: 'var(--color-raised)' }}>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Drop → public/images/work/{c.slug}/hero.jpg
                  </p>
                </div>
              )}
            </div>
          ) : c.visualType === 'screenshot' ? (
            <HeroScreenshot c={c} />
          ) : (
            /* Metrics band for non-visual cases */
            <div className="grid grid-cols-3 gap-4">
              {c.metrics.map((m, i) => (
                <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="rounded-2xl p-5 text-center"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <p className={`text-4xl font-extrabold font-mono mb-1 ${col.text}`}>{m.value}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{m.label}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Story ── */}
      <section className="px-4 md:px-6 py-14">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-[180px_1fr] gap-12">

            {/* Sidebar */}
            <aside className="hidden md:block">
              <nav className="sticky top-24 space-y-1">
                {[
                  'The challenge',
                  'What we built',
                  'The results',
                  ...(c.visualType !== 'metrics' && (c.galleryImages?.length ?? 0) > 0 ? ['Screenshots'] : []),
                  'Deliverables',
                ].map(label => (
                  <a key={label} href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
                    className="block text-sm py-1.5 transition-colors hover:text-[var(--color-text)]"
                    style={{ color: 'var(--color-text-muted)' }}>
                    {label}
                  </a>
                ))}
              </nav>
            </aside>

            {/* Content */}
            <div className="space-y-14">

              <div id="the-challenge">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>The challenge</p>
                <p className="text-lg leading-relaxed" style={{ color: 'var(--color-text)' }}>{c.challenge}</p>
              </div>

              <div id="what-we-built">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>What we built</p>
                <p className="text-base leading-relaxed mb-6" style={{ color: 'var(--color-text)' }}>{c.solution}</p>
                <ul className="space-y-3">
                  {c.solutionDetail.map(d => (
                    <li key={d} className="flex items-start gap-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />{d}
                    </li>
                  ))}
                </ul>
              </div>

              <div id="the-results">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>The results</p>
                <p className="text-base leading-relaxed mb-6" style={{ color: 'var(--color-text)' }}>{c.results}</p>
                {/* Metrics for screenshot/portfolio cases (shown here since no metrics band above) */}
                {c.visualType !== 'metrics' && (
                  <div className="grid grid-cols-3 gap-3">
                    {c.metrics.map(m => (
                      <div key={m.label} className="rounded-xl p-4 text-center"
                        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                        <p className={`text-2xl font-extrabold font-mono ${col.text}`}>{m.value}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{m.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quote */}
              <blockquote className="rounded-2xl p-7"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <p className="text-lg font-medium leading-relaxed mb-5" style={{ color: 'var(--color-text)' }}>
                  &ldquo;{c.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full ${col.bar} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {c.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{c.author}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{c.role}, {c.client}</p>
                  </div>
                </div>
              </blockquote>

              {/* Gallery — for screenshot and portfolio cases */}
              {c.visualType !== 'metrics' && (
                <div id="screenshots">
                  <Gallery c={c} />
                </div>
              )}

              {/* Deliverables */}
              <div id="deliverables">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-muted)' }}>Deliverables</p>
                <div className="flex flex-wrap gap-2">
                  {c.deliverables.map(d => (
                    <span key={d} className="text-xs font-medium rounded-full px-3 py-1.5"
                      style={{ backgroundColor: 'var(--color-raised)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                      {d}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── Related work ── */}
      <section className="px-4 md:px-6 py-14"
        style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <div className="container mx-auto max-w-4xl">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-6" style={{ color: 'var(--color-text-muted)' }}>More work</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {related.map(r => {
              const rcol = colorTokens[r.color];
              const RIcon = r.icon;
              return (
                <Link key={r.slug} href={`/work/${r.slug}`}
                  className="group flex items-start gap-4 rounded-2xl p-5 transition-all hover:-translate-y-0.5"
                  style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${rcol.icon}`}>
                    <RIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>{r.client}</p>
                    <p className="text-sm font-bold leading-snug" style={{ color: 'var(--color-text)' }}>{r.tagline}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" style={{ color: 'var(--color-text-muted)' }} />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 md:px-6 py-20" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-extrabold mb-4" style={{ color: 'var(--color-text)' }}>Want results like these?</h2>
          <p className="text-base mb-8 max-w-md mx-auto" style={{ color: 'var(--color-text-muted)' }}>
            Tell us your challenge. We&apos;ll scope a plan and show you what&apos;s possible.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/contact"
              className="group inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold text-white transition-colors"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              Start a project <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/work"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold transition-colors"
              style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
              View all work
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
