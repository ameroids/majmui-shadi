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
import SplashIntro from '../components/SplashIntro'


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
    <>
      <SplashIntro />
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Decorative brand panel */}
      <div className="relative bg-emerald-deep text-ivory lg:w-[44%] px-6 sm:px-10 py-12 lg:py-0 flex flex-col justify-center items-center overflow-hidden text-center">
        <div className="absolute inset-0 paper-texture opacity-[0.06]" />
        
        {/* Animated Geometric Background Circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center pointer-events-none opacity-40">
          <div className="absolute w-[160%] sm:w-[130%] aspect-square rounded-full border border-gold/30 border-dashed animate-spin" style={{ animationDuration: '100s' }} />
          <div className="absolute w-[140%] sm:w-[110%] aspect-square rounded-full border border-gold/20 animate-spin" style={{ animationDuration: '80s', animationDirection: 'reverse' }} />
          <div className="absolute w-[120%] sm:w-[90%] aspect-square rounded-full border-2 border-gold/40 border-dotted animate-spin" style={{ animationDuration: '140s' }} />
          {/* Subtle glowing center */}
          <div className="absolute w-[80%] aspect-square rounded-full bg-gold/5 blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        </div>

        <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center">
          {/* Top Elegant Flourish */}
          <div className="opacity-80 mb-12 flex justify-center w-full">
            <svg width="280" height="24" viewBox="0 0 280 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 12 h100" stroke="#C9A24B" strokeWidth="1" strokeOpacity="0.4" />
              <path d="M180 12 h100" stroke="#C9A24B" strokeWidth="1" strokeOpacity="0.4" />
              <path d="M140 0 L145 9 L154 12 L145 15 L140 24 L135 15 L126 12 L135 9 Z" fill="#C9A24B" fillOpacity="0.8" />
              <path d="M115 9 L118 12 L115 15 L112 12 Z" fill="#C9A24B" fillOpacity="0.6" />
              <path d="M165 9 L168 12 L165 15 L162 12 Z" fill="#C9A24B" fillOpacity="0.6" />
              <circle cx="106" cy="12" r="1.5" fill="#C9A24B" fillOpacity="0.4" />
              <circle cx="174" cy="12" r="1.5" fill="#C9A24B" fillOpacity="0.4" />
            </svg>
          </div>
          
          <Logo tone="light" size="lg" className="justify-center scale-110" />
          
          {/* Divider */}
          <div className="my-10 flex items-center justify-center gap-4 w-full">
            <div className="h-[1px] flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-gold/60"></div>
            <div className="w-2.5 h-2.5 rounded-sm bg-gold/60 rotate-45"></div>
            <div className="h-[1px] flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-gold/60"></div>
          </div>
          
          <p className="font-display text-3xl sm:text-4xl leading-tight text-gold-light tracking-wide italic px-4">
            Every family,<br />personally invited.
          </p>
          
          {/* Bottom Elegant Flourish */}
          <div className="opacity-80 mt-16 flex justify-center w-full">
             <svg width="280" height="24" viewBox="0 0 280 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 12 h100" stroke="#C9A24B" strokeWidth="1" strokeOpacity="0.4" />
              <path d="M180 12 h100" stroke="#C9A24B" strokeWidth="1" strokeOpacity="0.4" />
              <path d="M140 0 L145 9 L154 12 L145 15 L140 24 L135 15 L126 12 L135 9 Z" fill="#C9A24B" fillOpacity="0.8" />
              <path d="M115 9 L118 12 L115 15 L112 12 Z" fill="#C9A24B" fillOpacity="0.6" />
              <path d="M165 9 L168 12 L165 15 L162 12 Z" fill="#C9A24B" fillOpacity="0.6" />
              <circle cx="106" cy="12" r="1.5" fill="#C9A24B" fillOpacity="0.4" />
              <circle cx="174" cy="12" r="1.5" fill="#C9A24B" fillOpacity="0.4" />
            </svg>
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
    </>
  )
}
