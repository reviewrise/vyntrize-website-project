'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Menu, X, ArrowRight, ChevronDown, Search, Bot, Code, Database, Sparkles, Stethoscope, ShoppingCart, BarChart3, Building2, LifeBuoy, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import VyntriseLogo from '@/components/VyntriseLogo';
import ThemeToggle from '@/components/ThemeToggle';

const services = [
  { label: 'AI Search & Reputation', desc: 'Dominate search and build trust',  href: '/services/ai-search',               icon: Search,   color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30'    },
  { label: 'Intelligent Automation', desc: 'Agents that think and act 24/7',   href: '/services/intelligent-automation',  icon: Bot,      color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/30' },
  { label: 'Custom Software',        desc: 'Built for your exact workflow',     href: '/services/custom-software',         icon: Code,     color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
  { label: 'Data & Analytics',       desc: 'Chaos to clarity',                 href: '/services/data-architecture',       icon: Database, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30'   },
  { label: 'Digital Marketing',      desc: 'Human creativity, AI scale',       href: '/services/digital-marketing',       icon: Sparkles, color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30'     },
];

const solutions = [
  { label: 'Healthcare',         href: '/solutions', icon: Stethoscope },
  { label: 'E-commerce',         href: '/solutions', icon: ShoppingCart },
  { label: 'Financial Services', href: '/solutions', icon: BarChart3 },
  { label: 'Real Estate',        href: '/solutions', icon: Building2 },
];

const resources = [
  { label: 'FAQ',     desc: 'Common questions answered', href: '/faq',     icon: HelpCircle },
  { label: 'Support', desc: 'Get help from our team',    href: '/support', icon: LifeBuoy   },
];

function NavDropdown({ label, children, isActive }: { label: string; children: React.ReactNode; isActive: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          isActive || open
            ? 'text-[var(--color-text)] bg-[var(--color-surface)]'
            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]'
        }`}
      >
        {label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full left-0 mt-1.5 z-50"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  const isServicesActive  = pathname.startsWith('/services');
  const isSolutionsActive = pathname.startsWith('/solutions');
  const isResourcesActive = pathname.startsWith('/faq') || pathname.startsWith('/support');
  const isWorkActive      = pathname.startsWith('/work');

  const isSeoActive       = pathname.startsWith('/seo-analyzer');

  const flatLinks = [
    { name: 'Work',    href: '/work',    isActive: isWorkActive    },
    // { name: 'Pricing', href: '/pricing', isActive: pathname === '/pricing' },
    { name: 'About',   href: '/about',   isActive: pathname === '/about'   },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">

        <Link href="/" className="flex items-center group shrink-0" onClick={() => setMobileOpen(false)}>
          <VyntriseLogo theme="auto" height={28} />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">

          {/* Services mega menu */}
          <NavDropdown label="Services" isActive={isServicesActive}>
            <div className="w-[520px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-xl shadow-black/20 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] px-2 mb-3">Service lines</p>
              <div className="grid grid-cols-1 gap-0.5">
                {services.map(s => {
                  const SIcon = s.icon;
                  return (
                    <Link key={s.href} href={s.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[var(--color-surface)] transition-colors group">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}>
                        <SIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">{s.label}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{s.desc}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                <Link href="/services" className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[var(--color-surface)] transition-colors group">
                  <span className="text-sm font-semibold text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]">View all services</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[var(--color-text-muted)] group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </NavDropdown>

          {/* Solutions dropdown — temporarily hidden, page preserved at /solutions */}
          {/* <NavDropdown label="Solutions" isActive={isSolutionsActive}>
            <div className="w-52 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-xl shadow-black/20 p-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] px-3 py-2">Industries</p>
              {solutions.map(s => {
                const SIcon = s.icon;
                return (
                  <Link key={s.label} href={s.href} className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-[var(--color-surface)] transition-colors group">
                    <SIcon className="h-4 w-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors shrink-0" />
                    <span className="text-sm font-medium text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]">{s.label}</span>
                  </Link>
                );
              })}
              <div className="mt-1 pt-1 border-t border-[var(--color-border)]">
                <Link href="/solutions" className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors group">
                  <span className="text-xs font-semibold text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]">All industries</span>
                  <ArrowRight className="h-3 w-3 text-[var(--color-text-muted)]" />
                </Link>
              </div>
            </div>
          </NavDropdown> */}

          {/* Flat links */}
          {flatLinks.map(link => (
            <Link key={link.name} href={link.href}
              className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
              style={{
                backgroundColor: link.isActive ? 'var(--color-surface)' : 'transparent',
                color: link.isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
              }}
            >
              {link.name}
            </Link>
          ))}

          {/* SEO Analyzer — free tool */}
          <a
            href="https://seo-analyzer.vyntrise.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
            style={{
              backgroundColor: isSeoActive ? 'var(--color-surface)' : 'transparent',
              color: isSeoActive ? 'var(--color-text)' : 'var(--color-text-muted)',
            }}
          >
            SEO Analyzer
            <span
              className="text-[9px] font-bold rounded-full px-1.5 py-0.5 leading-none"
              style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
            >
              FREE
            </span>
          </a>

          {/* Resources dropdown */}
          <NavDropdown label="Resources" isActive={isResourcesActive}>
            <div className="w-52 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-xl shadow-black/20 p-2">
              {resources.map(r => {
                const RIcon = r.icon;
                return (
                  <Link key={r.label} href={r.href} className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 hover:bg-[var(--color-surface)] transition-colors group">
                    <RIcon className="h-4 w-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]">{r.label}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{r.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </NavDropdown>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <Link href="/contact" className="text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors px-2">
            Contact
          </Link>
          <a href={`${process.env.NEXT_PUBLIC_CRM_URL || 'https://crm.vyntrise.com'}/book`} className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-h)] transition-colors">
            Book a Consultation <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Mobile: theme toggle + hamburger */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="md:hidden overflow-hidden border-t border-[var(--color-border)] bg-[var(--color-bg)]"
          >
            <nav className="flex flex-col px-4 py-3 gap-0.5">
              {/* Services accordion */}
              <div>
                <button
                  onClick={() => setMobileExpanded(mobileExpanded === 'services' ? null : 'services')}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: isServicesActive ? 'var(--color-surface)' : 'transparent',
                    color: isServicesActive ? 'var(--color-text)' : 'var(--color-text-muted)',
                  }}
                >
                  Services
                  <ChevronDown className={`h-4 w-4 transition-transform ${mobileExpanded === 'services' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {mobileExpanded === 'services' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
                      <div className="pl-3 pt-1 pb-1 space-y-0.5">
                        {services.map(s => {
                          const SIcon = s.icon;
                          return (
                            <Link key={s.href} href={s.href} onClick={() => setMobileOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              <div className={`h-6 w-6 rounded-md flex items-center justify-center shrink-0 ${s.color}`}><SIcon className="h-3.5 w-3.5" /></div>
                              {s.label}
                            </Link>
                          );
                        })}
                        <Link href="/services" onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold"
                          style={{ color: 'var(--color-primary)' }}
                        >
                          All services <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Solutions accordion — temporarily hidden, page preserved at /solutions */}
              {/* ... */}

              {/* Flat links */}
              {[...flatLinks, { name: 'FAQ', href: '/faq', isActive: pathname === '/faq' }, { name: 'Support', href: '/support', isActive: pathname === '/support' }].map(link => (
                <Link key={link.name} href={link.href} onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium rounded-lg transition-colors"
                  style={{
                    backgroundColor: link.isActive ? 'var(--color-surface)' : 'transparent',
                    color: link.isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
                  }}
                >
                  {link.name}
                </Link>
              ))}

              {/* SEO Analyzer — mobile */}
              <a href="https://vyntrise.com/en" target="_blank" rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors"
                style={{
                  color: 'var(--color-text-muted)',
                }}
              >
                SEO Analyzer
                <span className="text-[9px] font-bold rounded-full px-1.5 py-0.5 leading-none"
                  style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}>
                  FREE
                </span>
              </a>

              <div className="mt-3 pt-3 flex flex-col gap-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                <Link href="/contact" onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium rounded-lg transition-colors"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Contact
                </Link>
                <a href={`${process.env.NEXT_PUBLIC_CRM_URL || 'https://crm.vyntrise.com'}/book`} onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  Book a Consultation <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
