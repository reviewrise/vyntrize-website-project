'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check, X, ArrowRight, Zap, ChevronDown, ChevronUp,
  Star, ShieldCheck,
} from 'lucide-react';

/* ─── Plans ─── */
const plans = [
  {
    id: 'starter',
    name: 'Starter',
    desc: 'For small businesses ready to put AI to work.',
    monthly: 499,
    annual: 399,
    cta: 'Start free trial',
    ctaHref: '/contact',
    highlight: false,
    color: 'slate',
    features: [
      'AI Search & Reputation (1 location)',
      'Up to 5 automated workflows',
      'Review centralization (3 platforms)',
      'Monthly reputation report',
      'Email support',
      '99.9% uptime SLA',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    desc: 'For growing teams that need serious automation.',
    monthly: 999,
    annual: 799,
    cta: 'Start free trial',
    ctaHref: '/contact',
    highlight: true,
    badge: 'Most popular',
    color: 'blue',
    features: [
      'Everything in Starter, plus:',
      'AI Search & Reputation (up to 5 locations)',
      'Unlimited automated workflows',
      'Multi-agent orchestration',
      'Knowledge Brain (RAG) — 1 instance',
      'Review centralization (all platforms)',
      'Weekly analytics dashboard',
      'Priority 24/7 support',
      'Dedicated onboarding specialist',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    desc: 'Custom infrastructure for complex organizations.',
    monthly: null,
    annual: null,
    cta: 'Talk to sales',
    ctaHref: '/contact',
    highlight: false,
    color: 'slate',
    features: [
      'Everything in Professional, plus:',
      'Unlimited locations',
      'Custom software development',
      'Bespoke AI integrations',
      'Data architecture & pipelines',
      'On-premise deployment option',
      'Dedicated account manager',
      'Custom SLA & compliance docs',
      'Quarterly business reviews',
    ],
  },
];

/* ─── Comparison table ─── */
const featureRows = [
  {
    category: 'AI Search & Reputation',
    rows: [
      { label: 'Locations covered',      starter: '1',       pro: 'Up to 5',  enterprise: 'Unlimited'    },
      { label: 'Review platforms',        starter: '3',       pro: 'All',      enterprise: 'All + custom' },
      { label: 'AI response drafting',    starter: true,      pro: true,       enterprise: true           },
      { label: 'Reputation audits',       starter: 'Monthly', pro: 'Weekly',   enterprise: 'Real-time'    },
      { label: 'Competitor gap analysis', starter: false,     pro: true,       enterprise: true           },
    ],
  },
  {
    category: 'Automation',
    rows: [
      { label: 'Automated workflows',       starter: 'Up to 5', pro: 'Unlimited',  enterprise: 'Unlimited'  },
      { label: 'Multi-agent orchestration', starter: false,     pro: true,         enterprise: true         },
      { label: 'Knowledge Brain (RAG)',      starter: false,     pro: '1 instance', enterprise: 'Unlimited'  },
      { label: 'Custom AI integrations',    starter: false,     pro: false,        enterprise: true         },
      { label: 'Process automation (IPA)',  starter: false,     pro: true,         enterprise: true         },
    ],
  },
  {
    category: 'Data & Analytics',
    rows: [
      { label: 'Analytics dashboard',    starter: 'Monthly', pro: 'Weekly', enterprise: 'Real-time' },
      { label: 'Data pipeline connectors', starter: false,   pro: '5',      enterprise: 'Unlimited' },
      { label: 'Custom reporting',        starter: false,    pro: false,    enterprise: true        },
      { label: 'Data governance tools',   starter: false,    pro: false,    enterprise: true        },
    ],
  },
  {
    category: 'Support & Security',
    rows: [
      { label: 'Support channel',        starter: 'Email',      pro: '24/7 priority',    enterprise: 'Dedicated manager' },
      { label: 'Onboarding',             starter: 'Self-serve', pro: 'Specialist',        enterprise: 'White-glove'       },
      { label: 'Uptime SLA',             starter: '99.9%',      pro: '99.9%',             enterprise: 'Custom'            },
      { label: 'SOC 2 / HIPAA',          starter: false,        pro: true,                enterprise: true                },
      { label: 'On-premise deployment',  starter: false,        pro: false,               enterprise: true                },
    ],
  },
];

/* ─── FAQs ─── */
const faqs = [
  { q: 'Can I switch plans at any time?',    a: 'Yes. Upgrades take effect immediately and are prorated. Downgrades apply at the next billing cycle.' },
  { q: 'Is there a free trial?',             a: 'Starter and Professional both include a 14-day free trial — no credit card required.' },
  { q: 'What counts as a "location"?',       a: 'A location is a distinct business address with its own Google Business Profile and review presence.' },
  { q: 'How does annual billing work?',      a: 'Annual plans are billed upfront for 12 months and save you ~20% compared to monthly billing.' },
  { q: "What's included in Enterprise?",     a: 'Enterprise is fully custom — we scope it around your specific needs, team size, compliance requirements, and growth goals.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major credit and debit cards (Visa, Mastercard, Amex), ACH bank transfers, and wire transfers for Enterprise. All payments are processed securely via Stripe.' },
];

/* ─── Cell renderer ─── */
function CellValue({ val, isProCol }: { val: string | boolean; isProCol?: boolean }) {
  if (val === true) return (
    <span className="flex justify-center">
      <span className={`flex h-5 w-5 items-center justify-center rounded-full ${isProCol ? 'bg-blue-600' : 'bg-emerald-500'}`}>
        <Check className="h-3 w-3 text-white" />
      </span>
    </span>
  );
  if (val === false) return (
    <span className="flex justify-center">
      <X className="h-4 w-4" style={{ color: 'var(--color-border)' }} />
    </span>
  );
  return <span className={`text-xs text-center block ${isProCol ? 'font-semibold text-blue-600' : ''}`} style={!isProCol ? { color: 'var(--color-text-muted)' } : undefined}>{val}</span>;
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>

      {/* ── Header ── */}
      <section className="pt-20 pb-12 px-4 md:px-6" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <div className="container mx-auto max-w-6xl">
          <div className="github-badge mb-4">PRICING</div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight" style={{ color: 'var(--color-text)' }}>
            Simple, honest pricing
          </h1>
          <p className="text-lg mb-10 max-w-xl" style={{ color: 'var(--color-text-muted)' }}>
            No hidden fees. No lock-in. Cancel anytime. Start with a 14-day free trial.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 rounded-full p-1 shadow-sm" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
            <button onClick={() => setAnnual(false)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${!annual ? 'text-white shadow-sm' : ''}`}
              style={!annual ? { backgroundColor: 'var(--color-primary)' } : { color: 'var(--color-text-muted)' }}
              onMouseEnter={(e) => !annual && (e.currentTarget.style.color = 'var(--color-text)')}
              onMouseLeave={(e) => !annual && (e.currentTarget.style.color = 'var(--color-text-muted)')}
            >Monthly</button>
            <button onClick={() => setAnnual(true)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all flex items-center gap-2 ${annual ? 'text-white shadow-sm' : ''}`}
              style={annual ? { backgroundColor: 'var(--color-primary)' } : { color: 'var(--color-text-muted)' }}
              onMouseEnter={(e) => !annual && (e.currentTarget.style.color = 'var(--color-text)')}
              onMouseLeave={(e) => !annual && (e.currentTarget.style.color = 'var(--color-text-muted)')}
            >
              Annual
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors ${annual ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-700'}`}>Save 20%</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Pricing cards ── */}
      <section className="px-4 md:px-6 py-14">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-5 items-start">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className={`relative rounded-2xl flex flex-col overflow-hidden ${
                  plan.highlight
                    ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/25 ring-1 ring-slate-800'
                    : 'shadow-sm'
                }`}
                style={!plan.highlight ? { border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' } : undefined}
              >
                {plan.badge && (
                  <div className="absolute top-4 right-4">
                    <span className="flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white">
                      <Zap className="h-3 w-3" /> {plan.badge}
                    </span>
                  </div>
                )}

                <div className="p-7 flex-1">
                  <h3 className={`text-lg font-bold mb-1`} style={!plan.highlight ? { color: 'var(--color-text)' } : undefined}>{plan.name}</h3>
                  <p className={`text-sm mb-7 ${plan.highlight ? 'text-slate-400' : ''}`} style={!plan.highlight ? { color: 'var(--color-text-muted)' } : undefined}>{plan.desc}</p>

                  {/* Price */}
                  <div className="mb-8">
                    {plan.monthly !== null ? (
                      <>
                        <div className="flex items-end gap-1">
                          <AnimatePresence mode="wait">
                            <motion.span
                              key={annual ? 'annual' : 'monthly'}
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 6 }}
                              transition={{ duration: 0.18 }}
                              className={`text-5xl font-extrabold tracking-tight`}
                              style={!plan.highlight ? { color: 'var(--color-text)' } : undefined}
                            >
                              ${annual ? plan.annual : plan.monthly}
                            </motion.span>
                          </AnimatePresence>
                          <span className={`mb-2 text-sm ${plan.highlight ? 'text-slate-400' : ''}`} style={!plan.highlight ? { color: 'var(--color-text-subtle)' } : undefined}>/mo</span>
                        </div>
                        {annual && (
                          <p className="text-xs text-emerald-400 mt-1">
                            Billed annually — save ${((plan.monthly! - plan.annual!) * 12).toLocaleString()}/yr
                          </p>
                        )}
                        {!annual && (
                          <p className={`text-xs mt-1 ${plan.highlight ? 'text-slate-500' : ''}`} style={!plan.highlight ? { color: 'var(--color-text-subtle)' } : undefined}>
                            or ${plan.annual}/mo billed annually
                          </p>
                        )}
                      </>
                    ) : (
                      <span className={`text-4xl font-extrabold ${plan.highlight ? 'text-white' : ''}`} style={!plan.highlight ? { color: 'var(--color-text)' } : undefined}>Custom</span>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <Check className={`h-4 w-4 mt-0.5 shrink-0 ${plan.highlight ? 'text-blue-400' : 'text-emerald-500'}`} />
                        <span className={plan.highlight ? 'text-slate-300' : ''} style={!plan.highlight ? { color: 'var(--color-text-muted)' } : undefined}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-7 pt-0">
                  <Link
                    href={plan.ctaHref}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors ${
                      plan.highlight
                        ? 'bg-blue-600 text-white hover:bg-blue-500'
                        : ''
                    }`}
                    style={!plan.highlight ? { border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' } : undefined}
                    onMouseEnter={(e) => !plan.highlight && (e.currentTarget.style.backgroundColor = 'var(--color-surface)')}
                    onMouseLeave={(e) => !plan.highlight && (e.currentTarget.style.backgroundColor = 'var(--color-bg)')}
                  >
                    {plan.cta} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trust row */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs" style={{ color: 'var(--color-text-subtle)' }}>
            {['14-day free trial', 'No credit card required', 'Cancel anytime', 'SOC 2 certified'].map(t => (
              <div key={t} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature comparison table ── */}
      <section className="px-4 md:px-6 py-16">
        <div className="container mx-auto max-w-6xl">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-subtle)' }}>Full comparison</p>
          <h2 className="text-2xl font-extrabold mb-8" style={{ color: 'var(--color-text)' }}>Everything, side by side</h2>
          <div className="rounded-2xl shadow-sm overflow-hidden" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
            <div className="grid grid-cols-[1fr_110px_110px_110px] px-6 py-3.5" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
              <span />
              {plans.map(p => (
                <span key={p.id} className={`text-[11px] font-bold text-center ${p.highlight ? 'text-blue-600' : ''}`} style={!p.highlight ? { color: 'var(--color-text-muted)' } : undefined}>{p.name}</span>
              ))}
            </div>
            {featureRows.map(section => (
              <div key={section.category}>
                <div className="px-6 py-2.5" style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-subtle)' }}>{section.category}</span>
                </div>
                {section.rows.map((row, i) => (
                  <div key={row.label} className={`grid grid-cols-[1fr_110px_110px_110px] px-6 py-3 items-center border-b last:border-0`} style={{ borderColor: 'var(--color-border)', backgroundColor: i % 2 === 0 ? 'var(--color-bg)' : 'var(--color-surface)' }}>
                    <span className="text-sm" style={{ color: 'var(--color-text)' }}>{row.label}</span>
                    <CellValue val={row.starter} />
                    <CellValue val={row.pro} isProCol />
                    <CellValue val={row.enterprise} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-4 md:px-6 py-16" style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <div className="container mx-auto max-w-6xl grid lg:grid-cols-[1fr_2fr] gap-12">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-subtle)' }}>FAQ</p>
            <h2 className="text-2xl font-extrabold mb-3" style={{ color: 'var(--color-text)' }}>Common questions</h2>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-text-muted)' }}>Can&apos;t find what you&apos;re looking for?</p>
            <Link href="/faq" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              Browse all FAQs <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl overflow-hidden shadow-sm" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left gap-4">
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="h-4 w-4 shrink-0" style={{ color: 'var(--color-text-subtle)' }} /> : <ChevronDown className="h-4 w-4 shrink-0" style={{ color: 'var(--color-text-subtle)' }} />}
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="overflow-hidden">
                      <p className="px-5 pb-4 text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden bg-slate-900 px-4 md:px-6 py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[400px] w-[700px] rounded-full bg-blue-600/15 blur-[80px]" />
          <div className="absolute left-1/4 bottom-0 h-[300px] w-[500px] rounded-full bg-violet-600/10 blur-[80px]" />
        </div>
        <div className="relative container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 mb-8">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-300">No sales pressure — just honest advice</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-5 tracking-tight">
            Not sure which plan fits?
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Tell us about your business and we&apos;ll recommend the right starting point — free, no commitment.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-sm font-bold text-white hover:bg-blue-500 transition-colors shadow-xl shadow-blue-900/40"
            >
              Talk to us <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-8 py-4 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Explore services
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
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
