import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const maxWidth = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' }[size]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm animate-[fadein_0.15s_ease-out]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${maxWidth} bg-ivory rounded-t-2xl sm:rounded-2xl shadow-lift max-h-[92vh] flex flex-col border border-ivory-line`}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-ivory-line">
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-emerald-deep">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-emerald-soft text-ink/60 tap-target"
          >
            ✕
          </button>
        </div>
        <div className="px-5 sm:px-6 py-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 sm:px-6 py-4 border-t border-ivory-line flex flex-wrap gap-3 justify-end">{footer}</div>}
      </div>
    </div>
  )
}
