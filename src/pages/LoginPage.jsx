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


export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()


  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password) {
      setError('Enter both a username and password.')
      return
    }
    setLoading(true)
    const { user, error: authError } = await authenticate(username, password)
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
    if (user.role === 'accounts') navigate('/accounts')
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
            <p className="text-sm text-ink/60 mt-2 font-medium">Enter your credentials to continue.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <Field label="Username" required>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
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

          </Card>
        </div>
      </div>
    </div>
  )
}
