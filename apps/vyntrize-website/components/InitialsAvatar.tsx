interface InitialsAvatarProps {
  initials: string;
  name: string;
  size?: number;
  className?: string;
}

/**
 * Professional initials avatar — used when no photo is available.
 * Renders a styled SVG with the person's initials on a gradient background.
 */
export default function InitialsAvatar({ initials, name, size = 96, className = '' }: InitialsAvatarProps) {
  const fontSize = Math.round(size * 0.35);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={name}
      role="img"
    >
      <defs>
        <linearGradient id={`grad-${initials}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#41A5FF" />
          <stop offset="100%" stopColor="#2A52BE" />
        </linearGradient>
        <clipPath id={`clip-${initials}`}>
          <circle cx="50" cy="50" r="50" />
        </clipPath>
      </defs>

      {/* Background */}
      <circle cx="50" cy="50" r="50" fill={`url(#grad-${initials})`} />

      {/* Subtle inner shadow ring */}
      <circle cx="50" cy="50" r="49" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

      {/* Initials */}
      <text
        x="50"
        y="50"
        dominantBaseline="central"
        textAnchor="middle"
        fill="white"
        fontFamily="'Inter', 'Helvetica Neue', Arial, sans-serif"
        fontWeight="700"
        fontSize={fontSize}
        letterSpacing="-0.5"
      >
        {initials}
      </text>
    </svg>
  );
}
