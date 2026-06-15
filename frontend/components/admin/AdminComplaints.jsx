import { useState, useEffect } from 'react'
import { Search, RefreshCw, X, MapPin, Calendar, FileText } from 'lucide-react'
import api from '../../utils/api'
import { StatusBadge } from '../common/Badges'
import toast from 'react-hot-toast'

export default function AdminComplaints({ initialFilter = 'all' }) {
  const [complaints, setComplaints] = useState([])
  const [officers, setOfficers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(initialFilter)
  const [catFilter, setCatFilter] = useState('All Categories')
  
  // State for the pop-up modal
  const [selectedComplaint, setSelectedComplaint] = useState(null)

  // Listen for dashboard clicks
  useEffect(() => { setStatusFilter(initialFilter) }, [initialFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const [compRes, offRes] = await Promise.all([
        api.get('/complaints'),
        api.get('/officers')
      ])
      setComplaints(compRes.data.complaints)
      setOfficers(offRes.data.officers)
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleAssign = async (ticketId, officerId) => {
    if (!officerId) return
    try {
      await api.put(`/complaints/${ticketId}`, { assignedTo: officerId })
      toast.success('Complaint reassigned successfully')
      loadData()
    } catch {
      toast.error('Failed to reassign complaint')
    }
  }

  const filtered = complaints.filter(c => {
    const sMatch = statusFilter === 'all' || c.status === statusFilter
    const cMatch = catFilter === 'All Categories' || c.categoryLabel === catFilter
    const qMatch = c.ticketId.toLowerCase().includes(search.toLowerCase()) || 
                   c.title.toLowerCase().includes(search.toLowerCase())
    return sMatch && cMatch && qMatch
  })

  return (
    <div className="bg-white/70 backdrop-blur-md border border-white/60 rounded-2xl shadow-sm p-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Complaints</h2>
          <p className="text-sm text-gray-500">Manage and assign complaints</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-medium transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" placeholder="Search complaints..." 
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <select 
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
        <select 
          value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All Categories">All Categories</option>
          {Array.from(new Set(complaints.map(c => c.categoryLabel))).map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl border border-gray-100">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
              <th className="p-4 font-bold">Ticket ID</th>
              <th className="p-4 font-bold">Title</th>
              <th className="p-4 font-bold">Category</th>
              <th className="p-4 font-bold">Citizen</th>
              <th className="p-4 font-bold">Status</th>
              <th className="p-4 font-bold">Assigned To</th>
              <th className="p-4 font-bold">Date</th>
              <th className="p-4 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filtered.length === 0 ? (
              <tr><td colSpan="8" className="p-8 text-center text-gray-500">No complaints found.</td></tr>
            ) : (
              filtered.map(c => (
                <tr 
                  key={c.ticketId} 
                  onClick={() => setSelectedComplaint(c)}
                  className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                >
                  <td className="p-4 font-mono font-bold text-blue-600">{c.ticketId}</td>
                  <td className="p-4 font-semibold text-gray-900 max-w-[200px] truncate">{c.title}</td>
                  <td className="p-4"><span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-medium">{c.categoryLabel}</span></td>
                  <td className="p-4 text-gray-600">{c.citizenName}</td>
                  <td className="p-4"><StatusBadge status={c.status} /></td>
                  <td className="p-4 text-gray-600">{c.assignedOfficer || <span className="text-red-500 font-medium">Unassigned</span>}</td>
                  <td className="p-4 text-gray-500 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <div 
                      className="flex items-center justify-end gap-2" 
                      onClick={(e) => e.stopPropagation()} /* Prevents row click when interacting with dropdown */
                    >
                      <select 
                        onChange={(e) => handleAssign(c.ticketId, e.target.value)}
                        className="bg-white border border-gray-200 rounded text-xs px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select officer</option>
                        {officers.filter(o => o.assignedCategories?.includes(c.category)).map(o => (
                          <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedComplaint(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
            
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg">{selectedComplaint.ticketId}</span>
                <StatusBadge status={selectedComplaint.status} />
              </div>
              <button onClick={() => setSelectedComplaint(null)} className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{selectedComplaint.title}</h3>
              
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg"><MapPin className="w-4 h-4 text-gray-400"/> {selectedComplaint.location}</div>
                <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg"><Calendar className="w-4 h-4 text-gray-400"/> {new Date(selectedComplaint.createdAt).toLocaleString()}</div>
              </div>

              <div className="mb-6">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</p>
                <div className="bg-gray-50 p-4 rounded-xl text-gray-800 text-sm leading-relaxed border border-gray-100">
                  {selectedComplaint.description}
                </div>
              </div>

              {selectedComplaint.imageUrl && (
                <div className="mb-6">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Photo Evidence</p>
                  <img src={selectedComplaint.imageUrl} alt="Evidence" className="w-full rounded-xl border border-gray-200 max-h-80 object-cover" />
                </div>
              )}

              {selectedComplaint.aiSummary && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">AI Summary</p>
                  </div>
                  <p className="text-sm text-blue-900 leading-relaxed">{selectedComplaint.aiSummary}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}