import { useState, useEffect } from 'react'
import { Search, RefreshCw, ChevronDown, ChevronUp, FileCheck, Download } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { StatusBadge } from '../common/Badges'
import toast from 'react-hot-toast'

// Helper function to fetch the image and convert it so jsPDF can embed it
const fetchImageAsBase64 = async (url) => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
};

export default function MyComplaints({ user, initialFilter = 'all' }) {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  const [filter, setFilter] = useState(initialFilter)
  const [expandedId, setExpandedId] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null) 

  useEffect(() => { 
    setFilter(initialFilter) 
  }, [initialFilter])

  const loadComplaints = async () => {
    if (!user?.id) return; 
    
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:5000/api/complaints?citizen_id=${user.id}`)
      const data = await response.json()

      if (response.ok && data.success) {
        setComplaints(Array.isArray(data.complaints) ? data.complaints : [])
      } else {
        toast.error(data.error || 'Failed to load your complaints')
      }
    } catch (err) {
      console.error("Fetch Error:", err)
      toast.error('Network error. Is the Flask server running?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadComplaints() }, [user?.id])

  const downloadPDF = async (c) => {
    setDownloadingId(c.ticketId);

    try {
        const doc = new jsPDF();
        
        // --- HEADER ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(37, 99, 235);
        doc.text("OFFICIAL GRIEVANCE RESOLUTION REPORT", 105, 20, { align: "center" });
        doc.setDrawColor(200, 200, 200);
        doc.line(15, 25, 195, 25);

        // --- CITIZEN & COMPLAINT METADATA ---
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        
        doc.setFont("helvetica", "bold"); doc.text("Ticket ID:", 15, 35);
        doc.setFont("helvetica", "normal"); doc.text(c.ticketId || "N/A", 45, 35);

        doc.setFont("helvetica", "bold"); doc.text("Citizen Name:", 15, 45);
        doc.setFont("helvetica", "normal"); doc.text(c.citizenName || "Not Provided", 45, 45);

        doc.setFont("helvetica", "bold"); doc.text("Category:", 110, 35);
        doc.setFont("helvetica", "normal"); doc.text(c.categoryLabel || c.category || "N/A", 135, 35);

        doc.setFont("helvetica", "bold"); doc.text("Date Filed:", 110, 45);
        doc.setFont("helvetica", "normal"); doc.text(c.createdAt ? new Date(c.createdAt).toLocaleDateString() : new Date().toLocaleDateString(), 135, 45);
        
        doc.line(15, 52, 195, 52);

        // --- DESCRIPTION ---
        doc.setFont("helvetica", "bold"); doc.text("Original Complaint:", 15, 62);
        doc.setFont("helvetica", "normal");
        const descLines = doc.splitTextToSize(c.description || "N/A", 180);
        doc.text(15, 70, descLines);
        
        let yPos = 70 + (descLines.length * 5) + 5;

        // --- RESOLUTION DETAILS ---
        doc.setDrawColor(37, 99, 235);
        doc.line(15, yPos, 195, yPos);
        yPos += 10;

        doc.setFont("helvetica", "bold"); doc.text("Resolved By (Officer):", 15, yPos);
        doc.setFont("helvetica", "normal"); doc.text(c.assignedOfficer || "N/A", 65, yPos);
        yPos += 10;

        doc.setFont("helvetica", "bold"); doc.text("Official Resolution:", 15, yPos);
        doc.setFont("helvetica", "normal");
        const resLines = doc.splitTextToSize(c.resolution || "N/A", 180);
        doc.text(15, yPos + 7, resLines);
        
        yPos += 7 + (resLines.length * 5) + 10;

        // --- IMAGE ---
        if (c.hasImage && c.imageUrl) {
            if (yPos > 200) { doc.addPage(); yPos = 20; }
            doc.setFont("helvetica", "bold"); doc.text("Attached Photographic Evidence:", 15, yPos);
            try {
                const imgBase64 = await fetchImageAsBase64(`http://localhost:5000${c.imageUrl}`);
                doc.addImage(imgBase64, 'JPEG', 15, yPos + 5, 120, 90, undefined, 'FAST');
            } catch (err) {
                console.error("Could not fetch image for PDF", err);
            }
        }
        // OFFICER RESOLUTION IMAGE
if (c.resolvedImageUrl) {

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
                `http://localhost:5000${c.resolvedImageUrl}`
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
            "Could not fetch resolved image",
            err
        )
    }
}

        doc.save(`${c.ticketId}_Resolution_Report.pdf`);
        toast.success("PDF Downloaded Successfully!");
    } catch (error) {
        toast.error("Failed to generate PDF");
        console.error(error);
    } finally {
        setDownloadingId(null);
    }
  }

  const filtered = complaints.filter(c => {
    const mFilter = filter === 'all' ? true : c.status === filter
    const mSearch = c.ticketId.toLowerCase().includes(search.toLowerCase()) || 
                    c.title.toLowerCase().includes(search.toLowerCase())
    return mFilter && mSearch
  })

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h2 className="text-2xl font-extrabold text-gray-900">My Complaints</h2>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:flex-none">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full" 
            />
          </div>
          <button onClick={loadComplaints} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:text-blue-600 transition-colors shadow-sm">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'pending', 'assigned', 'in_progress', 'resolved'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${
              filter === f ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}>
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-blue-600 w-8 h-8" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white/50 rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-gray-500 font-medium">No complaints found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(c => (
            <div key={c.ticketId} className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden transition-all hover:shadow-md">
              <div className="p-5 cursor-pointer flex justify-between items-center hover:bg-gray-50" onClick={() => setExpandedId(expandedId === c.ticketId ? null : c.ticketId)}>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100">{c.ticketId}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">{c.title}</h3>
                </div>
                <div className="text-gray-400">
                  {expandedId === c.ticketId ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                </div>
              </div>

              {expandedId === c.ticketId && (
                <div className="p-5 border-t border-gray-100 bg-gray-50/50">
                   <div className="grid md:grid-cols-2 gap-6">
                      
                      {/* Left Side: Details & Image preview */}
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</p>
                          <p className="text-sm text-gray-700 bg-white p-4 border border-gray-200 rounded-xl leading-relaxed shadow-sm">{c.description}</p>
                        </div>
                        
                        {c.hasImage && c.imageUrl && (
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Your Uploaded Evidence</p>
                            <div className="border border-gray-200 rounded-xl overflow-hidden inline-block bg-white p-1 shadow-sm">
                              <img 
                                src={`http://localhost:5000${c.imageUrl}`} 
                                alt="Complaint Evidence" 
                                className="max-w-full h-auto max-h-48 object-contain rounded-lg"
                                onError={(e) => { e.target.style.display = 'none' }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Side: Resolution Report */}
                      <div className="space-y-4">
                        {c.status === 'resolved' ? (
                          <div className="bg-white border border-green-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                             
                             <div className="flex justify-between items-center mb-4">
                                <h4 className="text-sm font-bold text-green-800 flex items-center gap-2">
                                  <FileCheck className="w-5 h-5 text-green-600" /> 
                                  Official Resolution
                                </h4>
                                <button 
                                  onClick={() => downloadPDF(c)} 
                                  disabled={downloadingId === c.ticketId}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 font-semibold text-sm rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                  {downloadingId === c.ticketId ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                  {downloadingId === c.ticketId ? 'Generating...' : 'Download PDF'}
                                </button>
                             </div>

                             <div className="mb-4">
                               <p className="text-xs font-bold text-gray-500 uppercase mb-1">Officer Note:</p>
                               <p className="text-sm text-gray-800 italic bg-green-50 p-3 rounded-lg border border-green-100">"{c.resolution}"</p>
                             </div>

                             <div>
                               <p className="text-xs font-bold text-gray-500 uppercase mb-1">AI Summary Report:</p>
                               <div className="text-[11px] font-mono text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200 max-h-40 overflow-y-auto">
                                 {c.aiReport || 'Grievance resolved successfully.'}
                               </div>
                             </div>
                          </div>
                        ) : (
                          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm h-full flex flex-col justify-center items-center text-center">
                            <RefreshCw className="w-8 h-8 text-gray-300 mb-3" />
                            <p className="text-sm font-medium text-gray-500">This complaint is currently being processed.</p>
                            <p className="text-xs text-gray-400 mt-1">The final report will appear here once resolved.</p>
                          </div>
                        )}
                      </div>

                   </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}