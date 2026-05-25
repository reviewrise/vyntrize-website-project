import Link from 'next/link';
import { ArrowRight, Home, Search, LifeBuoy } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <p className="text-[10px] font-bold uppercase tracking-widest mb-4 font-mono" style={{ color: 'var(--color-text-subtle)' }}>404</p>
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4" style={{ color: 'var(--color-text)' }}>
        Page not found
      </h1>
      <p className="text-lg max-w-md mb-10 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Home className="h-4 w-4" /> Go home
        </Link>
        <Link
          href="/services"
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
        >
          <Search className="h-4 w-4" /> Browse services
        </Link>
        <Link
          href="/support"
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
        >
          <LifeBuoy className="h-4 w-4" /> Get support
        </Link>
      </div>
    </div>
  );
}
