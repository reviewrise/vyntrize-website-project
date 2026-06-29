import { getPostBySlug, blogPosts } from '@/lib/blog';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Tag } from 'lucide-react';
import SchemaMarkup from '@/components/seo/SchemaMarkup';

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} | VyntRise Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <SchemaMarkup
        type="Article"
        data={{
          headline: post.title,
          description: post.description,
          author: {
            '@type': 'Person',
            name: post.author,
          },
          publisher: {
            '@type': 'Organization',
            name: 'VyntRise',
            url: 'https://www.vyntrise.com',
          },
          datePublished: post.publishedAt,
          dateModified: post.publishedAt,
        }}
      />

      {/* Header */}
      <section className="pt-20 pb-12 px-4 md:px-6" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <div className="container mx-auto max-w-3xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium mb-8 transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <ArrowLeft className="h-4 w-4" /> Back to blog
          </Link>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold mb-6" style={{ color: 'var(--color-text-subtle)' }}>
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
              <Tag className="h-3 w-3" /> {post.category}
            </span>
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {post.publishedAt}</span>
            <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {post.author}</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight tracking-tight mb-4" style={{ color: 'var(--color-text)' }}>
            {post.title}
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            {post.description}
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="px-4 md:px-6 py-14">
        <div className="container mx-auto max-w-3xl">
          <div
            className="prose prose-lg max-w-none"
            style={{
              '--tw-prose-headings': 'var(--color-text)',
              '--tw-prose-body': 'var(--color-text-muted)',
              '--tw-prose-bold': 'var(--color-text)',
              '--tw-prose-links': 'var(--color-primary)',
            } as React.CSSProperties}
          >
            {post.content}
          </div>

          {/* CTA Strip */}
          <div className="mt-16 rounded-2xl p-8 text-center" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <p className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-subtle)' }}>Ready to get started?</p>
            <h2 className="text-2xl font-extrabold mb-4" style={{ color: 'var(--color-text)' }}>Let VyntRise handle your review strategy — automatically.</h2>
            <Link
              href={`${process.env.NEXT_PUBLIC_CRM_URL || 'https://crm.vyntrise.com'}/book`}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-bold text-white hover:bg-blue-500 transition-colors"
            >
              Book a free consultation
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
