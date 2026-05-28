'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  LifeBuoy,
  Zap,
  ArrowRight,
  Copy,
  Check,
  Layers,
  Phone,
} from 'lucide-react';

const NAV_LINKS = [
  { href: '/',            label: 'Home',      icon: Home,     desc: 'Back to the main page' },
  { href: '/services',    label: 'Services',  icon: Layers,   desc: 'Explore what we offer' },
  { href: '/solutions',   label: 'Solutions', icon: Zap,      desc: 'AI solutions for your biz' },
  { href: '/contact',     label: 'Contact',   label2: 'Us',   icon: Phone,    desc: 'Reach our team directly' },
  { href: '/support',     label: 'Support',   icon: LifeBuoy, desc: 'Get help from our team' },
];

// Deterministic dots so SSR and client render the same markup
const DOTS = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  x: ((i * 37 + 11) % 97),   // 0-96
  y: ((i * 53 + 7)  % 93),   // 0-92
  size: 2 + (i % 3),          // 2-4
  delay: (i * 0.3) % 4,
  dur:   2.5 + (i % 3) * 0.8,
}));

export default function NotFoundClient() {
  const pathname  = usePathname();
  const [copied,  setCopied]  = useState(false);
  const [reported, setReported] = useState(false);
  const [counter, setCounter] = useState(10);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Countdown auto-redirect */
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCounter(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          window.location.href = '/';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, []);

  const brokenUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://www.vyntrise.com${pathname}`;

  function copyLink() {
    navigator.clipboard.writeText(brokenUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function reportLink() {
    const subject = encodeURIComponent('Broken link report — VyntRise');
    const body = encodeURIComponent(
      `Hi VyntRise team,\n\nI found a broken link on your website:\n\n${brokenUrl}\n\nPlease fix this page.\n\nThanks!`
    );
    window.open(`mailto:hello@vyntrise.com?subject=${subject}&body=${body}`);
    setReported(true);
  }

  return (
    <section className="relative min-h-[calc(100vh-160px)] flex items-center justify-center overflow-hidden px-4 py-20">

      {/* ── Animated background grid ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(var(--color-border) 1px, transparent 1px),
            linear-gradient(90deg, var(--color-border) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          opacity: 0.35,
        }}
      />

      {/* ── Floating dots ── */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {DOTS.map(d => (
          <span
            key={d.id}
            className="absolute rounded-full"
            style={{
              left:   `${d.x}%`,
              top:    `${d.y}%`,
              width:  `${d.size}px`,
              height: `${d.size}px`,
              background: 'var(--color-primary)',
              opacity: 0.25,
              animation: `floatDot ${d.dur}s ease-in-out ${d.delay}s infinite alternate`,
            }}
          />
        ))}
      </div>

      {/* ── Gradient blob ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          width: '600px',
          height: '400px',
          background: 'radial-gradient(ellipse, var(--color-grad-start) 0%, transparent 70%)',
          opacity: 0.08,
        }}
      />

      {/* ── Main card ── */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl w-full">

        {/* 404 number */}
        <div className="relative mb-6 select-none">
          <span
            className="text-[clamp(6rem,20vw,11rem)] font-extrabold leading-none tracking-tighter brand-gradient-text"
            aria-hidden="true"
          >
            404
          </span>
          {/* Glow behind number */}
          <span
            aria-hidden="true"
            className="absolute inset-0 text-[clamp(6rem,20vw,11rem)] font-extrabold leading-none tracking-tighter brand-gradient-text blur-2xl opacity-30"
          >
            404
          </span>
        </div>

        {/* Badge */}
        <span className="github-badge mb-5">
          <span
            className="mr-1.5 h-1.5 w-1.5 rounded-full inline-block animate-pulse"
            style={{ background: 'var(--color-primary)' }}
          />
          Page not found
        </span>

        {/* Heading */}
        <h1
          className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4"
          style={{ color: 'var(--color-text)' }}
        >
          Looks like our AI agents couldn&apos;t find this page
        </h1>

        {/* Sub-copy */}
        <p
          className="text-base max-w-md leading-relaxed mb-3"
          style={{ color: 'var(--color-text-muted)' }}
        >
          The page you&apos;re looking for doesn&apos;t exist, was moved, or the link might be broken.
          Only this page is missing — the rest of VyntRise is up and running.
        </p>

        {/* Broken URL display */}
        <div
          className="flex items-center gap-2 rounded-lg px-4 py-2 mb-8 font-mono text-xs max-w-full overflow-hidden"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
          }}
        >
          <Search className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
          <span className="truncate">{pathname || '/unknown'}</span>
        </div>

        {/* Nav quick-links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-8">
          {NAV_LINKS.map(({ href, label, icon: Icon, desc }, i) => (
            <Link
              key={href}
              href={href}
              id={`not-found-link-${i}`}
              className="group flex items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-all duration-200"
              style={{
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-primary)';
                (e.currentTarget as HTMLElement).style.background  = 'var(--color-raised)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
                (e.currentTarget as HTMLElement).style.background  = 'var(--color-surface)';
              }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: 'var(--color-raised)' }}
              >
                <Icon className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold">{label}</span>
                <span className="block text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{desc}</span>
              </span>
              <ArrowRight
                className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200"
                style={{ color: 'var(--color-primary)' }}
              />
            </Link>
          ))}

          {/* Go home — primary CTA (full width on 5-item grid) */}
          <Link
            href="/"
            id="not-found-home-cta"
            className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.01]"
            style={{ background: 'linear-gradient(135deg, var(--color-grad-start), var(--color-grad-end))' }}
          >
            <Home className="h-4 w-4" />
            Take me home
            <span
              className="ml-1 rounded-full px-2 py-0.5 text-xs font-mono"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              {counter}s
            </span>
          </Link>
        </div>

        {/* Report section */}
        <div
          className="w-full rounded-xl px-5 py-4 flex flex-col sm:flex-row items-center gap-3"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <p className="text-xs flex-1 text-left" style={{ color: 'var(--color-text-muted)' }}>
            Found a broken link? Let us know so we can fix it.
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              id="not-found-copy-url"
              onClick={copyLink}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150"
              style={{
                border: '1px solid var(--color-border)',
                background: 'var(--color-raised)',
                color: 'var(--color-text)',
              }}
              aria-label="Copy broken URL to clipboard"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Copy URL'}
            </button>
            <button
              id="not-found-report-link"
              onClick={reportLink}
              disabled={reported}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150 disabled:opacity-60"
              style={{
                background: reported ? 'var(--color-surface)' : 'var(--color-primary)',
                color: reported ? 'var(--color-text-muted)' : 'white',
                border: '1px solid transparent',
              }}
              aria-label="Report broken link via email"
            >
              <LifeBuoy className="h-3.5 w-3.5" />
              {reported ? 'Reported ✓' : 'Report link'}
            </button>
          </div>
        </div>

      </div>

      {/* ── Keyframe for floating dots ── */}
      <style>{`
        @keyframes floatDot {
          from { transform: translateY(0px) scale(1); opacity: 0.2; }
          to   { transform: translateY(-14px) scale(1.4); opacity: 0.5; }
        }
      `}</style>
    </section>
  );
}
