import React from 'react';
import Link from 'next/link';

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  author: string;
  category: string;
  content: React.ReactNode;
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'how-to-get-more-5-star-google-reviews',
    title: 'How to Get More 5-Star Google Reviews (Without Being Pushy)',
    description: 'A practical guide for local businesses to increase their Google Business Profile ratings ethically and effectively.',
    publishedAt: '2026-06-25',
    author: 'Mesay Alemayehu',
    category: 'SEO',
    content: (
      <>
        <p className="mb-6">
          For small businesses, Google Reviews are the digital equivalent of word-of-mouth. A strong rating can make the difference between a thriving business and one that struggles to attract new customers. But how do you get more 5-star reviews without sounding desperate or pushy?
        </p>
        <h2 className="text-2xl font-bold mt-8 mb-4">1. Ask at the Right Time</h2>
        <p className="mb-6">
          Timing is everything. The best time to ask for a review is immediately after a successful transaction or a positive interaction.
        </p>
        <h2 className="text-2xl font-bold mt-8 mb-4">2. Make it Easy</h2>
        <p className="mb-6">
          Don't make your customers hunt for your Google Business Profile. Provide a direct link to your review page.
        </p>
        <h2 className="text-2xl font-bold mt-8 mb-4">3. Respond to All Reviews (Even the Bad Ones)</h2>
        <p className="mb-6">
          When you respond to reviews, it shows that you care about your customers' feedback.
        </p>
        <h2 className="text-2xl font-bold mt-8 mb-4">4. Automate the Ask</h2>
        <p className="mb-6">
          If you have a CRM or an email marketing system, you can automate the process of asking for reviews.
        </p>
      </>
    )
  },
  {
    slug: 'ai-tools-for-small-business-in-2026',
    title: 'AI Tools for Small Business in 2026: What Actually Works',
    description: 'An overview of the most effective AI tools for small business growth, focusing on real automation over hype.',
    publishedAt: '2026-06-27',
    author: 'Biniyam Lombe',
    category: 'Automation',
    content: (
      <>
        <p className="mb-6">
          The AI landscape is noisy, but small businesses don't need shiny toys—they need tools that actually save time and generate revenue. From AI agents handling your CRM to automated review responses, here are the top tools moving the needle in 2026.
        </p>
      </>
    )
  },
  {
    slug: 'how-to-respond-to-negative-reviews',
    title: 'How to Respond to Negative Reviews (With Examples)',
    description: 'Turn a negative review into a positive customer service win using these proven response templates.',
    publishedAt: '2026-06-27',
    author: 'Mesay Alemayehu',
    category: 'Reputation',
    content: (
      <>
        <p className="mb-6">
          Negative reviews happen to every business. But a 1-star review isn't the end of the world—it's an opportunity to showcase your customer service to future potential clients.
        </p>
      </>
    )
  },
  {
    slug: 'local-seo-for-restaurants',
    title: 'Local SEO for Restaurants: The Complete 2026 Guide',
    description: 'Everything a restaurant owner needs to know to rank #1 on Google Maps and drive foot traffic.',
    publishedAt: '2026-06-27',
    author: 'Gedion Bula',
    category: 'SEO',
    content: (
      <>
        <p className="mb-6">
          When people search for "restaurants near me," they rarely scroll past the first three results on Google Maps. If your restaurant isn't in the Local Pack, you are losing out on significant revenue.
        </p>
      </>
    )
  },
  {
    slug: 'birdeye-vs-podium-vs-vyntrise',
    title: 'Birdeye vs Podium vs VyntRise: Honest Comparison',
    description: 'A deep dive into the top reputation management platforms for small businesses, comparing features, pricing, and ROI.',
    publishedAt: '2026-06-27',
    author: 'Abdisa Bati',
    category: 'Comparison',
    content: (
      <>
        <p className="mb-6">
          Choosing the right reputation management software can be overwhelming. While legacy platforms like Birdeye and Podium have dominated the market, modern AI-first platforms like VyntRise are changing the game.
        </p>
      </>
    )
  },
  {
    slug: 'what-is-reputation-management',
    title: 'What is Reputation Management? (And Why Small Businesses Need It)',
    description: 'Understand the core concepts of online reputation management and why it directly impacts your bottom line.',
    publishedAt: '2026-06-27',
    author: 'Mahlet Getachew',
    category: 'Reputation',
    content: (
      <>
        <p className="mb-6">
          Your online reputation is your new storefront. 93% of consumers read online reviews before deciding to purchase from a local business. Reputation management is the proactive process of controlling that narrative.
        </p>
      </>
    )
  },
  {
    slug: 'ai-automation-for-restaurants',
    title: 'AI Automation for Restaurants: Save 20+ Hours/Week',
    description: 'How restaurants are using AI to automate reservations, inventory, and customer feedback.',
    publishedAt: '2026-06-27',
    author: 'Biniyam Lombe',
    category: 'Automation',
    content: (
      <>
        <p className="mb-6">
          Restaurant owners are stretched thin. Between managing staff, ordering inventory, and ensuring food quality, marketing and customer follow-ups often fall by the wayside. AI automation changes that.
        </p>
      </>
    )
  },
  {
    slug: 'how-to-optimize-google-business-profile-2026',
    title: 'How to Optimize Your Google Business Profile in 2026',
    description: 'A step-by-step checklist to maximize your visibility on Google Search and Maps.',
    publishedAt: '2026-06-27',
    author: 'Mesay Alemayehu',
    category: 'SEO',
    content: (
      <>
        <p className="mb-6">
          Your Google Business Profile (GBP) is arguably your most important digital asset. It's the first thing customers see when they search for you. Here is how to fully optimize it for the 2026 algorithm.
        </p>
      </>
    )
  },
  {
    slug: 'digital-marketing-ethiopian-owned-businesses-us',
    title: 'Digital Marketing for Ethiopian-Owned Businesses in the US',
    description: 'Tailored digital strategies for Ethiopian immigrant entrepreneurs looking to scale their local reach.',
    publishedAt: '2026-06-27',
    author: 'Abdisa Bati',
    category: 'Growth',
    content: (
      <>
        <p className="mb-6">
          Immigrant entrepreneurs bring incredible value and unique offerings to their communities. However, traditional digital marketing advice often ignores the cultural nuances and specific networks of Ethiopian-owned businesses.
        </p>
      </>
    )
  },
  {
    slug: 'how-ai-agents-handle-customer-reviews',
    title: 'How AI Agents Handle Customer Reviews 24/7',
    description: 'Discover the mechanics behind autonomous agents responding to reviews in your brand voice.',
    publishedAt: '2026-06-27',
    author: 'Abenezer Seyoum',
    category: 'Automation',
    content: (
      <>
        <p className="mb-6">
          Speed is critical in customer service. When a customer leaves a review at 2 AM, they don't expect an immediate response—which is exactly why an AI agent replying instantly leaves a lasting positive impression.
        </p>
      </>
    )
  },
  {
    slug: 'real-cost-of-ignoring-online-reviews',
    title: 'The Real Cost of Ignoring Your Online Reviews',
    description: 'The hidden financial impact of letting reviews go unanswered and unmanaged.',
    publishedAt: '2026-06-27',
    author: 'Gedion Bula',
    category: 'Reputation',
    content: (
      <>
        <p className="mb-6">
          Silence speaks volumes. Ignoring online reviews doesn't just mean missing out on thanking a happy customer; it signals to future prospects that you don't value post-purchase support.
        </p>
      </>
    )
  },
  {
    slug: 'nap-consistency-seo',
    title: 'NAP Consistency: Why Your Address Must Match Everywhere',
    description: 'Why Name, Address, and Phone number (NAP) consistency is the foundation of local SEO.',
    publishedAt: '2026-06-27',
    author: 'Mesay Alemayehu',
    category: 'SEO',
    content: (
      <>
        <p className="mb-6">
          If your business address is listed differently on Yelp, Google, and your website, search engines lose trust in your data. NAP consistency is the simplest yet most overlooked aspect of local SEO.
        </p>
      </>
    )
  }
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
