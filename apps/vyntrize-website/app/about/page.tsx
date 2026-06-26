'use client';

import Link from 'next/link';
import Image from 'next/image';
import InitialsAvatar from '@/components/InitialsAvatar';
import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';
import {
  ArrowRight, Check, X, Lightbulb, Zap, BarChart3, Heart,
  Users, ShieldCheck, TrendingUp, Clock, Globe, Code, Database, Search, Sparkles,
  ExternalLink,
} from 'lucide-react';



const principles = [
  {
    icon: Lightbulb,
    color: 'bg-blue-50 text-blue-600 border-blue-100',
    tag: '// clarity first',
    title: 'Simplicity over complexity',
    body: 'We strip away the noise. Every solution we build is designed to be understood and used — not just deployed.',
  },
  {
    icon: BarChart3,
    color: 'bg-violet-50 text-violet-600 border-violet-100',
    tag: '// data-driven always',
    title: 'Strategy over guesswork',
    body: 'Every decision is guided by data. We help businesses understand their customers deeply and act with confidence.',
  },
  {
    icon: Zap,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    tag: '// outcomes, not outputs',
    title: 'Results over noise',
    body: 'We measure success by the outcomes our clients achieve — more customers, better retention, smarter operations.',
  },
  {
    icon: Heart,
    color: 'bg-amber-50 text-amber-600 border-amber-100',
    tag: '// SMBs deserve enterprise tools',
    title: 'Built for the underdog',
    body: 'Growth should not be limited by size, resources, or technical knowledge. We level the playing field.',
  },
];

const industries = [
  { icon: Search,   label: 'Healthcare & Dental',    color: 'bg-blue-50 text-blue-600 border-blue-100'    },
  { icon: Database, label: 'Financial Services',      color: 'bg-violet-50 text-violet-600 border-violet-100' },
  { icon: Globe,    label: 'Real Estate',             color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { icon: Code,     label: 'E-commerce & Retail',     color: 'bg-amber-50 text-amber-600 border-amber-100'  },
  { icon: Users,    label: 'Professional Services',   color: 'bg-rose-50 text-rose-600 border-rose-100'    },
  { icon: Sparkles, label: 'Hospitality & Food',      color: 'bg-cyan-50 text-cyan-600 border-cyan-100'    },
];

const milestones = [
  { year: '2022', label: 'Founded', body: 'VyntRise launched with a single mission: give small businesses the tools that enterprise companies take for granted.' },
  { year: '2023', label: '100 clients', body: 'Crossed 100 active clients across healthcare, e-commerce, and professional services. First AI agent deployed.' },
  { year: '2024', label: 'Scaling up', body: 'Successfully deployed autonomous agents for our early clients. Expanded services to custom data pipelines and specialized integrations.' },
  { year: '2025', label: 'Enterprise tier', body: 'Launched Enterprise plan with on-premise deployment, custom SLAs, and dedicated account management.' },
  { year: '2026', label: 'Today', body: 'Growing client base across multiple sectors. High-touch bespoke partnerships, still focused on our core mission — helping local businesses rise.' },
];

const comparison = [
  { label: 'Results in < 30 days',       us: true,  them: false },
  { label: 'Outcome-based pricing',       us: true,  them: false },
  { label: 'Explainable AI systems',      us: true,  them: false },
  { label: 'Dedicated success manager',   us: true,  them: false },
  { label: 'Built for small businesses',  us: true,  them: false },
  { label: 'Lock-in annual contracts',    us: false, them: true  },
  { label: 'Enterprise-only pricing',     us: false, them: true  },
];

const vision = [
  'Every business understands its customers deeply',
  'Every decision is guided by clear data',
  'Every entrepreneur has access to powerful growth systems',
];

const team = [
  {
    name: 'Abdisa Bati',
    title: 'Founder & CEO',
    bio: 'Visionary leader behind VyntRise. Drives the mission to bring enterprise-grade AI tools to every business, regardless of size.',
    initials: 'AB',
    color: 'bg-blue-500',
    tag: 'Founder & CEO',
    photo: null, // No photo yet — renders InitialsAvatar
    linkedin: '#',
  },
  {
    name: 'Abenezer Seyoum',
    title: 'Chief Technology Officer',
    bio: 'Leads the technical vision and engineering culture at VyntRise. Architect of the core platform and AI infrastructure.',
    initials: 'AS',
    color: 'bg-violet-500',
    tag: 'CTO',
    photo: '/images/teams/Abenezer Seyoum.png',
    linkedin: '#',
  },
  
  {
    name: 'Mesay Alemayehu',
    title: 'Digital Marketing Strategist & Business Analyst',
    bio: 'Bridges data and strategy to drive client growth. Leads digital marketing execution and business performance analysis.',
    initials: 'MA',
    color: 'bg-amber-500',
    tag: 'Marketing & Strategy',
    photo: '/images/teams/Mesay Alemayehu .jpg',
    linkedin: '#',
  },
  {
    name: 'Gedion Bula',
    title: 'Business Intelligence & Performance Manager',
    bio: 'Turns raw data into actionable insight. Manages analytics pipelines and performance reporting across all client accounts.',
    initials: 'GB',
    color: 'bg-rose-500',
    tag: 'Business Intelligence',
    photo: '/images/teams/Gedion Bula.jpg',
    linkedin: '#',
  },
  {
    name: 'Mahlet Getachew',
    title: 'Business Development Representative',
    bio: 'Drives client acquisition and partnership growth at VyntRise. Connects businesses with the right AI solutions to accelerate their outcomes.',
    initials: 'MG',
    color: 'bg-cyan-500',
    tag: 'Business Development',
    photo: '/images/teams/Mahlet Getachew .jpg', 
    linkedin: '#',
  },
  {
    name: 'Abel Legesse',
    title: 'Software Engineer',
    bio: 'Builds and maintains the custom software solutions and integrations that power VyntRise client platforms.',
    initials: 'AL',
    color: 'bg-indigo-500',
    tag: 'Engineering',
    photo: '/images/teams/Abel Legesse.jpg',
    linkedin: '#',
  },
];

const portfolio = [
  {
    client: 'Martinez Dental Group',
    industry: 'Healthcare',
    service: 'AI Search & Reputation',
    color: 'blue',
    result: '250% traffic increase. Review rating 3.8 → 4.7★ in 90 days.',
    tags: ['Local SEO', 'Review Management', 'Google Business'],
    stat: { value: '250%', label: 'traffic increase' },
  },
  {
    client: 'Crestline SaaS',
    industry: 'Technology',
    service: 'Intelligent Automation',
    color: 'violet',
    result: 'AI lead agents boosted conversion rate by 40%. 20+ hours saved per week.',
    tags: ['Lead Agents', 'CRM Sync', 'Workflow Automation'],
    stat: { value: '+40%', label: 'conversion rate' },
  },
  {
    client: 'Meridian Logistics',
    industry: 'Operations',
    service: 'Data & Analytics',
    color: 'amber',
    result: 'Unified data from 6 tools in 3 weeks. Reporting time cut from 8 hours to 45 minutes.',
    tags: ['Data Migration', 'Pipeline Sync', 'Analytics Dashboard'],
    stat: { value: '10x', label: 'faster reporting' },
  },
  {
    client: 'GrowthHub Agency',
    industry: 'Marketing',
    service: 'Custom Software',
    color: 'emerald',
    result: 'Custom client portal delivered in 3 weeks. 95% on-time, within budget.',
    tags: ['Custom Portal', 'AI Integration', 'Client Dashboard'],
    stat: { value: '3 wks', label: 'delivery time' },
  },
];

const portfolioColor: Record<string, string> = {
  blue:    'bg-blue-50 text-blue-600 border-blue-100',
  violet:  'bg-violet-50 text-violet-600 border-violet-100',
  amber:   'bg-amber-50 text-amber-600 border-amber-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
};

const portfolioBar: Record<string, string> = {
  blue:    'bg-blue-500',
  violet:  'bg-violet-500',
  amber:   'bg-amber-500',
  emerald: 'bg-emerald-500',
};export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>

      {/* ── 1. Hero ── */}
      <section className="pt-20 pb-14 px-4 md:px-6" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            {/* Left: copy */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="github-badge mb-5">OUR STORY</div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-5 leading-[1.05]" style={{ color: 'var(--color-text)' }}>
                Helping businesses{' '}
                <span className="bg-gradient-to-r from-blue-600 via-violet-500 to-blue-500 bg-clip-text text-transparent">
                  rise.
                </span>
              </h1>
              <p className="text-lg leading-relaxed mb-8 max-w-lg" style={{ color: 'var(--color-text-muted)' }}>
                VyntRise was built on a simple realization: small businesses are the backbone of the economy, yet most operate without the tools, insights, and systems they need to truly grow.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={`${process.env.NEXT_PUBLIC_CRM_URL || 'https://crm.vyntrise.com'}/book`}
                  className="group inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-colors"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--color-primary-h)'}
                  onMouseLeave={(e) => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--color-primary)'}
                >
                  Book a consultation <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-colors"
                  style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg)'}
                >
                  See our services
                </Link>
              </div>
            </motion.div>

            {/* Right: Founder Mission & Performance Stat */}
            <div className="flex flex-col gap-4">

              {/* Founder Quote Card */}
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.65, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="relative rounded-2xl p-7 overflow-hidden"
                style={{
                  border: '1px solid rgba(99,102,241,0.18)',
                  backgroundColor: 'var(--color-surface)',
                  boxShadow: '0 12px 40px rgba(99,102,241,0.06)',
                }}
              >
                <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full blur-2xl" style={{ backgroundColor: 'rgba(99,102,241,0.12)' }} />
                <div className="pointer-events-none absolute -left-12 -bottom-12 h-36 w-36 rounded-full blur-2xl" style={{ backgroundColor: 'rgba(65,165,255,0.10)' }} />
                <div className="relative">
                  <div className="text-6xl font-serif leading-none select-none mb-1" style={{ color: 'rgba(99,102,241,0.2)', lineHeight: 1 }}>&ldquo;</div>
                  <p className="text-sm md:text-base leading-relaxed font-medium mb-5" style={{ color: 'var(--color-text)' }}>
                    At VyntRise, we believe small businesses deserve the same calibre of technology and growth infrastructure as the world&apos;s largest enterprises. Our mission is to build autonomous, transparent systems that level the playing field &mdash; allowing local business owners to operate with absolute clarity and scale without limits.
                  </p>
                  <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px dashed var(--color-border)' }}>
                    <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow" style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' }}>
                      AB
                    </div>
                    <div>
                      <p className="text-sm font-bold leading-none mb-0.5" style={{ color: 'var(--color-text)' }}>Abdisa Bati</p>
                      <p className="text-[11px]" style={{ color: 'var(--color-text-subtle)' }}>Founder &amp; CEO, VyntRise</p>
                    </div>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Origin story ── */}
      <section className="px-4 md:px-6 py-20" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="container mx-auto max-w-4xl">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-subtle)' }}>How it started</p>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-8 leading-tight" style={{ color: 'var(--color-text)' }}>
            We saw the gap. We set out to close it.
          </h2>
          <div className="space-y-5 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            <p>
              Behind every local shop, service provider, or startup is an entrepreneur working tirelessly — often managing everything alone. Despite their effort, many struggle with the same challenges: attracting the right customers, retaining them, and making data-driven decisions.
            </p>
            <p>
              The tools that solve these problems exist. But they were built for enterprises with dedicated IT teams, six-figure budgets, and months to onboard. Small businesses were left with watered-down alternatives that didn&apos;t actually work.
            </p>
            <blockquote className="border-l-4 border-blue-500 pl-6 py-1 my-8">
              <p className="text-xl font-bold leading-snug" style={{ color: 'var(--color-text)' }}>
                &ldquo;We don&apos;t just provide tools. We create systems that work together to help businesses operate smarter, not harder.&rdquo;
              </p>
            </blockquote>
            <p>
              Instead of accepting that gap, we built VyntRise to bring clarity, automation, and intelligence into the hands of small business owners — helping them compete at a level once reserved for larger companies.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3. Mission + Vision ── */}
      <section className="px-4 md:px-6 py-16" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <div className="container mx-auto max-w-6xl grid md:grid-cols-2 gap-5">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}
            className="rounded-2xl p-8 shadow-sm"
            style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-subtle)' }}>Our Mission</p>
            <h3 className="text-xl font-extrabold mb-4 leading-snug" style={{ color: 'var(--color-text)' }}>
              Empower small businesses with the technology, insights, and systems they need to unlock their full potential.
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              We believe growth should not be limited by size, resources, or technical knowledge. Every business deserves access to enterprise-grade tools — and the results that come with them.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-2xl p-8 shadow-sm"
            style={{ border: '1px solid var(--color-primary)', backgroundColor: 'var(--color-primary)' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-3">Our Vision</p>
            <h3 className="text-xl font-extrabold text-white mb-6 leading-snug">
              A future where small businesses are no longer at a disadvantage.
            </h3>
            <ul className="space-y-3">
              {vision.map((v, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                  {v}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ── 4. Principles ── */}
      <section className="px-4 md:px-6 py-16" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="container mx-auto max-w-6xl">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-subtle)' }}>How we think</p>
          <h2 className="text-3xl font-extrabold mb-10" style={{ color: 'var(--color-text)' }}>The principles we build on</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {principles.map((p, i) => {
              const PIcon = p.icon;
              return (
                <motion.div key={p.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
                  style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`h-9 w-9 rounded-lg border flex items-center justify-center ${p.color}`}>
                      <PIcon className="h-4 w-4" />
                    </div>
                    <span className="font-mono text-[10px]" style={{ color: 'var(--color-text-subtle)' }}>{p.tag}</span>
                  </div>
                  <h3 className="font-bold mb-2" style={{ color: 'var(--color-text)' }}>{p.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{p.body}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 5. Timeline ── */}
      <section className="px-4 md:px-6 py-16" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <div className="container mx-auto max-w-6xl">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-subtle)' }}>Our journey</p>
          <h2 className="text-3xl font-extrabold mb-12" style={{ color: 'var(--color-text)' }}>From idea to impact</h2>
          <div className="relative">
            <div className="absolute left-[88px] top-0 bottom-0 w-px hidden md:block" style={{ backgroundColor: 'var(--color-border)' }} />
            <div className="space-y-8">
              {milestones.map((m, i) => (
                <motion.div key={m.year} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.07 }} className="flex gap-6 items-start">
                  <div className="shrink-0 w-[88px] text-right hidden md:block">
                    <span className={`text-sm font-extrabold font-mono ${m.year === '2026' ? 'text-blue-600' : ''}`} style={m.year !== '2026' ? { color: 'var(--color-text-subtle)' } : {}}>{m.year}</span>
                  </div>
                  <div className="relative hidden md:flex items-center justify-center shrink-0">
                    <div className={`h-3 w-3 rounded-full shadow-sm ${m.year === '2026' ? 'bg-blue-600' : ''}`}
                      style={m.year !== '2026' ? { backgroundColor: 'var(--color-raised)', border: '2px solid var(--color-border)' } : { border: '2px solid var(--color-bg)' }} />
                  </div>
                  <div className="flex-1 rounded-xl p-5 shadow-sm" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="md:hidden text-xs font-bold font-mono" style={{ color: 'var(--color-text-subtle)' }}>{m.year}</span>
                      <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{m.label}</span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{m.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Team ── */}
      <section className="px-4 md:px-6 py-16" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="container mx-auto max-w-6xl">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-subtle)' }}>The people</p>
          <h2 className="text-3xl font-extrabold mb-10" style={{ color: 'var(--color-text)' }}>Meet the team</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {team.map((member, i) => (
              <motion.div key={member.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }}
                className="rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
                style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-raised)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
              >
                <div className="flex flex-col items-center text-center mb-4">
                  <div className="relative h-24 w-24 mb-3 shrink-0">
                    {member.photo ? (
                      <Image src={member.photo} alt={member.name} width={96} height={96} className="rounded-full object-cover w-full h-full" style={{ outline: '4px solid var(--color-raised)' }} />
                    ) : (
                      <div style={{ outline: '4px solid var(--color-raised)', borderRadius: '9999px', display: 'inline-flex' }}>
                        <InitialsAvatar initials={member.initials} name={member.name} size={96} className="rounded-full" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{member.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{member.title}</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed mb-4 text-center" style={{ color: 'var(--color-text-muted)' }}>{member.bio}</p>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: 'var(--color-raised)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                    {member.tag}
                  </span>
                  <a href={member.linkedin} aria-label={`${member.name} on LinkedIn`} className="hover:text-blue-500 transition-colors" style={{ color: 'var(--color-text-subtle)' }}>
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                </div>
              </motion.div>
            ))}
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: team.length * 0.08 }}
              className="rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3"
              style={{ border: '1px dashed var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              <div className="h-14 w-14 rounded-full flex items-center justify-center text-2xl shadow-sm" style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-subtle)' }}>+</div>
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: 'var(--color-text)' }}>We&apos;re hiring</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>Join a team building AI tools that actually move the needle for real businesses.</p>
              </div>
              <Link href="/contact" className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                View open roles <ArrowRight className="h-3 w-3" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 8. Built different ── */}
      <section className="px-4 md:px-6 py-16" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <div className="container mx-auto max-w-4xl">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-subtle)' }}>Built different</p>
          <h2 className="text-3xl font-extrabold mb-10" style={{ color: 'var(--color-text)' }}>VyntRise vs. the typical agency</h2>
          <div className="rounded-2xl shadow-sm overflow-hidden" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
            <div className="grid grid-cols-[1fr_130px_130px] px-6 py-3.5" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-subtle)' }}>What you get</span>
              <div className="flex items-center justify-center gap-1.5">
                <div className="h-4 w-4 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--color-text)' }}>
                  <Zap className="h-2.5 w-2.5 text-white" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>VyntRise</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-center" style={{ color: 'var(--color-text-subtle)' }}>Typical Agency</span>
            </div>
            {comparison.map((row, i) => (
              <motion.div
                key={row.label}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="grid grid-cols-[1fr_130px_130px] px-6 py-3.5 items-center"
                style={{
                  borderBottom: i < comparison.length - 1 ? '1px solid var(--color-border-muted)' : 'none',
                  backgroundColor: i % 2 === 0 ? 'var(--color-bg)' : 'var(--color-surface)',
                }}
              >
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{row.label}</span>
                <div className="flex justify-center">
                  {row.us
                    ? <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500"><Check className="h-3.5 w-3.5 text-white" /></span>
                    : <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--color-raised)' }}><X className="h-3.5 w-3.5" style={{ color: 'var(--color-text-subtle)' }} /></span>
                  }
                </div>
                <div className="flex justify-center">
                  {!row.us
                    ? <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100"><Check className="h-3.5 w-3.5 text-emerald-600" /></span>
                    : <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--color-raised)' }}><X className="h-3.5 w-3.5" style={{ color: 'var(--color-text-subtle)' }} /></span>
                  }
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. CTA ── */}
      <section className="relative overflow-hidden px-4 md:px-6 py-24" style={{ backgroundColor: 'var(--color-text)' }}>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[400px] w-[700px] rounded-full bg-blue-600/15 blur-[80px]" />
          <div className="absolute left-1/4 bottom-0 h-[300px] w-[500px] rounded-full bg-violet-600/10 blur-[80px]" />
        </div>
        <div className="relative container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 mb-8">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-semibold text-white/60">14-day free trial · No credit card</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-5 tracking-tight">
            Ready to rise?
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Tell us where you are and where you want to go. We&apos;ll map the path and get you there.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={`${process.env.NEXT_PUBLIC_CRM_URL || 'https://crm.vyntrise.com'}/book`}
              className="group inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-sm font-bold text-white hover:bg-blue-500 transition-colors shadow-xl shadow-blue-900/40"
            >
              Book a free consultation <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-8 py-4 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Explore services
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-white/30">
            {['SOC 2 certified', 'GDPR compliant', '99.9% uptime SLA', 'Cancel anytime'].map(t => (
              <div key={t} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
