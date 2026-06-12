import { useState, useEffect } from 'react'
import { FileText, Clock, RefreshCw, CheckCircle2, Plus, Search } from 'lucide-react'
import api from '../../utils/api'

export default function CitizenHome({ user, onNavigate }) {
  // Initialize stats with zeros to ensure no old data is shown on mount
  const [stats, setStats] = useState({ 
    total: 0, 
    pending: 0, 
    inProgress: 0, 
    resolved: 0 
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Only proceed if the user object and ID are present
    if (user?.id) {
      // RESET: Clear old stats immediately when a new user ID is detected
      setStats({ total: 0, pending: 0, inProgress: 0, resolved: 0 })
      setLoading(true)
      
      // Fetch stats filtered by the current citizen's ID
      api.get(`/dashboard?role=citizen&userId=${user.id}`) // <-- MODIFIED HERE
        .then(r => {
          // Expecting backend to return { total, pending, inProgress, resolved }
          setStats(r.data)
        })
        .catch((err) => {
          console.error("Dashboard data fetch error:", err)
        })
        .finally(() => setLoading(false))
    }
  }, [user?.id]) // Dependency on user.id ensures reset on every new login

  // Prevent rendering if the user context is lost
  if (!user) return null

  const cards = [
    { 
      label: 'Total Complaints', 
      value: stats.total, 
      icon: FileText, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50', 
      tab: 'my-complaints', 
      filter: 'all' 
    },
    { 
      label: 'Pending', 
      value: stats.pending, 
      icon: Clock, 
      color: 'text-yellow-600', 
      bg: 'bg-yellow-50', 
      tab: 'my-complaints', 
      filter: 'pending' 
    },
    { 
      label: 'In Progress', 
      value: stats.inProgress, 
      icon: RefreshCw, 
      color: 'text-blue-500', 
      bg: 'bg-blue-50', 
      tab: 'my-complaints', 
      filter: 'in_progress' 
    },
    { 
      label: 'Resolved', 
      value: stats.resolved, 
      icon: CheckCircle2, 
      color: 'text-green-600', 
      bg: 'bg-green-50', 
      tab: 'my-complaints', 
      filter: 'resolved' 
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
        <h2 className="text-3xl font-extrabold text-gray-900">
          Welcome back, {user.name}!
        </h2>
        <p className="text-gray-500 mt-2 font-medium">
          Here is a real-time overview of your submitted grievances.
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div 
            key={c.label} 
            onClick={() => onNavigate(c.tab, c.filter)}
            className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                  {c.label}
                </p>
                <p className={`text-3xl font-black ${c.color}`}>
                  {loading ? '...' : (c.value || 0)}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${c.bg} group-hover:scale-110 transition-transform`}>
                <c.icon className={`w-6 h-6 ${c.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Action Navigation */}
      <div className="grid md:grid-cols-2 gap-6">
        <div 
          onClick={() => onNavigate('new')} 
          className="bg-white border-2 border-blue-100 p-6 rounded-[32px] flex items-center gap-4 cursor-pointer hover:bg-blue-50 transition-all group"
        >
          <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-lg shadow-blue-200 group-hover:rotate-6 transition-transform">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">File New Complaint</h3>
            <p className="text-sm text-gray-500">Submit a new issue with photo evidence</p>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('track')} 
          className="bg-white border-2 border-gray-100 p-6 rounded-[32px] flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-all group"
        >
          <div className="bg-gray-900 p-4 rounded-2xl text-white shadow-lg shadow-gray-200 group-hover:rotate-6 transition-transform">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Track Complaint</h3>
            <p className="text-sm text-gray-500">Quickly check status using your Ticket ID</p>
          </div>
        </div>
      </div>
    </div>
  )
}