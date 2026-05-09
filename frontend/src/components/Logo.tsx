export function Logo({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" className={className}>
      <defs>
        <linearGradient id="sutara-logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9945FF" />
          <stop offset="1" stopColor="#14F195" />
        </linearGradient>
      </defs>
      <circle cx="4" cy="5" r="2.2" fill="#9945FF" />
      <circle cx="18" cy="8" r="2.2" fill="#14F195" />
      <circle cx="9" cy="17" r="2.2" fill="currentColor" />
      <path d="M 4 5 L 18 8 L 9 17 Z" stroke="#3a2f5e" strokeWidth="1" fill="none" />
      <path d="M 4 5 L 18 8" stroke="url(#sutara-logo-g)" strokeWidth="1.4" />
    </svg>
  );
}
