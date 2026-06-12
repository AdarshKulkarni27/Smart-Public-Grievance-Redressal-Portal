import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, ClipboardList, Clock, Bell, LogOut, User, ChevronDown } from 'lucide-react'
import api from '../utils/api'
import OfficerHome from '../components/officer/OfficerHome'
import AssignedComplaints from '../components/officer/AssignedComplaints'
import ResolutionHistory from '../components/officer/ResolutionHistory'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'assigned',  label: 'Assigned',  icon: ClipboardList },
  { id: 'history',   label: 'History',   icon: Clock },
]

export default function OfficerDashboard() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState('dashboard')
  const [officers, setOfficers] = useState([])
  const [activeOfficer, setActiveOfficer] = useState(null)
  const [showOfficerDD, setShowOfficerDD] = useState(false)
  const [unread, setUnread] = useState(0)
  const [activeFilter, setActiveFilter] = useState('all')

  // NEW: Function to refresh officer data and badges in real-time
  const refreshOfficerData = () => {
    api.get('/officers')
      .then(r => {
        const list = r.data.officers || []
        setOfficers(list)
        
        // Sync the active officer object to update the header badge
        if (activeOfficer) {
          const updatedMe = list.find(o => o.id === activeOfficer.id)
          if (updatedMe) setActiveOfficer(updatedMe)
        } else {
          const me = list.find(o => o.email === user.email) || list[0]
          setActiveOfficer(me)
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    refreshOfficerData()
    api.get(`/notifications/${user.id}`).then(r => setUnread(r.data.unread || 0)).catch(() => {})
  }, [user])

  const handleNavigateWithFilter = (targetTab, filterStatus = 'all') => {
    setActiveFilter(filterStatus)
    setTab(targetTab)
  }

  if (!activeOfficer) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const currentActive = (activeOfficer.assignedCount || 0) - (activeOfficer.resolvedCount || 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-600 text-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold text-sm">GP</span>
            </div>
            <div>
              <div className="font-bold text-sm leading-tight">Grievance Portal</div>
              <div className="text-green-200 text-xs">Officer Dashboard</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative text-white/80 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              {unread > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-sm">{unread}</span>}
            </button>

            <div className="relative">
              <button onClick={() => setShowOfficerDD(!showOfficerDD)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 transition-colors relative">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center relative">
                  <User className="w-4 h-4 text-white" />
                  {currentActive > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-green-600"></span>}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-semibold text-white leading-tight">{activeOfficer.name}</div>
                  <div className="text-xs text-green-200">{activeOfficer.department}</div>
                </div>
                <ChevronDown className={`w-4 h-4 text-green-200 transition-transform ${showOfficerDD ? 'rotate-180' : ''}`} />
              </button>

              {showOfficerDD && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-1">Switch Officer View</div>
                  <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
                    {officers.map(o => {
                      const pending = (o.assignedCount || 0) - (o.resolvedCount || 0)
                      return (
                        <button key={o.id} onClick={() => { setActiveOfficer(o); setShowOfficerDD(false); setTab('dashboard') }}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${activeOfficer.id === o.id ? 'bg-green-50/50' : ''}`}>
                          <div>
                            <div className={`font-semibold ${activeOfficer.id === o.id ? 'text-green-700' : 'text-gray-800'}`}>{o.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{o.department}</div>
                          </div>
                          {pending > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">{pending} New</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <button onClick={logout} className="text-white/70 hover:text-white transition-colors"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => handleNavigateWithFilter(id, 'all')}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${tab === id ? 'text-green-700 border-green-600 bg-green-50/50' : 'text-gray-500 border-transparent hover:text-gray-800 hover:bg-gray-50/50'}`}>
                <Icon className={`w-4 h-4 ${tab === id ? 'text-green-600' : 'text-gray-400'}`} />{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {tab === 'dashboard' && <OfficerHome officer={activeOfficer} onNavigate={handleNavigateWithFilter} />}
        {tab === 'assigned'  && <AssignedComplaints officer={activeOfficer} initialFilter={activeFilter} onRefreshBadges={refreshOfficerData} />}
        {tab === 'history'   && <ResolutionHistory officer={activeOfficer} />}
      </div>
    </div>
  )
}