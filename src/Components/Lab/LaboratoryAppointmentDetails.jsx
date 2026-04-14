import { useEffect, useState, useRef } from "react"
import { useParams, Link } from "react-router-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faFileExport, faPrint } from "@fortawesome/free-solid-svg-icons"
import api from "../../utils/axios"
import Loader from "../Common/Loader"
import html2pdf from "html2pdf.js"
import { IMAGE_BASE_URL } from "../../utils/config"

function LaboratoryAppointmentDetails() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const printRef = useRef()

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/api/admin/lab/appointment/${id}`)
        if (res.data.success) setData(res.data.data)
      } catch {} finally { setLoading(false) }
    })()
  }, [id])

  const handleExport = () => html2pdf().from(printRef.current).set({ filename: `lab-appt-${id}.pdf` }).save()

  if (loading) return <Loader />
  if (!data) return <div className="main-content p-3"><p className="text-muted">Appointment not found.</p></div>

  const lab = data.labId
  const patient = data.patientId
  const statusColors = { visited: "#00B4B5", pending: "#FEB052", cancelled: "#FF4560", due: "#7C3AED" }

  return (
    <div className="main-content flex-grow-1 p-3 overflow-auto">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h3 className="innr-title mb-1 gradient-text">Lab Appointment Details</h3>
          <nav><ol className="breadcrumb custom-breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/dashboard">Dashboard</Link></li>
            <li className="breadcrumb-item"><Link to="/lab-appointment">Lab Appointments</Link></li>
            <li className="breadcrumb-item active">Details</li>
          </ol></nav>
        </div>
        <div className="d-flex gap-2">
          <button className="nw-exprt-btn" onClick={() => window.print()}><FontAwesomeIcon icon={faPrint} /> Print</button>
          <button className="nw-exprt-btn" onClick={handleExport}><FontAwesomeIcon icon={faFileExport} /> Export</button>
        </div>
      </div>

      <div ref={printRef}>
        <div className="mb-3 p-3" style={{ borderRadius: 12, background: (statusColors[data.status] || "#888") + "15", border: `1px solid ${statusColors[data.status] || "#888"}30` }}>
          <span className="fw-semibold" style={{ color: statusColors[data.status] || "#888", textTransform: "capitalize" }}>Status: {data.status}</span>
        </div>

        <div className="row g-3">
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm p-3" style={{ borderRadius: 12 }}>
              <h6 className="fw-semibold mb-3">Laboratory</h6>
              <p className="fw-semibold mb-0">{lab?.name || "—"}</p>
              <p className="text-muted mb-0" style={{ fontSize: 13 }}>{lab?.email}</p>
              <p className="text-muted mb-0" style={{ fontSize: 12 }}>{lab?.contactNumber}</p>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm p-3" style={{ borderRadius: 12 }}>
              <h6 className="fw-semibold mb-3">Patient</h6>
              <p className="fw-semibold mb-0">{patient?.name || "—"}</p>
              <p className="text-muted mb-0" style={{ fontSize: 13 }}>{patient?.contactNumber}</p>
              <p className="text-muted mb-0" style={{ fontSize: 12 }}>{patient?.email}</p>
            </div>
          </div>
          <div className="col-12">
            <div className="card border-0 shadow-sm p-3" style={{ borderRadius: 12 }}>
              <h6 className="fw-semibold mb-3">Appointment Info</h6>
              <div className="row">
                {[["Date", data.appointmentDate?.slice(0,10)], ["Time", data.appointmentTime], ["Test", data.testId?.name || data.testName], ["Amount", data.amount ? `₹${data.amount}` : "—"], ["Booked On", data.createdAt?.slice(0,10)]].map(([l,v]) => (
                  <div className="col-md-4 mb-3" key={l}>
                    <p className="text-muted mb-1" style={{ fontSize: 12 }}>{l}</p>
                    <p className="fw-semibold mb-0">{v || "—"}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {data.reportId && (
            <div className="col-12">
              <div className="card border-0 shadow-sm p-3" style={{ borderRadius: 12 }}>
                <h6 className="fw-semibold mb-3">Lab Report</h6>
                <p className="text-success">✓ Report uploaded by lab</p>
                <Link to={`/lab-report-view/${data.reportId}`} className="btn btn-sm btn-outline-primary">View Report</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LaboratoryAppointmentDetails
