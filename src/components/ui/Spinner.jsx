export function Spinner({ className = 'h-5 w-5', color = 'text-emerald-deep' }) {
  return (
    <svg className={`animate-spin ${className} ${color}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-emerald-deep">
      <Spinner className="h-8 w-8" />
      <p className="font-body text-sm text-ink/60">{label}</p>
    </div>
  )
}
