import { Globe, type LucideIcon } from 'lucide-react';

export interface WorkMetric {
  label: string;
  value: string;
}

export interface WorkCase {
  slug: string;
  client: string;
  industry: string;
  service: string;
  filter: string;
  icon: LucideIcon;
  color: 'blue' | 'violet' | 'amber' | 'emerald' | 'rose' | 'cyan';
  tagline: string;
  challenge: string;
  solution: string;
  solutionDetail: string[];
  results: string;
  metrics: WorkMetric[];
  deliverables: string[];
  quote: string;
  author: string;
  role: string;
  initials: string;
  timeline: string;
  year: string;
  /**
   * Visual type:
   * 'screenshot' — browser chrome + screenshot (custom software/portals)
   * 'metrics'    — colored panel with key result numbers (AI/data/automation)
   * 'portfolio'  — full-bleed image card, image-first (branding/web design)
   */
  visualType: 'screenshot' | 'metrics' | 'portfolio';
  /** For visualType='screenshot': path to hero screenshot, e.g. /images/work/growthhub-hero.png */
  heroImage?: string;
  /** For visualType='screenshot': additional gallery screenshots */
  galleryImages?: string[];
  /** Live site URL (optional) */
  liveUrl?: string;
}

export const cases: WorkCase[] = [
  /* ── Real client projects ── */
  {
    slug: 'habesha-food',
    client: 'Habesha Food',
    industry: 'Food & Restaurant',
    service: 'Custom Software',
    filter: 'Web Design',
    icon: Globe,
    color: 'emerald',
    tagline: 'A full digital presence for an authentic Ethiopian restaurant brand.',
    challenge: 'Habesha Food needed a complete digital identity — a website that captured the warmth and authenticity of their brand, made it easy for customers to explore the menu, and drove reservations and orders online.',
    solution: 'We designed and built a full-stack restaurant website with menu management, online ordering integration, and a brand identity system that reflects the rich cultural heritage of Ethiopian cuisine.',
    solutionDetail: [
      'Custom website design and development',
      'Online menu with category filtering and dietary tags',
      'Reservation and order flow integration',
      'Brand identity system (colors, typography, photography direction)',
      'Mobile-first responsive design',
    ],
    results: 'The new website launched on time and immediately became the primary channel for reservations and online orders. The brand identity was praised by customers for its authenticity and warmth.',
    metrics: [
      { label: 'Delivery', value: 'On time' },
      { label: 'Mobile score', value: '98/100' },
      { label: 'Satisfaction', value: '5★' },
    ],
    deliverables: [
      'Custom website (Next.js)',
      'Online menu system',
      'Reservation integration',
      'Brand identity system',
      'Mobile-optimized design',
    ],
    quote: 'VyntRise captured exactly what we wanted — a website that feels like our food. Warm, authentic, and beautiful.',
    author: 'Habesha Food Team',
    role: 'Owner',
    initials: 'HF',
    timeline: '4 weeks',
    year: '2025',
    visualType: 'portfolio',
    heroImage: '/images/work/Habesha%20Food/photo_2026-04-09_16-23-33.jpg',
    galleryImages: [
      '/images/work/Habesha%20Food/photo_2026-04-09_16-23-33%20(2).jpg',
      '/images/work/Habesha%20Food/photo_2026-04-09_16-23-33%20(3).jpg',
      '/images/work/Habesha%20Food/photo_2026-04-09_16-23-33%20(4).jpg',
      '/images/work/Habesha%20Food/photo_2026-04-09_16-23-34.jpg',
    ],
  },
  {
    slug: 'liya-cookies',
    client: 'Liya Cookies',
    industry: 'Food & Bakery',
    service: 'Custom Software',
    filter: 'Web Design',
    icon: Globe,
    color: 'rose',
    tagline: 'A delightful online presence for a boutique cookie brand.',
    challenge: 'Liya Cookies is a boutique artisan bakery that needed a website as beautiful as their products — one that showcased their handcrafted cookies, enabled online orders, and built a loyal customer base.',
    solution: 'We built a visually rich e-commerce website with a custom product showcase, order management, and a brand identity that matched the handcrafted, premium feel of the product.',
    solutionDetail: [
      'Custom e-commerce website design and development',
      'Product showcase with high-quality image galleries',
      'Online ordering and checkout flow',
      'Brand identity and visual language',
      'Social media integration',
    ],
    results: 'The website launched to immediate positive feedback. Online orders began within the first week. The brand identity was consistent across web and social, building a recognizable presence.',
    metrics: [
      { label: 'Delivery', value: 'On time' },
      { label: 'Orders week 1', value: '40+' },
      { label: 'Satisfaction', value: '5★' },
    ],
    deliverables: [
      'Custom e-commerce website',
      'Product showcase gallery',
      'Online ordering system',
      'Brand identity system',
      'Social media assets',
    ],
    quote: 'Our website is as beautiful as our cookies. VyntRise understood our brand from day one.',
    author: 'Liya Cookies Team',
    role: 'Founder',
    initials: 'LC',
    timeline: '3 weeks',
    year: '2025',
    visualType: 'portfolio',
    heroImage: '/images/work/Liya%20Cookies/photo_2026-04-09_16-23-32.jpg',
    galleryImages: [
      '/images/work/Liya%20Cookies/photo_2026-04-09_16-23-34.jpg',
    ],
  },
  {
    slug: 'nazaret-market',
    client: 'Nazaret Market',
    industry: 'Retail & Grocery',
    service: 'Custom Software',
    filter: 'Web Design',
    icon: Globe,
    color: 'amber',
    tagline: 'A modern digital storefront for a community grocery market.',
    challenge: 'Nazaret Market needed a professional digital presence that reflected their community-focused brand, made it easy for customers to browse products and promotions, and established trust with a modern, clean design.',
    solution: 'We designed and built a full brand identity and website for Nazaret Market — including a product catalog, weekly promotions system, and a design language that honored their community roots.',
    solutionDetail: [
      'Brand identity design (logo, colors, typography)',
      'Custom website with product catalog',
      'Weekly promotions and deals section',
      'Store information and hours management',
      'Mobile-first responsive design',
    ],
    results: 'The new brand identity and website gave Nazaret Market a professional presence that matched the quality of their products. Customer engagement increased significantly after launch.',
    metrics: [
      { label: 'Delivery', value: 'On time' },
      { label: 'Brand assets', value: '20+' },
      { label: 'Satisfaction', value: '5★' },
    ],
    deliverables: [
      'Brand identity system',
      'Custom website',
      'Product catalog',
      'Promotions management',
      'Print-ready brand assets',
    ],
    quote: 'VyntRise gave us a brand we are proud of. Our customers notice the difference.',
    author: 'Nazaret Market Team',
    role: 'Owner',
    initials: 'NM',
    timeline: '3 weeks',
    year: '2025',
    visualType: 'portfolio',
    heroImage: '/images/work/NAZARET%20MARKET/1.png',
    galleryImages: [
      '/images/work/NAZARET%20MARKET/2.png',
      '/images/work/NAZARET%20MARKET/3.png',
      '/images/work/NAZARET%20MARKET/2.jpg',
    ],
  },
];

export const colorTokens: Record<string, {
  icon: string; badge: string; bar: string; text: string; border: string; bg: string;
}> = {
  blue:    { icon: 'bg-blue-50 text-blue-600',    badge: 'bg-blue-50 text-blue-600 border-blue-100',    bar: 'bg-blue-500',    text: 'text-blue-600',    border: 'border-blue-200',    bg: 'bg-blue-50'    },
  violet:  { icon: 'bg-violet-50 text-violet-600', badge: 'bg-violet-50 text-violet-600 border-violet-100', bar: 'bg-violet-500', text: 'text-violet-600', border: 'border-violet-200', bg: 'bg-violet-50' },
  amber:   { icon: 'bg-amber-50 text-amber-600',   badge: 'bg-amber-50 text-amber-600 border-amber-100',   bar: 'bg-amber-500',   text: 'text-amber-600',   border: 'border-amber-200',   bg: 'bg-amber-50'   },
  emerald: { icon: 'bg-emerald-50 text-emerald-600', badge: 'bg-emerald-50 text-emerald-600 border-emerald-100', bar: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-200', bg: 'bg-emerald-50' },
  rose:    { icon: 'bg-rose-50 text-rose-600',     badge: 'bg-rose-50 text-rose-600 border-rose-100',     bar: 'bg-rose-500',    text: 'text-rose-600',    border: 'border-rose-200',    bg: 'bg-rose-50'    },
  cyan:    { icon: 'bg-cyan-50 text-cyan-600',     badge: 'bg-cyan-50 text-cyan-600 border-cyan-100',     bar: 'bg-cyan-500',    text: 'text-cyan-600',    border: 'border-cyan-200',    bg: 'bg-cyan-50'    },
};
