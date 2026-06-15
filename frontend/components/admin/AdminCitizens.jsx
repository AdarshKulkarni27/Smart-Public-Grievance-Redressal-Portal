import { useState, useEffect } from 'react'
import { RefreshCw, Users, MapPin, Phone, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminCitizens() {
  const [citizens, setCitizens] = useState([])
  const [loading, setLoading] = useState(true)

  const loadCitizens = async () => {
    setLoading(true)
    try {
      // Using direct fetch to bypass any Axios config issues
      const response = await fetch('http://localhost:5000/api/citizens')
      const data = await response.json()

      if (response.ok && data.success) {
        setCitizens(data.citizens || [])
      } else {
        toast.error(data.error || 'Failed to load citizens')
      }
    } catch (error) {
      console.error("Fetch error:", error)
      toast.error('Could not connect to the backend API')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCitizens()
  }, [])

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Users className="text-blue-600 w-6 h-6" /> Registered Citizens
          </h2>
          <p className="text-gray-500 text-sm mt-1">Manage and view all platform users</p>
        </div>
        <button 
          onClick={loadCitizens} 
          className="p-2.5 bg-white border border-gray-200 rounded-xl hover:text-blue-600 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="animate-spin text-blue-600 w-8 h-8" />
        </div>
      ) : citizens.length === 0 ? (
        <div className="text-center py-20 bg-white/50 rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-gray-500 font-medium">No citizens found in the system.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Citizen Name</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Info</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Complaints Logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {citizens.map((citizen) => (
                  <tr key={citizen.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-gray-900">{citizen.name}</p>
                      <p className="text-xs font-mono text-gray-400 mt-1">ID: {citizen.id.substring(0, 8)}...</p>
                    </td>
                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-3.5 h-3.5 text-gray-400" /> {citizen.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-3.5 h-3.5 text-gray-400" /> {citizen.phone || 'N/A'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-start gap-2 text-sm text-gray-600 max-w-xs">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <span className="truncate whitespace-normal">{citizen.address || 'Address not provided'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-bold text-sm border border-blue-100">
                        {citizen.complaintCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}