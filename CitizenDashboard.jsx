import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { 
  LayoutDashboard, 
  FilePlus, 
  ClipboardList, 
  Search, 
  Bell, 
  LogOut, 
  X, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react'
import api from '../utils/api'
import CitizenHome from '../components/citizen/CitizenHome'
import ComplaintForm from '../components/citizen/ComplaintForm'
import MyComplaints from '../components/citizen/MyComplaints'
import TrackComplaint from '../components/citizen/TrackComplaint'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'new',       label: 'New Complaint', icon: FilePlus },
  { id: 'my-complaints', label: 'My Complaints', icon: ClipboardList },
  { id: 'track',     label: 'Track', icon: Search },
]

export default function CitizenDashboard() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState('dashboard')
  const [unread, setUnread] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [showNotifDD, setShowNotifDD] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')

  // Fetches unread count and notification list
  const fetchNotifications = () => {
    if (user?.id) {
      api.get(`/notifications/${user.id}`)
        .then(r => {
          setUnread(r.data.unread || 0)
          setNotifications(r.data.notifications || [])
        })
        .catch(() => {})
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [user?.id])

  // Marks notifications as read when the bell is clicked
  const markAsRead = async () => {
    try {
      await api.put(`/notifications/${user.id}/read`)
      setUnread(0)
    } catch (err) {}
  }

  const handleNavigateWithFilter = (targetTab, filterStatus = 'all') => {
    setActiveFilter(filterStatus)
    setTab(targetTab)
  }

  // Safety check to prevent "cannot read properties of undefined"
  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
             <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-100">GP</div>
             <div>
                <div className="font-bold text-gray-900 leading-tight">Grievance Portal</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Citizen Panel</div>
             </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotifDD(!showNotifDD)
                  if (unread > 0) markAsRead()
                }}
                className={`relative p-2 rounded-xl transition-all ${showNotifDD ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                <Bell className="w-5 h-5" />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-white">
                    {unread}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifDD && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">
                  <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-900 text-sm">Recent Updates</h3>
                    <button onClick={() => setShowNotifDD(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-10 text-center">
                        <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-xs font-medium text-gray-400">No new notifications</p>
                      </div>
                    ) : (
                      notifications.map((n, i) => (
                        <div key={i} className="p-4 border-b border-gray-50 hover:bg-blue-50/30 transition-colors flex gap-3">
                          <div className="mt-1 flex-shrink-0">
                            {n.type === 'resolved' ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-800 leading-normal">{n.message}</p>
                            <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">
                              {new Date(n.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile & Logout */}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
               <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-gray-900 leading-tight">{user.name}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Active Citizen</p>
               </div>
               <button 
                 onClick={logout} 
                 className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                 title="Logout"
               >
                 <LogOut className="w-5 h-5" />
               </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-2">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button 
                key={id} 
                onClick={() => handleNavigateWithFilter(id, 'all')}
                className={`flex items-center gap-2 px-4 py-4 text-sm font-bold transition-all border-b-2 ${
                  tab === id 
                    ? 'text-blue-600 border-blue-600' 
                    : 'text-gray-400 border-transparent hover:text-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overlay for closing dropdown */}
      {showNotifDD && <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowNotifDD(false)} />}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {tab === 'dashboard'     && <CitizenHome user={user} onNavigate={handleNavigateWithFilter} />}
        
        {/* FIX: Passed user={user} so complaints aren't left blank in the database! */}
        {tab === 'new'           && <ComplaintForm user={user} onSuccess={() => setTab('my-complaints')} />}
        
        {tab === 'my-complaints' && <MyComplaints user={user} initialFilter={activeFilter} />}
        {tab === 'track'         && <TrackComplaint />}
      </main>
    </div>
  )
}