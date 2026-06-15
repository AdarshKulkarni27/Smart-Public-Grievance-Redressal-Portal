import { useState, useEffect } from 'react'
import { ClipboardList, AlertCircle, RefreshCw, CheckCircle2, ChevronRight } from 'lucide-react'
import api from '../../utils/api'
import { StatusBadge, PriorityBadge } from '../common/Badges'

export default function OfficerHome({ officer, onNavigate }) {
  const [stats, setStats]     = useState({ total:0, pendingAction:0, inProgress:0, resolved:0, pendingComplaints:[], inProgressComplaints:[] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get(`/dashboard?role=officer&officerId=${officer.id}`)
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [officer.id])

  // NEW: Added targetTab and filterValue
  const cards = [
    { label: 'Assigned',       value: stats.total,         icon: ClipboardList, color: 'text-blue-600',   border: 'border-l-blue-500',   targetTab: 'assigned', filterValue: 'all' },
    { label: 'Pending Action', value: stats.pendingAction, icon: AlertCircle,   color: 'text-yellow-600', border: 'border-l-yellow-400', targetTab: 'assigned', filterValue: 'pending' },
    { label: 'In Progress',    value: stats.inProgress,    icon: RefreshCw,     color: 'text-blue-500',   border: 'border-l-blue-400',   targetTab: 'assigned', filterValue: 'in_progress' },
    { label: 'Resolved',       value: stats.resolved,      icon: CheckCircle2,  color: 'text-green-600',  border: 'border-l-green-500',  targetTab: 'history',  filterValue: 'all' },
  ]

  return (
    <div>
      <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-6 md:p-8 mb-6 border border-green-100 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome, {officer.name.split(' ')[0]}!</h2>
        <p className="text-gray-600 font-medium text-sm">Manage and resolve assigned grievances efficiently for the <span className="font-bold text-green-700">{officer.department}</span> department.</p>
      </div>

      {/* Stat cards - NOW CLICKABLE */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color, border, targetTab, filterValue }) => (
          <div 
            key={label} 
            onClick={() => onNavigate(targetTab, filterValue)}
            className={`card border-l-4 ${border} flex items-center justify-between cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all group`}
          >
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">{label}</div>
              <div className={`text-3xl font-extrabold ${color}`}>{loading ? '–' : value}</div>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gray-50 group-hover:scale-110 transition-transform`}>
              <Icon className={`w-6 h-6 ${color} opacity-80`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Action Required */}
        <div className="card h-full">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 leading-tight">Pending Action Required</h3>
                <p className="text-xs font-medium text-gray-500 mt-0.5">Complaints waiting for your response</p>
              </div>
            </div>
            <button 
              onClick={() => onNavigate('assigned', 'pending')}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 transition-colors"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          {!loading && stats.pendingComplaints.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-green-100">
                <CheckCircle2 className="w-7 h-7 text-green-500" />
              </div>
              <p className="text-sm font-medium text-gray-500">No pending complaints. Great job!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.pendingComplaints.map(c => (
                <div key={c.ticketId} className="flex items-center gap-3 p-3 bg-gray-50/50 hover:bg-gray-50 rounded-xl border border-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-bold">{c.ticketId}</span>
                      <PriorityBadge priority={c.priority} />
                    </div>
                    <p className="text-sm font-bold text-gray-900 truncate mb-0.5">{c.title}</p>
                    <p className="text-xs font-medium text-gray-500 truncate">{c.citizenName} · {c.location}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Currently In Progress */}
        <div className="card h-full">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <RefreshCw className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 leading-tight">Currently In Progress</h3>
                <p className="text-xs font-medium text-gray-500 mt-0.5">Complaints you are actively working on</p>
              </div>
            </div>
            <button 
              onClick={() => onNavigate('assigned', 'in_progress')}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 transition-colors"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {!loading && stats.inProgressComplaints.length === 0 ? (
            <div className="text-center py-10">
              <RefreshCw className="w-10 h-10 mx-auto mb-3 text-gray-200" />
              <p className="text-sm font-medium text-gray-400">No complaints currently in progress</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.inProgressComplaints.map(c => (
                <div key={c.ticketId} className="flex items-center gap-3 p-3 bg-gray-50/50 hover:bg-gray-50 rounded-xl border border-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                       <span className="font-mono text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-bold">{c.ticketId}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 truncate mb-0.5">{c.title}</p>
                    <p className="text-xs font-medium text-gray-500 truncate">{c.location}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}