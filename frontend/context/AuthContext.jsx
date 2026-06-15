import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const s = localStorage.getItem('gp_user')
    if (s) { try { setUser(JSON.parse(s)) } catch { localStorage.removeItem('gp_user') } }
    setLoading(false)
  }, [])

  const login = async (email, password, role) => {
    try {
      const res = await api.post('/auth/login', { email, password })
      if (!res.data.success) return { success: false, error: res.data.error }
      const u = res.data.user
      if (role && u.role !== role) return { success: false, error: 'Invalid credentials for this role' }
      setUser(u); localStorage.setItem('gp_user', JSON.stringify(u))
      return { success: true, user: u }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Login failed' }
    }
  }

  const register = async (data) => {
    try {
      const res = await api.post('/auth/register', data)
      if (!res.data.success) return { success: false, error: res.data.error }
      const u = res.data.user
      setUser(u); localStorage.setItem('gp_user', JSON.stringify(u))
      return { success: true, user: u }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Registration failed' }
    }
  }

  const logout = () => { setUser(null); localStorage.removeItem('gp_user') }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout,
      isOfficer: user?.role === 'officer', isCitizen: user?.role === 'citizen', isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
