import Link from 'next/link';
import { blogPosts } from '@/lib/blog';
import { ArrowRight, Calendar, User, TrendingUp, Sparkles, ExternalLink } from 'lucide-react';
import SchemaMarkup from '@/components/seo/SchemaMarkup';
import { getTrendingArticles, getRecommendedForYou } from '@/lib/recommendations';

export const metadata = {
  title: 'Blog | VyntRise AI & Automation Insights',
  description: 'Read the latest insights from VyntRise on how small businesses can leverage AI, automation, and data to drive growth.',
};

export default async function BlogIndexPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const resolvedSearchParams = await searchParams
  const page = parseInt(resolvedSearchParams.page || "1", 10);
  
  // Fetch AI recommendations from our new engine
  const trendingResponse = await getTrendingArticles(page);
  const recommendedResponse = await getRecommendedForYou(page);

  const trendingArticles = trendingResponse.data;
  const recommendedArticles = recommendedResponse.data;
  const totalPages = Math.max(trendingResponse.pagination.totalPages, recommendedResponse.pagination.totalPages);

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Schema */}
      <SchemaMarkup
        type="Article"
        data={{
          headline: metadata.title,
          description: metadata.description,
          author: {
            "@type": "Organization",
            name: "VyntRise"
          }
        }}
      />

      {/* Hero */}
      <section className="pt-20 pb-12 px-4 md:px-6" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <div className="container mx-auto max-w-4xl text-center">
          <div className="github-badge mb-4 mx-auto">INSIGHTS</div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight" style={{ color: 'var(--color-text)' }}>
            Insights &amp; Strategy
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--color-text-muted)' }}>
            Actionable strategies and thoughts on how small businesses can leverage modern technology to scale efficiently.
          </p>
        </div>
      </section>

      {/* Blog List */}
      <section className="px-4 md:px-6 py-16">
        <div className="container mx-auto max-w-4xl space-y-8">
          {blogPosts.map((post) => (
            <article 
              key={post.slug} 
              className="rounded-2xl p-6 md:p-8 transition-shadow shadow-sm hover:shadow-md"
              style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}
            >
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold mb-4" style={{ color: 'var(--color-text-subtle)' }}>
                <span className="uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{post.category}</span>
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {post.publishedAt}</span>
                <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {post.author}</span>
              </div>
              <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>
                <Link href={`/blog/${post.slug}`} className="hover:underline decoration-blue-500">
                  {post.title}
                </Link>
              </h2>
              <p className="text-base leading-relaxed mb-6" style={{ color: 'var(--color-text-muted)' }}>
                {post.description}
              </p>
              <Link 
                href={`/blog/${post.slug}`} 
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Read article <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* AI Recommendations - Trending */}
      {trendingArticles.length > 0 && (
        <section className="px-4 md:px-6 py-12" style={{ backgroundColor: 'var(--color-surface)' }}>
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-6 w-6 text-orange-500" />
              <h2 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>Trending Industry News</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {trendingArticles.map((article) => (
                <Link 
                  key={article.id} 
                  href={`/blog/news/${article.id}`}
                  className="block p-5 rounded-xl border hover:shadow-md transition-shadow group"
                  style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">{article.category}</span>
                    <ExternalLink className="h-4 w-4 text-[var(--color-text-subtle)] group-hover:text-blue-500 transition-colors" />
                  </div>
                  <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--color-text)' }}>{article.title}</h3>
                  {article.aiSummary && (
                    <p className="text-sm mb-3 line-clamp-3" style={{ color: 'var(--color-text-muted)' }}>
                      <span className="font-semibold text-blue-600">AI Summary:</span> {article.aiSummary}
                    </p>
                  )}
                  <div className="text-xs font-medium" style={{ color: 'var(--color-text-subtle)' }}>
                    From {article.source} • Score: {article.score}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* AI Recommendations - For You */}
      {recommendedArticles.length > 0 && (
        <section className="px-4 md:px-6 py-12 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-6 w-6 text-purple-500" />
              <h2 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>Recommended For You</h2>
            </div>
            <div className="space-y-4">
              {recommendedArticles.map((article) => (
                <Link 
                  key={article.id} 
                  href={`/blog/news/${article.id}`}
                  className="flex flex-col md:flex-row gap-4 p-5 rounded-xl border hover:shadow-md transition-all group"
                  style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">{article.category}</span>
                      <span className="text-xs font-medium" style={{ color: 'var(--color-text-subtle)' }}>{article.source}</span>
                    </div>
                    <h3 className="font-bold text-xl mb-2" style={{ color: 'var(--color-text)' }}>{article.title}</h3>
                    <p className="text-sm line-clamp-3" style={{ color: 'var(--color-text-muted)' }}>
                      {article.aiSummary || article.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <section className="px-4 md:px-6 py-8 border-t" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="container mx-auto max-w-4xl flex items-center justify-between">
            <div className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-4">
              {page > 1 ? (
                <Link 
                  href={`/blog?page=${page - 1}`}
                  className="px-4 py-2 text-sm font-medium rounded-lg border hover:bg-gray-50 transition-colors"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', backgroundColor: 'var(--color-bg)' }}
                >
                  Previous
                </Link>
              ) : (
                <button disabled className="px-4 py-2 text-sm font-medium rounded-lg border opacity-50 cursor-not-allowed" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', backgroundColor: 'var(--color-bg)' }}>
                  Previous
                </button>
              )}
              
              {page < totalPages ? (
                <Link 
                  href={`/blog?page=${page + 1}`}
                  className="px-4 py-2 text-sm font-medium rounded-lg border hover:bg-gray-50 transition-colors"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', backgroundColor: 'var(--color-bg)' }}
                >
                  Next
                </Link>
              ) : (
                <button disabled className="px-4 py-2 text-sm font-medium rounded-lg border opacity-50 cursor-not-allowed" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', backgroundColor: 'var(--color-bg)' }}>
                  Next
                </button>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
