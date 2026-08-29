import { createContext, useCallback, useContext, useState } from 'react'

const ToastContext = createContext(null)

let idCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((message, variant = 'success') => {
    const id = ++idCounter
    setToasts((prev) => [...prev, { id, message, variant }])
    setTimeout(() => dismiss(id), 3600)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[100] flex flex-col gap-2 items-stretch sm:items-end pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto max-w-sm w-full sm:w-auto rounded-lg shadow-lift px-4 py-3 text-sm font-medium flex items-start gap-2 border animate-[fadein_0.2s_ease-out]
              ${t.variant === 'error'
                ? 'bg-wine text-white border-wine'
                : t.variant === 'info'
                ? 'bg-emerald-deep text-white border-emerald-deep'
                : 'bg-emerald text-white border-emerald'}`}
          >
            <span className="mt-0.5">
              {t.variant === 'error' ? '⚠' : t.variant === 'info' ? 'ℹ' : '✓'}
            </span>
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="opacity-70 hover:opacity-100 tap-target"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
