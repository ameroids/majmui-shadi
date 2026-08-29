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
        <div className="relative max-w-md mx-auto lg:mx-0">
          <Logo tone="light" size="lg" />
          <p className="mt-6 font-display text-2xl sm:text-3xl leading-snug text-gold-light">
            Every family, personally invited.
          </p>
          <p className="mt-4 text-sm text-ivory/70 leading-relaxed">
            Majmui Shaadi helps the bride and groom's families gather their invitee lists by
            ITS number, and send a single, personal WhatsApp invitation to each household —
            with every invited member and event named inside.
          </p>
          <div className="mt-10">
            <ArchMotif color="#E4CE8E" />
          </div>
          <ul className="mt-10 space-y-3 text-sm text-ivory/80">
            <li className="flex gap-2"><span className="text-gold">✦</span> Search invitees instantly by HOF ITS number</li>
            <li className="flex gap-2"><span className="text-gold">✦</span> One message per family, addressed to one representative</li>
            <li className="flex gap-2"><span className="text-gold">✦</span> You review and send — nothing goes out automatically</li>
          </ul>
        </div>
      </div>

      {/* Login panel */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-10 bg-ivory">
        <div className="w-full max-w-md">
          <Card className="p-6 sm:p-8">
            <h1 className="font-display text-2xl font-semibold text-emerald-deep">Sign in</h1>
            <p className="text-sm text-ink/55 mt-1">Choose your account type to continue.</p>

            <div className="mt-6 grid grid-cols-3 gap-1.5 bg-ivory-soft rounded-xl p-1.5">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    setActiveTab(t.key)
                    setError('')
                  }}
                  className={`text-xs sm:text-sm font-semibold py-2.5 rounded-lg transition tap-target ${
                    activeTab === t.key ? 'bg-emerald-deep text-ivory shadow-sm' : 'text-ink/60 hover:text-emerald-deep'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Field label="Username" required>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={activeTab === 'bridegroom' ? 'Dulha01 or Dulhan01' : activeTab === 'admin' ? 'admin' : 'tnc'}
                  autoComplete="username"
                />
              </Field>
              <Field label="Password" required error={error}>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </Field>

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Log in
              </Button>
            </form>

            <div className="mt-6 rounded-xl bg-ivory-soft border border-ivory-line px-4 py-3.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-deep mb-2">Demo credentials</p>
              <div className="space-y-1.5">
                {DEMO_HINTS[activeTab].map((hint) => (
                  <button
                    type="button"
                    key={hint.label}
                    onClick={() => fillDemo(hint.value)}
                    className="w-full flex items-center justify-between text-xs text-ink/70 hover:text-emerald-deep transition group tap-target"
                  >
                    <span className="font-medium">{hint.label}</span>
                    <span className="font-mono text-[11px] bg-white border border-ivory-line rounded px-2 py-1 group-hover:border-gold">
                      {hint.value}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </Card>
          <p className="text-center text-xs text-ink/40 mt-6">
            Demo credentials only — real deployments authenticate through Supabase.
          </p>
        </div>
      </div>
    </div>
  )
}
