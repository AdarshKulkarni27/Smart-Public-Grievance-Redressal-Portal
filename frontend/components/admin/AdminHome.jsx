import { useState, useEffect } from 'react'
import { FileText, Users, UserCog, CheckCircle, Clock, RefreshCw, AlertCircle, AlertTriangle, ChevronRight } from 'lucide-react'
import api from '../../utils/api'

export default function AdminHome({ onNavigate }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard?role=admin')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || !stats) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
  }

  const glassCard = "bg-white/70 backdrop-blur-md border border-white/60 shadow-sm rounded-2xl p-6 hover:shadow-md hover:bg-white/90 hover:-translate-y-0.5 transition-all cursor-pointer group"

  const topCards = [
    { label: 'Total Complaints', value: stats.total, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100/50', tab: 'complaints', filter: 'all' },
    { label: 'Total Citizens', value: stats.totalCitizens, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100/50', tab: 'citizens', filter: 'all' }, // <-- THIS IS THE FIX
    { label: 'Total Officers', value: stats.totalOfficers, icon: UserCog, color: 'text-teal-600', bg: 'bg-teal-100/50', tab: 'officers', filter: 'all' },
    { label: 'Resolution Rate', value: `${stats.resolutionRate}%`, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100/50', tab: 'analytics', filter: 'all' },
  ]

  const statusCards = [
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100/50', tab: 'complaints', filter: 'pending' },
    { label: 'In Progress', value: stats.inProgress, icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-100/50', tab: 'complaints', filter: 'in_progress' },
    { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100/50', tab: 'complaints', filter: 'resolved' },
    { label: 'High Priority', value: stats.highPriority, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-100/50', tab: 'complaints', filter: 'all' },
  ]

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {topCards.map((c, i) => (
          <div key={i} onClick={() => onNavigate(c.tab, c.filter)} className={glassCard}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{c.label}</p>
                <h3 className={`text-3xl font-extrabold ${c.color}`}>{c.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <c.icon className={`w-6 h-6 ${c.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCards.map((c, i) => (
          <div key={i} onClick={() => onNavigate(c.tab, c.filter)} className={glassCard}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{c.label}</p>
                <h3 className={`text-3xl font-extrabold ${c.color}`}>{c.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <c.icon className={`w-6 h-6 ${c.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Unassigned Complaints */}
        <div className="bg-white/70 backdrop-blur-md border border-white/60 shadow-sm rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <h3 className="font-bold text-gray-900">Unassigned Complaints</h3>
                <p className="text-xs text-gray-500">Complaints requiring officer assignment</p>
              </div>
            </div>
            <button onClick={() => onNavigate('complaints', 'all')} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 flex flex-col justify-center">
            {stats.unassigned === 0 ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-green-100">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-sm font-medium text-gray-500">All complaints are currently assigned.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.unassignedComplaints?.slice(0, 4).map(c => (
                  <div key={c.ticketId} className="flex justify-between items-center p-3 bg-gray-50/50 border border-gray-100 rounded-xl">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{c.ticketId}</p>
                      <p className="text-xs text-gray-500">{c.categoryLabel}</p>
                    </div>
                    <button onClick={() => onNavigate('complaints', 'all')} className="text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200">
                      Assign
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white/70 backdrop-blur-md border border-white/60 shadow-sm rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <RefreshCw className="w-5 h-5 text-blue-500" />
            <div>
              <h3 className="font-bold text-gray-900">Category Distribution</h3>
              <p className="text-xs text-gray-500">Complaints by category</p>
            </div>
          </div>
          <div className="space-y-5">
            {Object.entries(stats.categoryDistribution || {}).map(([cat, count]) => {
              const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-700">{cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    <span className="font-bold text-gray-900">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}