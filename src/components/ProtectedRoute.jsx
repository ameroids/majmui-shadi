import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PageLoader } from './ui/Spinner'

export default function ProtectedRoute({ roles, children }) {
  const { user, ready } = useAuth()

  if (!ready) return <PageLoader label="Preparing your dashboard…" />
  if (!user) return <Navigate to="/" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />

  return children
}
