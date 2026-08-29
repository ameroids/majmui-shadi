const variants = {
  primary: 'bg-emerald-deep text-ivory hover:bg-emerald focus-visible:ring-gold',
  gold: 'bg-gold text-emerald-deep hover:bg-gold-deep hover:text-ivory',
  outline: 'bg-transparent border border-emerald-deep text-emerald-deep hover:bg-emerald-soft',
  ghost: 'bg-transparent text-emerald-deep hover:bg-emerald-soft',
  danger: 'bg-wine text-ivory hover:opacity-90',
  whatsapp: 'bg-[#1F5C52] text-ivory hover:bg-emerald-deep',
}

const sizes = {
  sm: 'text-xs px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2.5 gap-2',
  lg: 'text-base px-6 py-3 gap-2',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-lg font-semibold tracking-wide transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed tap-target ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
