type LearnerCharacterProps = {
  className?: string;
};

export function LearnerCharacter({ className }: LearnerCharacterProps) {
  return (
    <svg viewBox="0 0 200 280" className={className} aria-hidden>
      <ellipse cx="100" cy="268" rx="48" ry="8" fill="#93C5FD" opacity="0.35" />
      <path d="M72 148 C60 176 58 214 62 248 L86 248 C84 214 86 182 94 156 Z" fill="#1E3A8A" />
      <path d="M128 148 C140 176 142 214 138 248 L114 248 C116 214 114 182 106 156 Z" fill="#1E3A8A" />
      <ellipse cx="70" cy="250" rx="16" ry="8" fill="#0F172A" />
      <ellipse cx="130" cy="250" rx="16" ry="8" fill="#0F172A" />
      <rect x="78" y="118" width="44" height="52" rx="16" fill="#1D72FE" />
      <path d="M78 128 C70 148 62 168 58 186 L76 192 C82 168 86 148 90 132 Z" fill="#3B82F6" />
      <path d="M122 128 C130 148 138 168 142 186 L124 192 C118 168 114 148 110 132 Z" fill="#3B82F6" />
      <circle cx="48" cy="186" r="9" fill="#FCD34D" />
      <circle cx="152" cy="186" r="9" fill="#FCD34D" />
      <circle cx="100" cy="78" r="36" fill="#FCD34D" />
      <path d="M68 70 C74 42 126 40 132 72 C118 58 84 58 68 70 Z" fill="#78350F" />
      <circle cx="88" cy="80" r="4" fill="#1E293B" />
      <circle cx="112" cy="80" r="4" fill="#1E293B" />
      <path d="M92 94 Q100 100 108 94" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
      <rect x="86" y="108" width="28" height="12" rx="4" fill="#93C5FD" />
    </svg>
  );
}
