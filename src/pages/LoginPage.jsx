import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import ArchMotif from '../components/ArchMotif'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Field, Input } from '../components/ui/Field'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { authenticate } from '../lib/db'

const TABS = [
  { key: 'bridegroom', label: 'Bride / Groom', roles: ['bride', 'groom'] },
  { key: 'admin', label: 'Admin', roles: ['admin'] },
  { key: 'tnc', label: 'TNC', roles: ['tnc'] },
]

const DEMO_HINTS = {
  bridegroom: [{ label: 'Bride', value: 'Dulhan01 / password123' }, { label: 'Groom', value: 'Dulha01 / password123' }],
  admin: [{ label: 'Admin', value: 'admin / admin123' }],
  tnc: [{ label: 'TNC', value: 'tnc / tnc123' }],
}

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('bridegroom')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const tab = TABS.find((t) => t.key === activeTab)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password) {
      setError('Enter both a username and password.')
      return
    }
    setLoading(true)
    const { user, error: authError } = await authenticate(username, password, tab.roles)
    setLoading(false)
    if (authError || !user) {
      setError(authError || 'Something went wrong. Please try again.')
      return
    }
    login(user)
    showToast(`Welcome, ${user.display_name.split(' ')[0]}.`)
    if (user.role === 'bride' || user.role === 'groom') navigate('/dashboard')
    if (user.role === 'admin') navigate('/admin')
    if (user.role === 'tnc') navigate('/tnc')
  }

  const fillDemo = (value) => {
    const [u, p] = value.split(' / ')
    setUsername(u)
    setPassword(p)
    setError('')
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Decorative brand panel */}
      <div className="relative bg-emerald-deep text-ivory lg:w-[44%] px-6 sm:px-10 py-12 lg:py-0 flex flex-col justify-center overflow-hidden">
        <div className="absolute inset-0 paper-texture opacity-[0.06]" />
        <div className="relative w-full max-w-md mx-auto lg:mx-0">
          <Logo tone="light" size="lg" />
          <p className="mt-8 font-display text-3xl sm:text-4xl leading-tight text-gold-light tracking-tight">
            Every family,<br className="hidden sm:block" /> personally invited.
          </p>
          <div className="mt-8 pl-5 border-l-2 border-gold/40">
            <p className="font-serif italic text-ivory/90 text-xl sm:text-2xl leading-relaxed">
              "Two souls but a single thought; two hearts that beat as one."
            </p>
            <p className="text-xs text-gold-light/60 uppercase tracking-[0.2em] mt-3 font-semibold">
              John Keats
            </p>
          </div>
          <div className="mt-12 opacity-80">
            <ArchMotif color="#E4CE8E" height={16} />
          </div>
        </div>
      </div>

      {/* Login panel */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12 bg-ivory relative">
        <div className="absolute inset-0 bg-gradient-to-br from-ivory to-[#F0EBE0] pointer-events-none" />
        <div className="w-full max-w-md relative z-10">
          <Card className="p-7 sm:p-10 shadow-2xl shadow-emerald-deep/5 border border-white/60 bg-white/90 backdrop-blur-md">
            <h1 className="font-display text-3xl font-semibold text-emerald-deep tracking-tight">Sign in</h1>
            <p className="text-sm text-ink/60 mt-2 font-medium">Choose your account type to continue.</p>

            <div className="mt-8 grid grid-cols-3 gap-1.5 bg-ivory-soft/80 rounded-xl p-1.5 border border-ivory-line/50">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    setActiveTab(t.key)
                    setError('')
                  }}
                  className={`text-xs sm:text-sm font-semibold py-2.5 rounded-lg transition tap-target ${
                    activeTab === t.key ? 'bg-emerald-deep text-ivory shadow-md' : 'text-ink/60 hover:text-emerald-deep hover:bg-white/50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <Field label="Username" required>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={activeTab === 'bridegroom' ? 'Dulha01 or Dulhan01' : activeTab === 'admin' ? 'admin' : 'tnc'}
                  autoComplete="username"
                  className="bg-white"
                />
              </Field>
              <Field label="Password" required error={error}>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="bg-white"
                />
              </Field>

              <div className="pt-2">
                <Button type="submit" className="w-full shadow-lg shadow-emerald-deep/10" size="lg" loading={loading}>
                  Log in
                </Button>
              </div>
            </form>

            <div className="mt-8 rounded-xl bg-ivory-soft/50 border border-ivory-line/60 px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-deep/70 mb-3">Demo credentials</p>
              <div className="space-y-2">
                {DEMO_HINTS[activeTab].map((hint) => (
                  <button
                    type="button"
                    key={hint.label}
                    onClick={() => fillDemo(hint.value)}
                    className="w-full flex items-center justify-between text-xs text-ink/70 hover:text-emerald-deep transition group tap-target py-1"
                  >
                    <span className="font-medium">{hint.label}</span>
                    <span className="font-mono text-[11px] bg-white border border-ivory-line/80 shadow-sm rounded px-2 py-1 group-hover:border-gold/50 group-hover:text-emerald-deep transition-colors">
                      {hint.value}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </Card>
          <p className="text-center text-xs text-ink/40 mt-8 font-medium">
            Demo credentials only — real deployments authenticate through Supabase.
          </p>
        </div>
      </div>
    </div>
  )
}
