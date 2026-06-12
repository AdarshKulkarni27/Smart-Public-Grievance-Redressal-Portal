import { useState } from 'react'
import { Droplet, Lightbulb, Car, Trash2, Lamp, HelpCircle, Upload, CheckCircle2, ArrowLeft, Info, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { id: 'water_supply', label: 'Water Supply', icon: Droplet, color: 'text-blue-500', bg: 'bg-blue-100/60' },
  { id: 'electricity', label: 'Electricity', icon: Lightbulb, color: 'text-yellow-600', bg: 'bg-yellow-100/60' },
  { id: 'road_maintenance', label: 'Road Maintenance', icon: Car, color: 'text-gray-600', bg: 'bg-gray-200/60' },
  { id: 'sanitation', label: 'Sanitation', icon: Trash2, color: 'text-green-500', bg: 'bg-green-100/60' },
  { id: 'street_lighting', label: 'Street Lighting', icon: Lamp, color: 'text-orange-500', bg: 'bg-orange-100/60' },
  { id: 'other', label: 'Other', icon: HelpCircle, color: 'text-purple-500', bg: 'bg-purple-100/60' },
]

// NEW: Smart mapping of specific issues based on the chosen category
const ISSUE_TYPES = {
  water_supply: ['Leaking Pipe', 'No Water Supply', 'Contaminated Water', 'Low Water Pressure', 'Other'],
  electricity: ['Power Outage', 'Sparking / Loose Wires', 'Faulty Meter', 'Voltage Fluctuations', 'Other'],
  road_maintenance: ['Potholes', 'Broken Pavement', 'Waterlogging', 'Unfinished Construction', 'Other'],
  sanitation: ['Garbage Uncollected', 'Clogged Drain / Overflow', 'Dead Animal', 'Public Toilet Issue', 'Other'],
  street_lighting: ['Light Not Working', 'Pole Damaged / Fallen', 'Dim Light', 'Other'],
  other: ['Noise Pollution', 'Tree Trimming', 'Stray Animals', 'General Inquiry']
}

export default function ComplaintForm({ user, onSuccess }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ 
    category: '', 
    subcategory: '', 
    title: '', 
    description: '', 
    location: '', 
    priority: 'medium' 
  })
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(false)

  const glassCardClasses = "bg-white/70 backdrop-blur-md border border-white/60 shadow-sm rounded-2xl p-6 md:p-8"

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const formData = new FormData()
      
      formData.append('citizen_id', user?.id || '')
      formData.append('citizen_name', user?.name || '')
      formData.append('citizen_email', user?.email || '')
      
      Object.keys(form).forEach(k => formData.append(k, form[k]))
      if (image) formData.append('image', image)

      const response = await fetch('http://localhost:5000/api/complaints', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()

      if (response.ok && data.success) {
        toast.success(`Complaint Submitted! Ticket ID: ${data.ticketId}`)
        setForm({ category: '', subcategory: '', title: '', description: '', location: '', priority: 'medium' })
        setImage(null)
        setStep(1)
        if (onSuccess) onSuccess()
      } else {
        toast.error(data.error || 'Failed to submit complaint')
      }
    } catch (err) {
      toast.error('Network error. Is the Flask server running?')
    } finally {
      setLoading(false)
    }
  }

  // Get the list of specific issues based on the selected category
  const currentIssueTypes = form.category ? ISSUE_TYPES[form.category] : []

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">File a New Complaint</h2>
        <p className="text-gray-500 mt-1">Select a category and provide details about the issue.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {step === 1 ? (
            <div className={glassCardClasses}>
              <div className="flex items-center gap-4 mb-8 border-b border-gray-200/50 pb-5">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-200">1</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Select Category</h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">Choose the department for your grievance</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {CATEGORIES.map(({ id, label, icon: Icon, color, bg }) => (
                  <button
                    key={id}
                    onClick={() => { 
                      // Reset subcategory when a new category is picked
                      setForm({ ...form, category: id, subcategory: '' }); 
                      setStep(2); 
                    }}
                    className="flex flex-col items-center justify-center p-6 bg-white/50 border border-white/60 rounded-xl hover:bg-white/90 hover:shadow-lg hover:-translate-y-1 transition-all group"
                  >
                    <div className={`w-14 h-14 ${bg} rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-7 h-7 ${color}`} />
                    </div>
                    <span className="text-sm font-bold text-gray-800">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={glassCardClasses}>
              <div className="flex items-center justify-between mb-8 border-b border-gray-200/50 pb-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-200">2</div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Complaint Details</h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Provide specific information</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  className="px-4 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg font-bold flex items-center gap-2 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* DROPDOWNS: Issue Type & Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Specific Issue Type</label>
                    <select 
                      required
                      value={form.subcategory} 
                      onChange={e => setForm({ ...form, subcategory: e.target.value })} 
                      className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-gray-700 appearance-none"
                    >
                      <option value="" disabled>Select an issue type...</option>
                      {currentIssueTypes.map((type, idx) => (
                        <option key={idx} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Priority Level</label>
                    <select 
                      value={form.priority} 
                      onChange={e => setForm({ ...form, priority: e.target.value })} 
                      className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-gray-700 appearance-none"
                    >
                      <option value="low">Low - No immediate hazard</option>
                      <option value="medium">Medium - Needs attention soon</option>
                      <option value="high">High - Causing active disruption</option>
                      <option value="critical">Critical - Safety/Health hazard</option>
                    </select>
                  </div>
                </div>

                {/* TEXT INPUTS: Title, Description, Location */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Complaint Title</label>
                  <input 
                    required 
                    type="text" 
                    value={form.title} 
                    onChange={e => setForm({ ...form, title: e.target.value })} 
                    className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder-gray-400" 
                    placeholder="Short, descriptive title of the issue" 
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Detailed Description</label>
                  <textarea 
                    required 
                    rows={4} 
                    value={form.description} 
                    onChange={e => setForm({ ...form, description: e.target.value })} 
                    className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all resize-none placeholder-gray-400" 
                    placeholder="Please describe the issue in detail to help officers resolve it faster..." 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Location Address</label>
                  <input 
                    required 
                    type="text" 
                    value={form.location} 
                    onChange={e => setForm({ ...form, location: e.target.value })} 
                    className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder-gray-400" 
                    placeholder="Enter exact location or landmarks" 
                  />
                </div>

                {/* PHOTO UPLOAD */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Photo Evidence (Optional)</label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-36 bg-white/50 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer hover:bg-white/80 transition-all">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {image ? (
                          <>
                            <CheckCircle2 className="w-10 h-10 text-green-500 mb-2" />
                            <p className="text-sm font-bold text-gray-800">{image.name}</p>
                            <p className="text-xs text-gray-500 mt-1">Ready to upload</p>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                              <Upload className="w-6 h-6 text-gray-500" />
                            </div>
                            <p className="text-sm text-gray-600"><span className="font-bold text-blue-600">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-gray-400 mt-1">PNG or JPG up to 5MB</p>
                          </>
                        )}
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={e => setImage(e.target.files[0])} />
                    </label>
                  </div>
                </div>

                {/* SUBMIT BUTTON */}
                <div className="pt-4 border-t border-gray-200/50">
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 disabled:opacity-70 flex justify-center items-center gap-2"
                  >
                    {loading ? 'Submitting Complaint...' : 'Submit Complaint'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-1 space-y-6">
          <div className={`${glassCardClasses} bg-gradient-to-br from-blue-50/80 to-white/50`}>
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-blue-100 p-2 rounded-lg"><Info className="w-5 h-5 text-blue-700" /></div>
              <h3 className="font-bold text-gray-900">Submission Guidelines</h3>
            </div>
            <ul className="space-y-4 text-sm text-gray-700">
              <li className="flex gap-3"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div><p><strong className="text-gray-900">Select Correct Type:</strong> Using the dropdown ensures your ticket routes correctly.</p></li>
              <li className="flex gap-3"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div><p><strong className="text-gray-900">Be Specific:</strong> Provide exact landmarks and detailed descriptions.</p></li>
              <li className="flex gap-3"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div><p><strong className="text-gray-900">Upload Photos:</strong> Clear visual evidence drastically improves resolution time.</p></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}