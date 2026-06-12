import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import CitizenDashboard from './pages/CitizenDashboard'
import OfficerDashboard from './pages/OfficerDashboard'
import AdminDashboard from './pages/AdminDashboard'

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />

  return children
}

function AppRoutes() {
  const { user } = useAuth()
  const redirect = user
    ? user.role === 'admin'
      ? '/admin'
      : user.role === 'officer'
      ? '/officer'
      : '/citizen'
    : '/'

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={redirect} replace /> : <LandingPage />} />
      <Route path="/citizen/*" element={<ProtectedRoute role="citizen"><CitizenDashboard /></ProtectedRoute>} />
      <Route path="/officer/*" element={<ProtectedRoute role="officer"><OfficerDashboard /></ProtectedRoute>} />
      <Route path="/admin/*" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>

      {/* ✅ BACKGROUND VIDEO (DO NOT TOUCH ROUTES) */}
      <video autoPlay loop muted className="bg-video pointer-events-none">
        <source src="/videos/bg.mp4" type="video/mp4" />
      </video>

      {/* ✅ YOUR APP (UNCHANGED) */}
      <div className="app-content">
        <AppRoutes />
      </div>

    </AuthProvider>
  )
}