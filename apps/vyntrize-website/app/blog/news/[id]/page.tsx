import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Calendar, ExternalLink, Hash, Tag } from "lucide-react";
import SchemaMarkup from "@/components/seo/SchemaMarkup";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await prisma.article.findUnique({
    where: { id },
  });

  if (!article) return { title: "Article Not Found" };

  return {
    title: `${article.title} | VyntRise News`,
    description: article.aiSummary || article.description?.slice(0, 160) || "Read this article on VyntRise.",
  };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await prisma.article.findUnique({
    where: { id },
  });

  if (!article) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <SchemaMarkup
        type="Article"
        data={{
          headline: article.title,
          description: article.aiSummary || article.description || "",
          author: {
            "@type": "Person",
            name: article.author || article.source,
          },
          datePublished: article.publishedAt.toISOString(),
          url: `https://vyntrise.com/blog/news/${article.id}`,
          image: article.image || undefined,
        }}
      />

      <article className="pt-24 pb-16 px-4 md:px-6 container mx-auto max-w-3xl">
        {/* Navigation */}
        <div className="mb-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text-muted)] hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Insights
          </Link>
        </div>

        {/* Header */}
        <header className="mb-10 pb-10" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50">
              {article.category || "Industry News"}
            </span>
            <span className="text-sm font-medium px-3 py-1 rounded-full bg-[var(--color-surface)] border" style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
              Via {article.source}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight mb-6" style={{ color: "var(--color-text)" }}>
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-sm" style={{ color: "var(--color-text-subtle)" }}>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {new Date(article.publishedAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            {article.author && (
              <div className="flex items-center gap-2 font-medium" style={{ color: "var(--color-text-muted)" }}>
                By {article.author}
              </div>
            )}
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors font-medium ml-auto"
            >
              <ExternalLink className="h-4 w-4" />
              Original Source
            </a>
          </div>
        </header>

        {/* AI Summary Banner */}
        {article.aiSummary && (
          <div className="mb-10 p-6 rounded-2xl" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="font-bold text-sm tracking-wide uppercase text-[var(--color-text)]">AI Summary</h3>
            </div>
            <p className="text-[var(--color-text-muted)] leading-relaxed text-sm md:text-base">
              {article.aiSummary}
            </p>
          </div>
        )}

        {/* Content */}
        {article.image && (
          <div className="mb-10 rounded-2xl overflow-hidden border shadow-sm" style={{ borderColor: "var(--color-border)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={article.image} 
              alt={article.title} 
              className="w-full h-auto object-cover max-h-[500px]"
            />
          </div>
        )}

        <div 
          className="prose prose-lg max-w-none prose-a:text-blue-600 hover:prose-a:text-blue-500 prose-img:rounded-xl"
          style={{ color: "var(--color-text)", whiteSpace: "pre-wrap" }}
        >
          {article.content || article.description || "Content unavailable."}
        </div>

        {/* Footer / Tags */}
        {article.tags && article.tags.length > 0 && (
          <footer className="mt-12 pt-8" style={{ borderTop: "1px solid var(--color-border)" }}>
            <div className="flex items-center gap-3">
              <Tag className="h-5 w-5 text-[var(--color-text-subtle)]" />
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span 
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-[var(--color-surface)] border hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
                  >
                    <Hash className="h-3 w-3 text-blue-500" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </footer>
        )}
      </article>
    </div>
  );
}
