export default function Logo({ tone = 'dark', size = 'md' }) {
  const color = tone === 'light' ? '#FAF6EF' : '#0F3630'
  const accent = '#C9A24B'
  const textSize = size === 'lg' ? 'text-3xl sm:text-4xl' : 'text-xl'
  return (
    <div className="flex items-center gap-2 select-none">
      <svg width={size === 'lg' ? 36 : 28} height={size === 'lg' ? 36 : 28} viewBox="0 0 32 32" fill="none">
        <circle cx="12.5" cy="16" r="7.5" stroke={accent} strokeWidth="1.5" />
        <circle cx="19.5" cy="16" r="7.5" stroke={accent} strokeWidth="1.5" />
        <path d="M16 10.5 C 18 12, 18 20, 16 21.5 C 14 20, 14 12, 16 10.5 Z" fill={accent} opacity="0.3" />
      </svg>
      <span className={`font-display font-semibold tracking-wide ${textSize}`} style={{ color }}>
        Majmui Shaadi
      </span>
    </div>
  )
}
