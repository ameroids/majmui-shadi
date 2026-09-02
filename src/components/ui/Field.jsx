export function Field({ label, error, hint, children, required }) {
  return (
    <label className="block">
      {label && (
        <span className="block text-xs font-semibold uppercase tracking-wide text-ink/60 mb-1.5">
          {label} {required && <span className="text-wine">*</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="block mt-1 text-xs text-ink/45">{hint}</span>}
      {error && <span className="block mt-1 text-xs text-wine font-medium">{error}</span>}
    </label>
  )
}

export function Input({ className = '', error, ...props }) {
  return (
    <input
      className={`w-full rounded-lg border ${error ? 'border-wine' : 'border-ivory-line'} bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 focus:border-gold focus:ring-1 focus:ring-gold outline-none transition ${className}`}
      {...props}
    />
  )
}

export function Select({ className = '', error, children, ...props }) {
  return (
    <select
      className={`w-full rounded-lg border ${error ? 'border-wine' : 'border-ivory-line'} bg-white px-3.5 py-2.5 text-sm text-ink focus:border-gold focus:ring-1 focus:ring-gold outline-none transition ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

export function Checkbox({ checked, onChange, label, id }) {
  return (
    <label htmlFor={id} className="flex items-center gap-2.5 cursor-pointer select-none tap-target">
      <span
        className={`h-5 w-5 flex-none rounded-md border-2 flex items-center justify-center transition ${
          checked ? 'bg-emerald-deep border-emerald-deep' : 'bg-white border-ivory-line'
        }`}
      >
        {checked && (
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
            <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <input id={id} type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
      {label && <span className="text-sm text-ink">{label}</span>}
    </label>
  )
}
