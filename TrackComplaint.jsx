import { useState } from 'react'
import { Search, Loader2, AlertCircle, FileText, Info, Fingerprint } from 'lucide-react'
import api from '../../utils/api'
import { StatusBadge, PriorityBadge } from '../common/Badges'

export default function TrackComplaint() {
  const [ticketId, setTicketId] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const glassCardClasses = "bg-white/70 backdrop-blur-md border border-white/60 shadow-sm rounded-2xl p-6 md:p-8"

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!ticketId.trim()) return
    
    setLoading(true)
    setError('')
    setData(null)
    
    try {
      const r = await api.get(`/complaints/${ticketId.trim()}`)
      setData(r.data.complaint)
    } catch (err) {
      setError('Ticket ID not found. Please check and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Track Complaint</h2>
        <p className="text-gray-500 mt-1">Enter your Ticket ID to check the real-time status of your grievance.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Search & Results */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Search Input Card */}
          <div className={glassCardClasses}>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  className="block w-full pl-11 pr-4 py-4 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-mono placeholder-gray-400 text-lg"
                  placeholder="e.g., GRV-2026-001"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 disabled:opacity-70 flex items-center justify-center gap-2 min-w-[140px]"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Track Issue'}
              </button>
            </form>
            
            {error && (
              <div className="mt-5 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm font-medium animate-in fade-in">
                <AlertCircle className="w-5 h-5" /> {error}
              </div>
            )}
          </div>

          {/* Results Card */}
          {data && (
            <div className={`${glassCardClasses} animate-in fade-in slide-in-from-bottom-4 space-y-6`}>
              
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-gray-200/50 pb-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-mono text-sm font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-lg border border-blue-200">
                      {data.ticketId}
                    </span>
                    <StatusBadge status={data.status} />
                    <PriorityBadge priority={data.priority} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{data.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 font-medium">{data.categoryLabel} · Submitted on {new Date(data.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/40 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Location</p>
                  <p className="text-sm text-gray-900 font-medium">{data.location}</p>
                </div>
                <div className="bg-white/40 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Assigned Officer</p>
                  <p className="text-sm text-gray-900 font-medium">{data.assignedOfficer || 'Pending Assignment'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</p>
                <p className="text-sm text-gray-700 bg-white/50 p-5 rounded-xl border border-gray-200 leading-relaxed">{data.description}</p>
              </div>

              {/* Timeline Section */}
              {data.timeline && data.timeline.length > 0 && (
                <div className="pt-6 border-t border-gray-200/50">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-5">Tracking History</p>
                  <div className="relative pl-6 space-y-6">
                    <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200" />
                    {data.timeline.map((t, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-white" />
                        <p className="text-sm font-bold text-gray-900">{t.title}</p>
                        {t.description && <p className="text-sm text-gray-600 mt-1 leading-snug">{t.description}</p>}
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mt-2">{new Date(t.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Info Cards */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className={`${glassCardClasses} bg-gradient-to-br from-indigo-50/80 to-white/50`}>
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <Fingerprint className="w-5 h-5 text-indigo-700" />
              </div>
              <h3 className="font-bold text-gray-900">Where is my Ticket ID?</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              Your unique Ticket ID is generated immediately after you submit a complaint (e.g., <strong>GRV-2026-123</strong>).
            </p>
            <p className="text-sm text-gray-700 leading-relaxed mt-3">
              You can always find your active Ticket IDs by checking the <strong className="text-blue-600">My Complaints</strong> tab in your dashboard.
            </p>
          </div>

          <div className={glassCardClasses}>
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-gray-100 p-2 rounded-lg">
                <Info className="w-5 h-5 text-gray-700" />
              </div>
              <h3 className="font-bold text-gray-900">Status Glossary</h3>
            </div>
            <div className="space-y-4">
              <div>
                <span className="inline-block px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-md mb-1">Pending</span>
                <p className="text-xs text-gray-600">Issue is logged and awaiting officer assignment.</p>
              </div>
              <div>
                <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-md mb-1">Assigned</span>
                <p className="text-xs text-gray-600">An officer has been assigned to investigate.</p>
              </div>
              <div>
                <span className="inline-block px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-md mb-1">In Progress</span>
                <p className="text-xs text-gray-600">Active work is currently being done on site.</p>
              </div>
              <div>
                <span className="inline-block px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md mb-1">Resolved</span>
                <p className="text-xs text-gray-600">The grievance has been successfully fixed.</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}