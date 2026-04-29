import Link from 'next/link';
import CookieSettingsButton from '@/components/CookieSettingsButton';
import VyntriseLogo from '@/components/VyntriseLogo';

const serviceLinks = [
  { label: 'AI Search & Reputation', href: '/services/ai-search' },
  { label: 'Intelligent Automation', href: '/services/intelligent-automation' },
  { label: 'Custom Software', href: '/services/custom-software' },
  { label: 'Data & Analytics', href: '/services/data-architecture' },
  { label: 'Digital Marketing', href: '/services/digital-marketing' },
];

const companyLinks = [
  { label: 'About', href: '/about' },
  { label: 'Solutions', href: '/solutions' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Contact', href: '/contact' },
];

const resourceLinks = [
  { label: 'Documentation', href: '#' },
  { label: 'API Reference', href: '#' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Support', href: '/support' },
];

const socials = [
  { href: '#', label: 'Twitter',   icon: 'X'  },
  { href: '#', label: 'LinkedIn',  icon: 'in' },
  { href: '#', label: 'GitHub',    icon: 'gh' },
  { href: '#', label: 'Instagram', icon: 'ig' },
];

export default function Footer() {
  return (
    <footer style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }}>
      <div className="container mx-auto px-4 md:px-6 pt-16 pb-8">

        {/* Top grid */}
        <div
          className="grid grid-cols-2 gap-10 md:grid-cols-4 lg:gap-8 pb-12"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          {/* Brand col */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center mb-5 group">
              <VyntriseLogo theme="auto" height={26} className="transition-opacity group-hover:opacity-80" />
            </Link>
            <p className="text-sm leading-relaxed max-w-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
              Production-grade AI and automation that drives measurable outcomes from day one.
            </p>
            <p className="text-xs leading-relaxed mb-6" style={{ color: 'var(--color-text-subtle)' }}>
              205 Van Buren St, Suite 120, #063<br />
              Herndon, VA 20170 · United States
            </p>
            <div className="flex items-center gap-2">
              {socials.map(({ icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-colors hover:text-white"
                  style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h3
              className="text-xs font-bold uppercase tracking-widest mb-5"
              style={{ color: 'var(--color-text)' }}
            >
              Services
            </h3>
            <ul className="space-y-3">
              {serviceLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3
              className="text-xs font-bold uppercase tracking-widest mb-5"
              style={{ color: 'var(--color-text)' }}
            >
              Company
            </h3>
            <ul className="space-y-3">
              {companyLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3
              className="text-xs font-bold uppercase tracking-widest mb-5"
              style={{ color: 'var(--color-text)' }}
            >
              Resources
            </h3>
            <ul className="space-y-3">
              {resourceLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-xs"
          style={{ color: 'var(--color-text-subtle)' }}
        >
          <p>© 2026 VyntRise LLC. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="transition-colors hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="transition-colors hover:text-white">Terms of Service</Link>
            <Link href="/cookies" className="transition-colors hover:text-white">Cookie Policy</Link>
            <CookieSettingsButton />
          </div>
        </div>

      </div>
    </footer>
  );
}
