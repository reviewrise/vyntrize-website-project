'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { cases, colorTokens } from '@/lib/work-data';

export default function AdminProjects() {
  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--color-text)' }}>Projects</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{cases.length} published · Add new projects via <code className="font-mono text-xs">lib/work-data.ts</code></p>
        </div>
        <Link href="/work" target="_blank"
          className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-xl px-4 py-2 transition-colors"
          style={{ backgroundColor: 'var(--color-raised)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
          <ExternalLink className="h-3.5 w-3.5" /> View public page
        </Link>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
        <div className="grid grid-cols-[60px_1fr_120px_100px_80px] px-5 py-3 text-[10px] font-bold uppercase tracking-widest"
          style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
          <span>Preview</span><span>Project</span><span>Service</span><span>Type</span><span>Year</span>
        </div>

        <div style={{ backgroundColor: 'var(--color-bg)' }}>
          {cases.map((c, i) => {
            const col = colorTokens[c.color];
            const CIcon = c.icon;
            return (
              <div key={c.slug}
                className="grid grid-cols-[60px_1fr_120px_100px_80px] px-5 py-4 items-center"
                style={{ borderBottom: i < cases.length - 1 ? '1px solid var(--color-border)' : 'none' }}>

                {/* Preview */}
                <div className="h-10 w-10 rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--color-raised)' }}>
                  {c.heroImage ? (
                    <div className="relative h-full w-full">
                      <Image src={c.heroImage} alt={c.client} fill className="object-cover" sizes="40px" />
                    </div>
                  ) : (
                    <div className={`h-full w-full flex items-center justify-center ${col.icon}`}>
                      <CIcon className="h-4 w-4" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{c.client}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{c.industry}</p>
                </div>

                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{c.service}</p>

                <span className={`text-[10px] font-semibold rounded-full border px-2 py-0.5 w-fit ${col.badge}`}>
                  {c.visualType}
                </span>

                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{c.year}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Adding a new project</p>
        <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--color-text-muted)' }}>
          Projects are managed in <code className="font-mono">lib/work-data.ts</code>. Add a new entry to the <code className="font-mono">cases</code> array, drop images in <code className="font-mono">public/images/work/</code>, and set <code className="font-mono">visualType: &apos;portfolio&apos;</code> for image-based projects.
        </p>
        <Link href="/work" target="_blank" className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
          Preview work page <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
