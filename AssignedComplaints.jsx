import { useState, useEffect } from 'react'
import { RefreshCw, ChevronDown, ChevronUp, Download, FileCheck } from 'lucide-react'
import api from '../../utils/api'
import { StatusBadge, PriorityBadge } from '../common/Badges'
import toast from 'react-hot-toast'
import { jsPDF } from "jspdf"

// Helper function to fetch the image and convert it so jsPDF can read it
const fetchImageAsBase64 = async (url) => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
};

function ComplaintCard({ c, onUpdate, officer }) {
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)

  // Action States
  const [newStatus, setNewStatus] = useState(c.status)
  const [resolveMode, setResolveMode] = useState(false)
  const [resolutionNote, setResolutionNote] = useState('')

  const [resolvedImage, setResolvedImage] = useState(null)

  const [resolving, setResolving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const toggle = async () => {
    if (!open && !detail) {
      setLoading(true)
      try {
        const r = await api.get(`/complaints/${c.ticketId}`)
        setDetail(r.data.complaint)
      } catch (error) { 
        toast.error('Failed to load details') 
      } finally { 
        setLoading(false) 
      }
    }
    setOpen(!open)
    setResolveMode(false)
  }

  const handleUpdateStatus = async () => {
    try {
      await api.put(`/complaints/${c.ticketId}`, { status: newStatus, actorName: officer.name })
      toast.success('Status updated')
      onUpdate()
    } catch (error) { 
      toast.error('Update failed') 
    }
  }

  // Core PDF Generation Logic (Shared for auto-download and manual download)
  const generatePDF = async (complaintData, isAuto = false) => {
    setDownloading(true);
    try {
      const doc = new jsPDF();
      
      // --- HEADER ---
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(37, 99, 235); // Blue
      doc.text("OFFICIAL GRIEVANCE RESOLUTION REPORT", 105, 20, { align: "center" });
      doc.setDrawColor(200, 200, 200);
      doc.line(15, 25, 195, 25);

      // --- CITIZEN & COMPLAINT METADATA ---
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      
      doc.setFont("helvetica", "bold"); doc.text("Ticket ID:", 15, 35);
      doc.setFont("helvetica", "normal"); doc.text(complaintData.ticketId || "N/A", 45, 35);

      doc.setFont("helvetica", "bold"); doc.text("Citizen Name:", 15, 45);
      doc.setFont("helvetica", "normal"); doc.text(complaintData.citizenName || "Not Provided", 45, 45);

      doc.setFont("helvetica", "bold"); doc.text("Category:", 110, 35);
      doc.setFont("helvetica", "normal"); doc.text(complaintData.categoryLabel || complaintData.category || "N/A", 135, 35);

      doc.setFont("helvetica", "bold"); doc.text("Date Filed:", 110, 45);
      doc.setFont("helvetica", "normal"); doc.text(complaintData.createdAt ? new Date(complaintData.createdAt).toLocaleDateString() : new Date().toLocaleDateString(), 135, 45);
      
      doc.line(15, 52, 195, 52);

      // --- DESCRIPTION ---
      doc.setFont("helvetica", "bold"); doc.text("Original Complaint:", 15, 62);
      doc.setFont("helvetica", "normal");
      const descLines = doc.splitTextToSize(complaintData.description || (detail?.description) || "N/A", 180);
      doc.text(15, 70, descLines);
      
      let yPos = 70 + (descLines.length * 5) + 5;

      // --- RESOLUTION DETAILS ---
      doc.setDrawColor(37, 99, 235);
      doc.line(15, yPos, 195, yPos); // Blue separator
      yPos += 10;

      doc.setFont("helvetica", "bold"); doc.text("Resolved By (Officer):", 15, yPos);
      doc.setFont("helvetica", "normal"); doc.text(complaintData.assignedOfficer || officer.name || "N/A", 65, yPos);
      yPos += 10;

      doc.setFont("helvetica", "bold"); doc.text("Official Resolution:", 15, yPos);
      doc.setFont("helvetica", "normal");
      const resLines = doc.splitTextToSize(complaintData.resolution || "N/A", 180);
      doc.text(15, yPos + 7, resLines);
      
      yPos += 7 + (resLines.length * 5) + 10;

      // --- IMAGE ---
      const hasImg = complaintData.hasImage || detail?.hasImage;
      const imgUrl = complaintData.imageUrl || detail?.imageUrl;
      
      if (hasImg && imgUrl) {
          if (yPos > 200) { doc.addPage(); yPos = 20; }
          doc.setFont("helvetica", "bold"); doc.text("Attached Photographic Evidence:", 15, yPos);
          try {
              const imgBase64 = await fetchImageAsBase64(`http://localhost:5000${imgUrl}`);
              doc.addImage(imgBase64, 'JPEG', 15, yPos + 5, 120, 90, undefined, 'FAST');
          } catch (err) {
              console.error("Could not fetch image for PDF", err);
          }
      }
// OFFICER RESOLUTION IMAGE
const resolvedImgUrl =
  complaintData.resolvedImageUrl ||
  detail?.resolvedImageUrl ||
  c?.resolvedImageUrl

if (resolvedImgUrl) {

  yPos += 105

  doc.setFont("helvetica", "bold")
  doc.text(
    "Officer Resolution Image:",
    15,
    yPos
  )

  try {

    const resolvedBase64 =
      await fetchImageAsBase64(
        `http://localhost:5000${resolvedImgUrl}`
      )

    doc.addImage(
      resolvedBase64,
      'JPEG',
      15,
      yPos + 5,
      120,
      90
    )

  } catch (err) {

    console.error(
      "Resolved image error",
      err
    )
  }
}
      doc.save(`${complaintData.ticketId}_Resolution_Report.pdf`);
      if (!isAuto) toast.success("PDF Downloaded Successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  const handleResolve = async () => {

  if (!resolutionNote.trim()) {
    return toast.error('Enter a resolution note')
  }

  setResolving(true)

  try {

    const formData = new FormData()

    formData.append("resolution", resolutionNote)
    formData.append("officerName", officer.name)

    if (resolvedImage) {
      formData.append(
        "resolved_image",
        resolvedImage
      )
    }

    const response = await api.put(
      `/complaints/${c.ticketId}/resolve`,
      formData,
      {
        headers: {
          "Content-Type":
          "multipart/form-data"
        }
      }
    )

    const updatedData = {
      ...c,
      status: 'resolved',
      resolution: resolutionNote,
      assignedOfficer: officer.name,
      resolvedImageUrl:
        response?.data?.resolvedImageUrl || null
    }

    await generatePDF(
      updatedData,
      true
    )
    console.log("Officer Image URL:", response.data.resolvedImageUrl)

    toast.success(
      'Resolved & PDF Downloaded!'
    )

    setResolveMode(false)
    setResolutionNote('')
    setResolvedImage(null)

    onUpdate()

  } catch (error) {

    console.error(error)

    toast.error(
      'Resolution failed'
    )

  } finally {

    setResolving(false)
  }
}

  return (
    <div className="bg-white/70 backdrop-blur-md border border-white/60 shadow-sm rounded-2xl overflow-hidden mb-4 transition-all duration-200 hover:shadow-md">
      {/* Header Section */}
      <div className="p-5 cursor-pointer hover:bg-white/50" onClick={toggle}>
        <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
          <div className="flex-1 w-full">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="font-mono text-sm font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                {c.ticketId}
              </span>
              <StatusBadge status={c.status} />
              <PriorityBadge priority={c.priority} />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">{c.title}</h3>
          </div>
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 border shrink-0 text-gray-500">
            {loading ? <RefreshCw className="animate-spin w-5 h-5" /> : open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Expanded Detail Section */}
      {open && detail && (
        <div className="border-t border-gray-100 p-5 grid md:grid-cols-2 gap-6 bg-white/40">
          
          {/* Left Column: Information & Image */}
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Description</p>
              <p className="text-sm text-gray-700 bg-white p-4 rounded-xl border border-gray-200 leading-relaxed shadow-sm">
                {detail.description}
              </p>
            </div>

            {/* Render Image if Evidence Exists */}
            {detail.hasImage && detail.imageUrl && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Attached Evidence</p>
                <div className="border border-gray-200 rounded-xl overflow-hidden inline-block bg-white p-1 shadow-sm">
                  <img 
                    src={`http://localhost:5000${detail.imageUrl}`} 
                    alt="Complaint Evidence" 
                    className="max-w-full h-auto max-h-64 object-contain rounded-lg"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Action Panels */}
          <div className="space-y-6">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">
              {c.status === 'resolved' ? 'Resolution Details' : 'Actions'}
            </p>
            
            {c.status === 'resolved' ? (
              // RESOLVED STATE UI
              <div className="bg-white border border-green-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                 <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-green-800 flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-green-600" /> Official Resolution
                    </h4>
                    <button 
                      onClick={() => generatePDF(c)} 
                      disabled={downloading}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 font-semibold text-sm rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      {downloading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      {downloading ? 'Generating...' : 'Download PDF'}
                    </button>
                 </div>
                 <div className="mb-4">
                   <p className="text-xs font-bold text-gray-500 uppercase mb-1">Your Officer Note:</p>
                   <p className="text-sm text-gray-800 italic bg-green-50 p-3 rounded-lg border border-green-100">"{c.resolution}"</p>
                 </div>
              </div>
            ) : resolveMode ? (
              // RESOLVING STATE UI
              <div className="bg-green-50 p-5 rounded-xl border border-green-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                <textarea 
                  rows={4} 
                  placeholder="Describe the actions taken to resolve this issue..." 
                  value={resolutionNote} 
                  onChange={e => setResolutionNote(e.target.value)} 
                  className="w-full text-sm border border-green-300 rounded-lg p-3 mb-3 focus:ring-2 focus:ring-green-500 focus:outline-none resize-none" 
                />
                <div className="mb-3">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Upload Resolved Image
  </label>

  <input
    type="file"
    accept="image/*"
    onChange={(e) => setResolvedImage(e.target.files[0])}
    className="w-full border border-gray-300 rounded-lg p-2 bg-white"
  />

  {resolvedImage && (
    <p className="text-green-600 text-sm mt-1">
      ✓ {resolvedImage.name}
    </p>
  )}
</div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setResolveMode(false)} 
                    className="flex-1 bg-white border border-gray-300 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleResolve} 
                    disabled={resolving} 
                    className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {resolving ? <RefreshCw className="animate-spin w-4 h-4" /> : <Download className="w-4 h-4" />}
                    {resolving ? 'Generating Report...' : 'Confirm & Download'}
                  </button>
                </div>
              </div>
            ) : (
              // PENDING/ASSIGNED/IN_PROGRESS STATE UI
              <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 shadow-sm animate-in fade-in">
                <div className="flex flex-col sm:flex-row gap-3">
                  <select 
                    value={newStatus} 
                    onChange={e => setNewStatus(e.target.value)} 
                    className="flex-1 border border-blue-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                  </select>
                  <button 
                    onClick={handleUpdateStatus} 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
                  >
                    Update Status
                  </button>
                  <button 
                    onClick={() => setResolveMode(true)} 
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
                  >
                    Resolve Ticket
                  </button>
                </div>
              </div>
            )}
          </div>
          
        </div>
      )}
    </div>
  )
}

export default function AssignedComplaints({ officer, initialFilter = 'all', onRefreshBadges }) {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(initialFilter)

  useEffect(() => { 
    setFilter(initialFilter) 
  }, [initialFilter])

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get(`/complaints?officer_id=${officer.id}`)
      setComplaints(r.data.complaints)
      if (onRefreshBadges) onRefreshBadges() 
    } catch (error) { 
      toast.error('Load failed') 
    } finally { 
      setLoading(false) 
    }
  }

  useEffect(() => { 
    load() 
  }, [officer.id])

  const displayedComplaints = complaints.filter(c => {
    if (filter === 'all') return c.status !== 'resolved'; // All Active hides resolved
    return c.status === filter; // Explicitly matches the selected tab
  })

  return (
    <div className="w-full">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'pending', 'assigned', 'in_progress', 'resolved'].map(f => (
          <button 
            key={f} 
            onClick={() => setFilter(f)} 
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-colors ${
              filter === f 
                ? 'bg-green-600 text-white shadow-md' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? 'All Active' : f.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* Complaint List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw className="animate-spin text-green-600 w-8 h-8" />
        </div>
      ) : displayedComplaints.length === 0 ? (
        <div className="text-center py-16 bg-white/50 rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-500 font-medium">No complaints found for this filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedComplaints.map(c => (
            <ComplaintCard 
              key={c.ticketId} 
              c={c} 
              onUpdate={load} 
              officer={officer} 
            />
          ))}
        </div>
      )}
    </div>
  )
}