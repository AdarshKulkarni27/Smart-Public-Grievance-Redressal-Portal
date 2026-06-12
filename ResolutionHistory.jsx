import { useState, useEffect } from 'react'
import { Clock, FileText, ImageIcon } from 'lucide-react'
import api from '../../utils/api'
import { PriorityBadge } from '../common/Badges'
import toast from 'react-hot-toast'

export default function ResolutionHistory({ officer }) {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/complaints?officer_id=${officer.id}&status=resolved`)
      .then(r => setComplaints(r.data.complaints))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }, [officer.id])

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Resolution History</h2>
      <p className="text-sm text-gray-400 mb-5">Your resolved complaints</p>

      {loading ? (
        <div className="flex justify-center h-40 items-center">
          <div className="w-7 h-7 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : complaints.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No resolved complaints yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map(c => (
            <div key={c.ticketId} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-blue-600 font-bold">{c.ticketId}</span>
                    <span className="badge badge-resolved">Resolved</span>
                    <PriorityBadge priority={c.priority} />
                    {c.hasImage && <span className="badge bg-purple-50 text-purple-700 flex items-center gap-1"><ImageIcon className="w-3 h-3" />Photo</span>}
                  </div>
                  <p className="font-semibold text-gray-900">{c.title}</p>
                  <p className="text-xs text-gray-400">{c.categoryLabel} · {c.citizenName} · Resolved {c.resolvedAt?.split('T')[0]}</p>
                </div>
              </div>
              {c.resolution && (
                <div className="bg-green-50 rounded-lg px-3 py-2 text-sm text-green-800 mb-2">
                  <span className="font-semibold text-green-700 text-xs uppercase mr-2">Resolution:</span>{c.resolution}
                </div>
              )}
              {c.aiReport && (
                <button onClick={() => {
                  const blob = new Blob([c.aiReport], { type: 'text/plain' })
                  const a = document.createElement('a')
                  a.href = URL.createObjectURL(blob)
                  a.download = `report-${c.ticketId}.txt`
                  a.click()
                }} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                  <FileText className="w-3 h-3" /> Download AI Report
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
