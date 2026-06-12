import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, CheckCircle2, RefreshCw } from 'lucide-react'
import api from '../../utils/api'

const CAT_LABELS = { water_supply:'Water Supply', electricity:'Electricity', road_maintenance:'Road Maintenance', sanitation:'Sanitation', street_lighting:'Street Lighting', other:'Other' }
const CAT_COLORS = { water_supply:'bg-blue-600', electricity:'bg-yellow-500', road_maintenance:'bg-gray-600', sanitation:'bg-green-500', street_lighting:'bg-orange-500', other:'bg-purple-500' }

export default function AdminAnalytics() {
  const [stats, setStats]     = useState(null)
  const [officers, setOfficers] = useState([])

  useEffect(() => {
    api.get('/dashboard?role=admin').then(r => setStats(r.data)).catch(() => {})
    api.get('/officers').then(r => setOfficers(r.data.officers || [])).catch(() => {})
  }, [])

  if (!stats) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>

  const maxCat = Math.max(...Object.values(stats.categoryDistribution || {}), 1)
  const glassCard = "bg-white/70 backdrop-blur-md border border-white/60 shadow-sm rounded-2xl p-6 md:p-8"

  return (
    <div className="w-full space-y-6">
      
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Overview</h2>
        <p className="text-gray-500 mt-1">System performance and grievance statistics</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Total Complaints', value: stats.total,             icon: BarChart3,    color:'text-blue-600',   bg:'bg-blue-100/60' },
          { label:'Resolution Rate',  value: `${stats.resolutionRate}%`, icon: TrendingUp, color:'text-green-600',  bg:'bg-green-100/60' },
          { label:'Active Citizens',  value: stats.totalCitizens,     icon: Users,        color:'text-purple-600', bg:'bg-purple-100/60' },
          { label:'Total Resolved',   value: stats.resolved,          icon: CheckCircle2, color:'text-green-600',  bg:'bg-green-100/60' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${glassCard} flex items-center justify-between !p-6 hover:-translate-y-0.5 transition-transform`}>
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">{label}</div>
              <div className={`text-3xl font-extrabold ${color}`}>{value}</div>
            </div>
            <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Category Distribution Bar Chart */}
        <div className={glassCard}>
          <div className="flex items-center gap-2 mb-8">
            <RefreshCw className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-gray-900 text-lg">Complaints by Category</h3>
          </div>
          <div className="space-y-6">
            {Object.entries(stats.categoryDistribution || {}).map(([cat, cnt]) => {
              const pct = Math.round((cnt / maxCat) * 100)
              return (
                <div key={cat} className="group">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700 font-semibold">{CAT_LABELS[cat] || cat}</span>
                    <span className="text-gray-900 font-bold">{cnt}</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${CAT_COLORS[cat] || 'bg-blue-500'} rounded-full transition-all duration-1000 ease-out`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Status Distribution */}
        <div className={glassCard}>
          <div className="flex items-center gap-2 mb-8">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-gray-900 text-lg">Status Overview</h3>
          </div>
          <div className="space-y-6">
            {[
              { label:'Pending',     value: stats.pending,  color:'bg-yellow-500', text:'text-yellow-600' },
              { label:'In Progress', value: stats.inProgress, color:'bg-blue-500',   text:'text-blue-600' },
              { label:'Resolved',    value: stats.resolved, color:'bg-green-500',  text:'text-green-600' },
              { label:'High Priority',value:stats.highPriority,color:'bg-red-500',    text:'text-red-600' },
            ].map(({ label, value, color, text }) => {
              const pct = stats.total ? Math.round((value / stats.total) * 100) : 0
              return (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700 font-semibold">{label}</span>
                    <span className={`font-bold ${text}`}>{value} <span className="text-gray-400 font-medium text-xs ml-1">({pct}%)</span></span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Officer Performance Table */}
        <div className={`${glassCard} lg:col-span-2 !p-0 overflow-hidden`}>
          <div className="p-6 border-b border-gray-100/50">
            <h3 className="font-bold text-gray-900 text-lg">Officer Performance</h3>
            <p className="text-xs text-gray-500 mt-1">Resolution metrics mapped by assigned personnel</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold">
                  <th className="py-4 px-6">Officer</th>
                  <th className="py-4 px-6">Department</th>
                  <th className="py-4 px-6">Assigned</th>
                  <th className="py-4 px-6">Resolved</th>
                  <th className="py-4 px-6 min-w-[200px]">Resolution Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {officers.map(o => {
                  const rate = o.assignedCount ? Math.round((o.resolvedCount / o.assignedCount) * 100) : 0
                  return (
                    <tr key={o.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-4 px-6 font-bold text-gray-900">{o.name}</td>
                      <td className="py-4 px-6 text-sm text-gray-500 font-medium">{o.department}</td>
                      <td className="py-4 px-6 text-sm font-bold text-blue-600">{o.assignedCount}</td>
                      <td className="py-4 px-6 text-sm font-bold text-green-600">{o.resolvedCount}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full transition-all duration-1000" style={{ width:`${rate}%` }} />
                          </div>
                          <span className="text-xs font-bold text-gray-500 w-12">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}