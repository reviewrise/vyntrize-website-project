'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown, ChevronUp, ArrowRight, Search,
  Bot, CreditCard, ShieldCheck, Zap, Code, LifeBuoy,
} from 'lucide-react';

const categories = [
  { id: 'all', label: 'All', icon: Search },
  { id: 'general', label: 'General', icon: Zap },
  { id: 'automation', label: 'Automation', icon: Bot },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'security', label: 'Security & Privacy', icon: ShieldCheck },
  { id: 'technical', label: 'Technical', icon: Code },
  { id: 'support', label: 'Support', icon: LifeBuoy },
];

const faqs = [
  // General
  {
    category: 'general',
    q: 'What is VyntRise?',
    a: 'VyntRise is an AI-powered business growth platform. We combine intelligent automation, AI search & reputation management, custom software, and data architecture to help businesses scale faster with less manual effort.',
  },
  {
    category: 'general',
    q: 'Who is VyntRise built for?',
    a: 'We work with small businesses, growing teams, and enterprise organizations across healthcare, e-commerce, financial services, real estate, and more. If you have repetitive processes or want to grow your online presence, VyntRise can help.',
  },
  {
    category: 'general',
    q: 'How quickly can I see results?',
    a: 'Most clients see measurable outcomes within 30 days of onboarding. Automation workflows typically go live within the first two weeks, and reputation improvements are visible within the first month.',
  },
  {
    category: 'general',
    q: 'Do I need technical knowledge to use VyntRise?',
    a: 'No. Our platform is designed for business owners and operators, not engineers. We handle the technical setup and provide intuitive dashboards for day-to-day use. For custom software projects, our team manages the full build.',
  },
  // Automation
  {
    category: 'automation',
    q: 'What are autonomous AI agents?',
    a: 'Autonomous agents are AI-powered bots that can perceive context, make decisions, and execute tasks end-to-end — without human intervention. Examples include lead qualification agents, customer support bots, and internal knowledge assistants.',
  },
  {
    category: 'automation',
    q: 'What is a Knowledge Brain (RAG)?',
    a: 'A Knowledge Brain is a retrieval-augmented generation (RAG) system trained on your business data — documents, SOPs, FAQs, product catalogs. It lets your team (or customers) ask natural-language questions and get accurate, sourced answers instantly.',
  },
  {
    category: 'automation',
    q: 'How many workflows can I automate?',
    a: 'Starter plans support up to 5 automated workflows. Professional and Enterprise plans offer unlimited workflows. We can automate anything from lead follow-up sequences to invoice processing and internal approvals.',
  },
  {
    category: 'automation',
    q: 'What tools and platforms do you integrate with?',
    a: 'We support 500+ integrations including Salesforce, HubSpot, Shopify, QuickBooks, Google Workspace, Slack, Zapier, and more. Custom integrations are available on Enterprise plans.',
  },
  // Billing
  {
    category: 'billing',
    q: 'Is there a free trial?',
    a: 'Yes. Starter and Professional plans both include a 14-day free trial with no credit card required. You get full access to all features in your chosen plan during the trial.',
  },
  {
    category: 'billing',
    q: 'Can I switch plans at any time?',
    a: 'Absolutely. Upgrades take effect immediately and are prorated. Downgrades apply at the start of your next billing cycle. You can manage your plan from your account dashboard.',
  },
  {
    category: 'billing',
    q: 'How does annual billing work?',
    a: 'Annual plans are billed upfront for 12 months and save you approximately 20% compared to monthly billing. You\'ll receive a single invoice at the start of each year.',
  },
  {
    category: 'billing',
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit and debit cards (Visa, Mastercard, Amex), ACH bank transfers, and wire transfers for Enterprise contracts. All payments are processed securely via Stripe.',
  },
  {
    category: 'billing',
    q: 'Can I cancel at any time?',
    a: 'Yes. Monthly plans can be cancelled at any time with no penalty — your access continues until the end of the current billing period. Annual plans can be cancelled but are non-refundable after the first 30 days.',
  },
  // Security
  {
    category: 'security',
    q: 'Is VyntRise SOC 2 compliant?',
    a: 'Yes. VyntRise is SOC 2 Type II certified. We also support GDPR, CCPA, and HIPAA compliance requirements. Compliance documentation is available to Enterprise customers upon request.',
  },
  {
    category: 'security',
    q: 'Where is my data stored?',
    a: 'Data is stored in encrypted, geo-redundant cloud infrastructure in the US by default. EU data residency is available for Enterprise customers. We never sell or share your data with third parties.',
  },
  {
    category: 'security',
    q: 'How is my data used to train AI models?',
    a: 'Your data is never used to train shared or public AI models. Any AI models trained on your data (e.g., Knowledge Brain) are private to your account and isolated from other customers.',
  },
  // Technical
  {
    category: 'technical',
    q: 'What is your uptime SLA?',
    a: 'We guarantee 99.9% uptime for Starter and Professional plans. Enterprise customers can negotiate custom SLAs. Our status page at status.vyntrise.com shows real-time system health.',
  },
  {
    category: 'technical',
    q: 'Do you offer an API?',
    a: 'Yes. Our REST API allows you to trigger workflows, query analytics, and manage your account programmatically. API documentation is available in the developer portal. API access is included on Professional and Enterprise plans.',
  },
  {
    category: 'technical',
    q: 'Can VyntRise be deployed on-premise?',
    a: 'On-premise deployment is available for Enterprise customers with specific compliance or infrastructure requirements. Contact our sales team to discuss your needs.',
  },
  {
    category: 'technical',
    q: 'What happens to my data if I cancel?',
    a: 'You can export all your data at any time from your dashboard. After cancellation, your data is retained for 30 days before permanent deletion. We can provide a full data export upon request.',
  },
  // Support
  {
    category: 'support',
    q: 'What support options are available?',
    a: 'Starter plans include email support with a 24-hour response time. Professional plans get 24/7 priority support via email and live chat. Enterprise customers receive a dedicated account manager and phone support.',
  },
  {
    category: 'support',
    q: 'How do I get onboarded?',
    a: 'Starter customers get access to our self-serve onboarding portal with video guides and documentation. Professional customers are assigned a dedicated onboarding specialist. Enterprise customers receive a white-glove onboarding experience.',
  },
  {
    category: 'support',
    q: 'Do you offer training for my team?',
    a: 'Yes. We offer live training sessions, recorded walkthroughs, and a comprehensive knowledge base. Enterprise plans include custom training programs tailored to your team\'s workflows.',
  },
];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [query, setQuery] = useState('');

  const filtered = faqs.filter((f) => {
    const matchesCategory = activeCategory === 'all' || f.category === activeCategory;
    const matchesQuery =
      query.trim() === '' ||
      f.q.toLowerCase().includes(query.toLowerCase()) ||
      f.a.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="flex flex-col min-h-screen bg-white">

      {/* Hero */}
      <section className="border-b border-slate-100 bg-slate-50/60 pt-20 pb-12 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="github-badge mb-4">FAQ</div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4 leading-tight">
            Frequently asked questions
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mb-8">
            Everything you need to know about VyntRise. Can&apos;t find an answer?{' '}
            <Link href="/support" className="text-blue-600 hover:underline">Reach our support team.</Link>
          </p>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search questions..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpenFaq(null); }}
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="px-4 md:px-6 py-12">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row gap-10">

          {/* Sidebar categories */}
          <aside className="md:w-52 shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Categories</p>
            <nav className="flex flex-row md:flex-col gap-1 flex-wrap">
              {categories.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { setActiveCategory(id); setOpenFaq(null); }}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-left transition-colors ${
                    activeCategory === id
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          {/* FAQ list */}
          <div className="flex-1 min-w-0">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Search className="h-8 w-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No results found. Try a different search or{' '}
                  <Link href="/support" className="text-blue-600 hover:underline">contact support</Link>.
                </p>
              </div>
            ) : (
              <motion.div
                key={activeCategory + query}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                {filtered.map((faq, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
                    >
                      <span className="text-sm font-semibold text-slate-900">{faq.q}</span>
                      {openFaq === i
                        ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                        : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                      }
                    </button>
                    <AnimatePresence>
                      {openFaq === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                          className="overflow-hidden"
                        >
                          <p className="px-5 pb-4 text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 md:px-6 py-16 bg-slate-900 mt-auto">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl font-extrabold text-white mb-3">Still have questions?</h2>
            <p className="text-slate-400 max-w-md text-sm">
              Our team is happy to help. Reach out and we&apos;ll get back to you within one business day.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link href="/support" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
              Visit support <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
              Contact us
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
