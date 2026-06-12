import { useState, useEffect } from 'react'
import { Plus, X, User, ClipboardList, MapPin, Calendar } from 'lucide-react'
import api from '../../utils/api'
import { StatusBadge, PriorityBadge } from '../common/Badges'
import toast from 'react-hot-toast'

const DEPT_CATS = {
  'Water Supply':     ['water_supply'],
  'Electricity':      ['electricity'],
  'Road Maintenance': ['road_maintenance'], 
  'Street Lighting':  ['street_lighting'],
  'Sanitation':       ['sanitation'],
  'General':          ['other'],
}

export default function AdminOfficers() {
  const [officers, setOfficers] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name:'', email:'', phone:'', department:'Water Supply', password:'officer123' })
  const [saving, setSaving] = useState(false)
  
  // NEW: State for viewing a specific officer's details and their complaints
  const [selectedOfficer, setSelectedOfficer] = useState(null)
  const [officerComplaints, setOfficerComplaints] = useState([])
  const [loadingComplaints, setLoadingComplaints] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/officers')
      .then(r => setOfficers(r.data.officers))
      .catch(() => toast.error('Failed to load officers'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleAdd = async e => {
    e.preventDefault(); 
    setSaving(true)
    try {
      await api.post('/officers', { ...form, categories: DEPT_CATS[form.department] || [] })
      toast.success('Officer added successfully')
      setShowModal(false)
      setForm({ name:'', email:'', phone:'', department:'Water Supply', password:'officer123' })
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add officer')
    } finally { 
      setSaving(false) 
    }
  }

  const handleViewOfficer = async (officer) => {
    setSelectedOfficer(officer)
    setLoadingComplaints(true)
    try {
      const r = await api.get(`/complaints?officer_id=${officer.id}`)
      setOfficerComplaints(r.data.complaints)
    } catch {
      toast.error('Failed to load officer complaints')
    } finally {
      setLoadingComplaints(false)
    }
  }

  const glassCard = "bg-white/70 backdrop-blur-md border border-white/60 shadow-sm rounded-2xl p-6"

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Officers Management</h2>
          <p className="text-gray-500 mt-1">View and manage department officers</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-blue-500/30">
          <Plus className="w-5 h-5" /> Add Officer
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {officers.map(o => (
            <div 
              key={o.id} 
              onClick={() => handleViewOfficer(o)}
              className={`${glassCard} cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:bg-white/90 transition-all group`}
            >
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <User className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg leading-tight">{o.name}</div>
                  <div className="text-sm font-medium text-gray-500">{o.department}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{o.email}</div>
                </div>
              </div>
              
              <div className="border-t border-gray-200/60 pt-4">
                <div className="flex justify-around text-center mb-4">
                  <div>
                    <div className="text-3xl font-extrabold text-blue-600">{o.assignedCount}</div>
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mt-1">Assigned</div>
                  </div>
                  <div className="w-px bg-gray-200" />
                  <div>
                    <div className="text-3xl font-extrabold text-green-600">{o.resolvedCount}</div>
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mt-1">Resolved</div>
                  </div>
                </div>
                <div className="text-center">
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200">
                    {(o.assignedCategories || []).map(c => c.replace('_',' ')).join(', ')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NEW: Officer Details & Complaints Modal */}
      {selectedOfficer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedOfficer(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-md shadow-blue-200">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedOfficer.name}</h3>
                  <p className="text-sm font-medium text-blue-600">{selectedOfficer.department} Department</p>
                </div>
              </div>
              <button onClick={() => setSelectedOfficer(null)} className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 p-2 rounded-full border border-gray-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Officer's Complaints */}
            <div className="p-6 overflow-y-auto bg-gray-50/30">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList className="w-5 h-5 text-gray-500" />
                <h4 className="font-bold text-gray-900">Assigned Grievances</h4>
              </div>

              {loadingComplaints ? (
                <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
              ) : officerComplaints.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-xl border border-gray-100">
                  <p className="text-sm font-medium text-gray-500">No complaints currently assigned to this officer.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {officerComplaints.map(c => (
                    <div key={c.ticketId} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{c.ticketId}</span>
                          <PriorityBadge priority={c.priority} />
                        </div>
                        <h5 className="font-bold text-gray-900 text-sm mb-1">{c.title}</h5>
                        <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {c.location}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <StatusBadge status={c.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Officer Modal (Styled) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add New Officer</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700 bg-gray-50 p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              {[
                { k:'name',  label:'Full Name',  type:'text',  placeholder:'e.g., Anish Kumar' },
                { k:'email', label:'Email Address', type:'email', placeholder:'officer@grievance.gov' },
                { k:'phone', label:'Phone Number',  type:'tel',   placeholder:'Phone number' },
                { k:'password',label:'Default Password', type:'text', placeholder:'officer123' },
              ].map(({ k, label, type, placeholder }) => (
                <div key={k}>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">{label}</label>
                  <input 
                    type={type} required 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm" 
                    placeholder={placeholder}
                    value={form[k]} onChange={set(k)} 
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Department Assignment</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm font-medium" 
                  value={form.department} onChange={set('department')}
                >
                  {Object.keys(DEPT_CATS).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-70 shadow-md">
                  {saving ? 'Saving...' : 'Add Officer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}