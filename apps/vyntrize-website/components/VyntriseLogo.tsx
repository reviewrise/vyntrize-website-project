'use client';

import Image from 'next/image';

interface VyntriseLogoProps {
  /**
   * 'auto'  — text color follows CSS token (adapts to light/dark automatically)
   * 'dark'  — force white text (use on dark backgrounds in light mode)
   * 'light' — force dark text (use on light backgrounds in dark mode)
   */
  theme?: 'auto' | 'dark' | 'light';
  className?: string;
  height?: number;
}

export default function VyntriseLogo({
  theme = 'auto',
  className = '',
  height = 32,
}: VyntriseLogoProps) {
  const iconSize = height;
  const fontSize = Math.round(height * 0.55);

  // Text color strategy
  const textStyle: React.CSSProperties =
    theme === 'dark'  ? { color: '#FFFFFF' } :
    theme === 'light' ? { color: '#0B101A' } :
    { color: 'var(--color-text)' };   // auto — follows token

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {/* Icon mark */}
      <Image
        src="/images/logo.png"
        alt=""
        width={iconSize}
        height={iconSize}
        className="object-contain shrink-0"
        priority
      />

      {/* Wordmark — Inter 600, tight -0.02em tracking */}
      <span
        style={{
          ...textStyle,
          fontSize,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          lineHeight: 1,
          fontFamily: 'var(--font-sans)',
        }}
      >
        VyntRise
      </span>
    </div>
  );
}
