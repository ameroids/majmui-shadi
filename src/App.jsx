import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import BrideGroomDashboard from './pages/BrideGroomDashboard'
import AddInviteePage from './pages/AddInviteePage'
import SendInvitationPage from './pages/SendInvitationPage'
import AdminDashboard from './pages/AdminDashboard'
import TNCDashboard from './pages/TNCDashboard'
import TNCEventReportsPage from './pages/TNCEventReportsPage'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />

            <Route path="/dashboard" element={
              <ProtectedRoute roles={['bride', 'groom']}><BrideGroomDashboard /></ProtectedRoute>
            } />
            <Route path="/dashboard/add-invitee" element={
              <ProtectedRoute roles={['bride', 'groom']}><AddInviteePage /></ProtectedRoute>
            } />
            <Route path="/dashboard/send-invitation" element={
              <ProtectedRoute roles={['bride', 'groom']}><SendInvitationPage /></ProtectedRoute>
            } />

            <Route path="/admin" element={
              <ProtectedRoute roles={['admin']}><AdminDashboard tab="overview" /></ProtectedRoute>
            } />
            <Route path="/admin/families" element={
              <ProtectedRoute roles={['admin']}><AdminDashboard tab="families" /></ProtectedRoute>
            } />
            <Route path="/admin/invitations" element={
              <ProtectedRoute roles={['admin']}><AdminDashboard tab="invitations" /></ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute roles={['admin']}><AdminDashboard tab="users" /></ProtectedRoute>
            } />
            <Route path="/admin/template" element={
              <ProtectedRoute roles={['admin']}><AdminDashboard tab="template" /></ProtectedRoute>
            } />

            <Route path="/tnc" element={
              <ProtectedRoute roles={['tnc', 'admin']}><TNCDashboard /></ProtectedRoute>
            } />
            <Route path="/tnc/reports" element={
              <ProtectedRoute roles={['tnc', 'admin']}><TNCEventReportsPage /></ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
