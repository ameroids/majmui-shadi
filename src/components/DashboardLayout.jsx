import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from './Logo'
import { useAuth } from '../context/AuthContext'

export default function DashboardLayout({ children, navItems = [], activePath, roleLabel }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-ivory flex flex-col">
      <header className="sticky top-0 z-30 bg-emerald-deep text-ivory">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden h-9 w-9 flex items-center justify-center rounded-md hover:bg-white/10 tap-target"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2.5 5H17.5M2.5 10H17.5M2.5 15H17.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <Logo tone="light" />
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-sm font-semibold">{user?.display_name}</span>
              <span className="text-[11px] uppercase tracking-wide text-gold-light">{roleLabel}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs font-semibold uppercase tracking-wide border border-white/25 rounded-lg px-3 py-2 hover:bg-white/10 transition tap-target"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        {navItems.length > 0 && (
          <>
            <aside className="hidden lg:flex w-60 flex-none flex-col gap-1 px-4 py-6 border-r border-ivory-line">
              {navItems.map((item) => (
                <NavLinkItem key={item.path} item={item} active={activePath === item.path} navigate={navigate} />
              ))}
            </aside>

            {menuOpen && (
              <div className="lg:hidden fixed inset-0 z-40">
                <div className="absolute inset-0 bg-ink/40" onClick={() => setMenuOpen(false)} />
                <div className="absolute left-0 top-0 bottom-0 w-64 bg-ivory p-4 pt-6 flex flex-col gap-1 shadow-lift">
                  <div className="mb-4 px-2">
                    <Logo />
                  </div>
                  {navItems.map((item) => (
                    <NavLinkItem
                      key={item.path}
                      item={item}
                      active={activePath === item.path}
                      navigate={navigate}
                      onNavigate={() => setMenuOpen(false)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8 min-w-0">{children}</main>
      </div>
    </div>
  )
}

function NavLinkItem({ item, active, navigate, onNavigate }) {
  return (
    <button
      onClick={() => {
        navigate(item.path)
        onNavigate?.()
      }}
      className={`text-left px-3.5 py-2.5 rounded-lg text-sm font-semibold transition flex items-center gap-2.5 tap-target ${
        active ? 'bg-emerald-deep text-ivory' : 'text-ink/70 hover:bg-emerald-soft'
      }`}
    >
      <span className="text-base">{item.icon}</span>
      {item.label}
    </button>
  )
}
