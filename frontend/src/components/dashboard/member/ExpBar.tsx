type ExpBarProps = {
  percent: number;
  className?: string;
};

const MAX_WIDTH = 808;

export function ExpBar({ percent, className }: ExpBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const width = Math.round((clamped / 100) * MAX_WIDTH);
  const glow = Math.max(0, width - 6);
  const visible = width > 4;

  return (
    <svg viewBox="0 0 1000 240" className={className} role="img" aria-label={`XP ${clamped}%`}>
      <defs>
        <linearGradient id="xp-gold" x1="0%" x2="0%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#fff5a6" />
          <stop offset="50%" stopColor="#f59b00" />
          <stop offset="100%" stopColor="#5a2c00" />
        </linearGradient>
        <linearGradient id="xp-liquid" x1="0%" x2="0%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#2de3ff" />
          <stop offset="55%" stopColor="#0080ff" />
          <stop offset="100%" stopColor="#002b8a" />
        </linearGradient>
        <linearGradient id="xp-rim" x1="0%" x2="0%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0099ff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="xp-orb" cx="45%" cy="40%" r="58%">
          <stop offset="0%" stopColor="#38e5ff" />
          <stop offset="75%" stopColor="#0066f5" />
          <stop offset="100%" stopColor="#0035a8" />
        </radialGradient>
        <linearGradient id="xp-face" x1="0%" x2="0%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#fff88f" />
          <stop offset="100%" stopColor="#f07800" />
        </linearGradient>
        <clipPath id="xp-clip">
          <rect x="150" y="94" width="814" height="48" rx="24" />
        </clipPath>
      </defs>

      <rect x="140" y="78" width="836" height="80" rx="40" fill="#240f00" />
      <rect x="143" y="81" width="830" height="74" rx="37" fill="url(#xp-gold)" />
      <rect x="152" y="90" width="812" height="56" rx="28" fill="#0b1628" />

      <g clipPath="url(#xp-clip)">
        <rect
          x="153"
          y="96"
          width={width}
          height="44"
          rx="22"
          fill="url(#xp-liquid)"
          stroke="#00f6ff"
          strokeWidth="1.5"
          opacity={visible ? 1 : 0}
          className="transition-[width] duration-500 ease-out"
        />
        <rect
          x="156"
          y="97"
          width={glow}
          height="20"
          rx="10"
          fill="url(#xp-rim)"
          opacity={visible ? 1 : 0}
          className="transition-[width] duration-500 ease-out"
        />
        {visible ? <ellipse cx="178" cy="104" rx="10" ry="4.5" fill="#ffffff" opacity="0.9" /> : null}
      </g>

      <circle cx="120" cy="120" r="88" fill="url(#xp-gold)" />
      <circle cx="120" cy="120" r="72" fill="url(#xp-orb)" />
      <text
        x="120"
        y="128"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="url(#xp-face)"
        fontSize="78"
        fontWeight="900"
        fontFamily="Arial Black, sans-serif"
      >
        XP
      </text>
    </svg>
  );
}
