export default function Logo({ tone = 'dark', size = 'md' }) {
  const color = tone === 'light' ? '#FAF6EF' : '#0F3630'
  const accent = '#C9A24B'
  const textSize = size === 'lg' ? 'text-3xl sm:text-4xl' : 'text-xl'
  return (
    <div className="flex items-center gap-2 select-none">
      <svg width={size === 'lg' ? 34 : 26} height={size === 'lg' ? 34 : 26} viewBox="0 0 32 32" fill="none">
        <path
          d="M16 3C16 3 8 10 8 17.5C8 22.7467 11.5817 27 16 27C20.4183 27 24 22.7467 24 17.5C24 10 16 3 16 3Z"
          stroke={accent}
          strokeWidth="1.6"
        />
        <circle cx="16" cy="18" r="3" stroke={accent} strokeWidth="1.4" />
      </svg>
      <span className={`font-display font-semibold tracking-wide ${textSize}`} style={{ color }}>
        Majmui Shaadi
      </span>
    </div>
  )
}
