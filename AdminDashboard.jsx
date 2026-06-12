import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, ClipboardList, Users, User, BarChart3, Settings, Bell, LogOut } from 'lucide-react'
import api from '../utils/api'
import AdminHome from '../components/admin/AdminHome'
import AdminComplaints from '../components/admin/AdminComplaints'
import AdminOfficers from '../components/admin/AdminOfficers'
import AdminAnalytics from '../components/admin/AdminAnalytics'
import AdminCitizens from '../components/admin/AdminCitizens'

const TABS = [
  { id: 'dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'complaints', label: 'Complaints', icon: ClipboardList },
  { id: 'citizens',   label: 'Citizens',   icon: User },
  { id: 'officers',   label: 'Officers',   icon: Users },
  { id: 'analytics',  label: 'Analytics',  icon: BarChart3 },
]

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState('dashboard')
  const [unread, setUnread] = useState(0)

  // Add state to handle active filter for complaints
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    api.get(`/notifications/${user.id}`)
      .then(r => setUnread(r.data.unread || 0))
      .catch(() => {})
  }, [user.id])

  // Helper to handle navigation from stat cards directly to filtered views
  const handleNavigateWithFilter = (targetTab, filterStatus = 'all') => {
    setActiveFilter(filterStatus);
    setTab(targetTab);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-white to-blue-50">
      
      {/* Header */}
      <header className="bg-blue-700 text-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold text-sm">GP</span>
            </div>
            <div>
              <div className="font-bold text-sm leading-tight">Grievance Portal</div>
              <div className="text-blue-200 text-xs">Admin Control Panel</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative text-white/80 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-sm">{unread}</span>
              )}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Settings className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight">{user.name}</div>
                <div className="text-blue-200 text-xs">Administrator</div>
              </div>
            </div>
            <button onClick={logout} className="text-white/70 hover:text-white transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button 
                key={id} 
                onClick={() => handleNavigateWithFilter(id)} 
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                  tab === id 
                    ? 'text-blue-700 border-blue-700 bg-blue-50/50' 
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${tab === id ? 'text-blue-700' : 'text-gray-400'}`} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {tab === 'dashboard'  && <AdminHome onNavigate={handleNavigateWithFilter} />}
        {tab === 'complaints' && <AdminComplaints initialFilter={activeFilter} />}
        {tab === 'citizens'   && <AdminCitizens />}
        {tab === 'officers'   && <AdminOfficers />}
        {tab === 'analytics'  && <AdminAnalytics />}
      </div>
    </div>
  )
}