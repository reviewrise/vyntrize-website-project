import Link from 'next/link';
import { ArrowRight, Home, Search, LifeBuoy } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 font-mono">404</p>
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
        Page not found
      </h1>
      <p className="text-lg text-slate-500 max-w-md mb-10 leading-relaxed">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
        >
          <Home className="h-4 w-4" /> Go home
        </Link>
        <Link
          href="/services"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Search className="h-4 w-4" /> Browse services
        </Link>
        <Link
          href="/support"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <LifeBuoy className="h-4 w-4" /> Get support
        </Link>
      </div>
    </div>
  );
}
