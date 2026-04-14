import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar, faCheck, faChevronDown, faCircleXmark, faDownload, faDroplet, faEnvelope, faEye, faFilePdf, faLocationDot, faPerson, faPhone, faPrint } from "@fortawesome/free-solid-svg-icons";
import { TbGridDots } from "react-icons/tb";
import { BsCapsule } from "react-icons/bs";
import { Link, NavLink, useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import api from "../../utils/axios";
import { toast } from "react-toastify";
import { calculateAge, formatDateTime } from "../../Services/globalFunction";
import { IMAGE_BASE_URL as base_url } from "../../utils/config";
import Barcode from "react-barcode";
import html2canvas from "html2canvas";
import html2pdf from "html2pdf.js";
import ReportDownload from "./ReportDownload";
import Loader from "../Common/Loader";

function PatientsPersonalInfo() {
  const navigate = useNavigate();
  const params = useParams();
  const [loading, setLoading]             = useState(false);
  const [appointmentData, setAppointmentData] = useState();
  const [doctorAddress, setDoctorAddress] = useState();
  const [pastPresData, setPastPresData]   = useState();
  const [pastAppointments, setPastAppointments] = useState([]);
  const [medicalHistory, setMedicalHisotry] = useState();
  const [prescription, setPrescription]   = useState([]);
  const [patientData, setPatientData]     = useState();
  const [demographic, setDemographic]     = useState();
  const [labOptions, setLabOptions]       = useState();
  const [testOptions, setTestOptions]     = useState([]);
  const [selectedLab, setSelectedLab]     = useState();
  const [labReports, setLabReports]       = useState([]);
  const [selectedTest, setSelectedTest]   = useState([]);
  const [showDownload, setShowDownload]   = useState(false);
  const [pdfLoading, setPdfLoading]       = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [customId, setCustomId]           = useState();
  const [labAppointments, setLabAppointments] = useState([]);
  const [doctorAppointments, setDoctorAppointments] = useState([]);
  const [allotments, setAllotments]     = useState([]);

  // ── Single admin API call — loads everything ──────────────────────────
  useEffect(() => {
    if (!params.id) return;
    loadPatientDetail();
  }, [params.id]);

  const loadPatientDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/patients/detail/${params.id}`);
      if (res.data.success) {
        setPatientData(res.data.user);
        setDemographic(res.data.demographic);
        setMedicalHisotry(res.data.medicalHistory);
        setCustomId(res.data.customId);
        if (res.data.prescription) {
          setPrescription(res.data.prescription.prescriptions || [res.data.prescription]);
        }
      }
    } catch (err) {
      toast.error("Failed to load patient details");
    } finally {
      setLoading(false);
    }
  };

  // Load doctor appointments for this patient
  useEffect(() => {
    if (!params.id) return;
    loadAppointments();
  }, [params.id]);

  const loadAppointments = async () => {
    try {
      const res = await api.get("/api/admin/doctor/all-appointments", {
        params: { limit: 100 }
      });
      if (res.data.success) {
        const mine = (res.data.data || []).filter(
          a => a.patientId?._id === params.id || String(a.patientId) === params.id
        );
        setPastAppointments(mine);
        setAppointmentData(mine[0]);
      }
    } catch {}
  };

  // Load lab appointments
  useEffect(() => {
    if (!params.id) return;
    loadLabAppointments();
  }, [params.id]);

  const loadLabAppointments = async () => {
    try {
      const res = await api.get("/api/admin/lab/all-appointments", {
        params: { limit: 100 }
      });
      if (res.data.success) {
        const mine = (res.data.data || []).filter(
          a => a.patientId?._id === params.id || String(a.patientId) === params.id
        );
        setLabAppointments(mine);
      }
    } catch {}
  };

  // Load allotments
  useEffect(() => {
    if (!params.id) return;
    (async () => {
      try {
        const res = await api.get(`/api/admin/patients/${params.id}/allotments`);
        if (res.data.success) setAllotments(res.data.data || []);
      } catch {}
    })();
  }, [params.id]);

  // Load lab reports
  useEffect(() => {
    if (!params.id) return;
    (async () => {
      try {
        const res = await api.get(`/api/admin/patients/${params.id}/lab-reports`);
        if (res.data.success) setLabReports(res.data.data || []);
      } catch {}
    })();
  }, [params.id]);

  // handleReportDownload
  const handleReportDownload = async (appointmentId, testId, reportId) => {
    try {
      setPdfLoading(reportId);
      const res = await api.get(`/api/admin/patients/${params.id}/lab-reports`);
      toast.success("Report data loaded. Use browser print for PDF.");
    } catch { toast.error("Download failed"); }
    finally { setPdfLoading(null); }
  };

  // Stub functions (called by JSX but not critical for display)
  async function fetchAppointmentData() { await loadPatientDetail(); }
  async function fetchLabs() {}
  async function fetchLabData() {}
  async function fetchPastAppointments() { await loadAppointments(); }
  async function fetchLabReports() {}

  const startChatWithUser = (user) => {
    sessionStorage.setItem("chatUser", JSON.stringify(user));
    navigate("/chat");
  };

  const appointmentAction = async (status) => {
    try {
      if (!appointmentData?._id) return;
      await api.patch(`/api/admin/doctor/${appointmentData._id}/approve-reject`, { status });
      toast.success(`Appointment ${status}`);
      loadAppointments();
    } catch { toast.error("Action failed"); }
  };

  const addLabTest = async () => {
    toast.info("Lab test feature requires doctor portal");
  };

  const deletePrescription = async (id) => {
    toast.info("Prescription management via Doctor portal");
  };

  const updateAppointment = async (data) => {
    toast.info("Update via Doctor portal");
  };

  const userId = null; // Not needed for admin view
  const pdfRef = useRef(null);
  const prescriptionRef = useRef(null);

  // Download prescription as PDF
  const handleDownload = async () => {
    try {
      if (!prescriptionRef.current) return;
      const element = prescriptionRef.current;
      const opt = {
        margin:       0.5,
        filename:     `prescription_${customId || "patient"}.pdf`,
        image:        { type: "jpeg", quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: "in", format: "a4", orientation: "portrait" }
      };
      if (window.html2pdf) {
        await window.html2pdf().set(opt).from(element).save();
      } else {
        // Fallback: print
        window.print();
      }
    } catch (err) {
      toast.error("Download failed");
    }
  };

  const downloadPdf = async (reportId) => {
    try {
      setPdfLoading(reportId);
      toast.info("Download initiated");
    } catch {} finally { setPdfLoading(null); }
  };

  return (
    <>
      {loading ? <Loader />
        : <div className="main-content flex-grow-1 p-3 overflow-auto">
          <div className="row mb-3">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h3 className="innr-title mb-2">View </h3>
                <div className="admin-breadcrumb">
                  <nav aria-label="breadcrumb">
                    <ol className="breadcrumb custom-breadcrumb">
                      <li className="breadcrumb-item">
                        <a href="#" className="breadcrumb-link">
                          Dashboard
                        </a>
                      </li>

                      <li className="breadcrumb-item">
                        <a href="#" className="breadcrumb-link">
                          Patients
                        </a>
                      </li>

                      <li
                        className="breadcrumb-item active"
                        aria-current="page"
                      >
                        View
                      </li>
                    </ol>
                  </nav>
                </div>
              </div>
            </div>
          </div>

          <div className="view-employee-bx patient-view-bx">
            <div className="row">
              <div className="col-lg-3 col-md-3 col-sm-12 mb-3">
                <div className="view-employee-bx patients-personal-info-card">
                  <div>
                    <div className="view-avatr-bio-bx text-center">
                      <img src={patientData?.profileImage ?
                        `${base_url}/${patientData?.profileImage}` : "/admin-tb-logo.png"} alt="" />
                      <h4>{patientData?.name}</h4>
                      <p><span className="vw-id">ID:</span> {customId}</p>
                      <h6 className="vw-activ">Active</h6>

                    </div>

                    <div>
                      <ul className="vw-info-list">
                        <li className="vw-info-item">
                          <span className="vw-info-icon"><FontAwesomeIcon icon={faPerson} /></span>
                          <div>
                            <p className="vw-info-title">Age</p>
                            <p className="vw-info-value">{calculateAge(demographic?.dob)} Year</p>
                          </div>
                        </li>

                        <li className="vw-info-item">
                          <span className="vw-info-icon"><FontAwesomeIcon icon={faCalendar} /></span>
                          <div>
                            <p className="vw-info-title">Gender </p>
                            <p className="vw-info-value">{patientData?.gender}</p>
                          </div>
                        </li>

                        <li className="vw-info-item">
                          <span className="vw-info-icon"><FontAwesomeIcon icon={faDroplet} /></span>
                          <div>
                            <p className="vw-info-title">Blood  Group </p>
                            <p className="vw-info-value">{demographic?.bloodGroup}</p>
                          </div>
                        </li>

                        <li className="vw-info-item">
                          <span className="vw-info-icon"><FontAwesomeIcon icon={faEnvelope} /></span>
                          <div>
                            <p className="vw-info-title">Email </p>
                            <p className="vw-info-value">{patientData?.email}</p>
                          </div>
                        </li>

                        <li className="vw-info-item">
                          <span className="vw-info-icon"><FontAwesomeIcon icon={faPhone} /></span>
                          <div>
                            <p className="vw-info-title">Phone </p>
                            <p className="vw-info-value">{patientData?.contactNumber}</p>
                          </div>
                        </li>

                        <li className="vw-info-item">
                          <span className="vw-info-icon"><FontAwesomeIcon icon={faPhone} /></span>
                          <div>
                            <p className="vw-info-title">Emergency Contact Name </p>
                            <p className="vw-info-value"><span className="fw-700">({demographic?.contact?.emergencyContactName}) </span> {demographic?.contact?.emergencyContactNumber}</p>
                          </div>
                        </li>

                        <li className="vw-info-item">
                          <span className="vw-info-icon"><FontAwesomeIcon icon={faLocationDot} /></span>
                          <div>
                            <p className="vw-info-title">Address</p>
                            <p className="vw-info-value">{demographic?.address}</p>
                          </div>
                        </li>

                      </ul>

                    </div>

                  </div>
                </div>
              </div>

              <div className="col-lg-9 col-md-9 col-sm-12">
                <div className="view-employee-bx">
                  <div className="employee-tabs">
                    <ul className="nav nav-tabs gap-3 ps-2" id="myTab" role="tablist">
                      <li className="nav-item" role="presentation">
                        <a
                          className="nav-link active"
                          id="appointment-tab"
                          data-bs-toggle="tab"
                          href="#appointment"
                          role="tab"
                        >
                          Doctor Appointments
                        </a>
                      </li>
                      <li className="nav-item" role="presentation">
                        <a
                          className="nav-link"
                          id="lab-appointment-tab"
                          data-bs-toggle="tab"
                          href="#lab-appointment"
                          role="tab"
                        >
                          Lab Appointments
                        </a>
                      </li>

                      <li className="nav-item" role="presentation">
                        <a
                          className="nav-link"
                          id="home-tab"
                          data-bs-toggle="tab"
                          href="#home"
                          role="tab"
                        >
                          Prescriptions
                        </a>
                      </li>

                      <li className="nav-item" role="presentation">
                        <a
                          className="nav-link"
                          id="lab-tab"
                          data-bs-toggle="tab"
                          href="#lab"
                          role="tab"
                        >
                          Lab Test
                        </a>
                      </li>


                      <li className="nav-item" role="presentation">
                        <a
                          className="nav-link"
                          id="contact-tab"
                          data-bs-toggle="tab"
                          href="#contact"
                          role="tab"
                        >
                          Allotment
                        </a>
                      </li>

                      <li className="nav-item" role="presentation">
                        <a
                          className="nav-link"
                          id="personal-tab"
                          data-bs-toggle="tab"
                          href="#personal"
                          role="tab"
                        >
                          Other Personal Details
                        </a>
                      </li>

                    </ul>
                  </div>
                  <div className="">
                    <div className="patient-bio-tab px-0">
                      <div className="tab-content" id="myTabContent">

                        <div className="tab-pane fade show active"
                          id="appointment"
                          role="tabpanel">
                          <div className="row">
                            <div className="col-lg-12 col-md-12 col-sm-12">
                              <div className="table-section">
                                <div className="table table-responsive mb-0">
                                  <table className="table mb-0">
                                    <thead>
                                      <tr>
                                        <th>#</th>
                                        <th>Appointment  Id</th>
                                        <th>Doctor</th>
                                        <th>Appointment  Date</th>

                                        <th>Status</th>
                                        <th>Action</th>
                                      </tr>
                                    </thead>
                                    <tbody>

                                      {pastAppointments?.length > 0 &&
                                        pastAppointments?.map((item, key) =>
                                          <tr key={key}>
                                            <td>{key + 1}.</td>
                                            <td> #{item?.customId}</td>
                                            <td>
                                              <div className="admin-table-bx">
                                                <div className="admin-table-sub-bx">
                                                  <img src={item?.doctorId?.doctorId?.profileImage ?
                                                    `${base_url}/${item?.doctorId?.doctorId?.profileImage}` : "/doctor-avatr.png"} alt="" />
                                                  <div className="admin-table-sub-details doctor-title">
                                                    <h6>{item?.doctorId?.name} </h6>
                                                    <p>{item?.doctorId?.unique_id}</p>
                                                  </div>
                                                </div>
                                              </div>
                                            </td>

                                            <td>
                                              {formatDateTime(item?.date)}
                                            </td>

                                            <td >{item?.status == 'completed' ? <span className="approved approved-active ">Completed </span>
                                              : <span className="approved approved-active leaved">{item?.status} </span>}</td>
                                            <td>
                                              <div class="dropdown">
                                                <a
                                                  href="javascript:void(0)"
                                                  class="grid-dots-btn"
                                                  id="acticonMenu1"
                                                  data-bs-toggle="dropdown"
                                                  aria-expanded="false"
                                                >
                                                  <TbGridDots />
                                                </a>
                                                <ul
                                                  class="dropdown-menu dropdown-menu-end  tble-action-menu admin-dropdown-card"
                                                  aria-labelledby="acticonMenu1"
                                                >
                                                  <li className="prescription-item">
                                                    <Link class="prescription-nav" to={`/doctor-appointment-details/${item?._id}`}>
                                                      View  Appointment
                                                    </Link>
                                                  </li>
                                                  {/* <li className="prescription-item">
                                                  <a class="prescription-nav" href="#" >
                                                    Edit
                                                  </a>
                                                </li>
                                                <li className="prescription-item">
                                                  <a class="prescription-nav" href="#" >
                                                    Delete
                                                  </a>
                                                </li> */}

                                                </ul>
                                              </div>

                                            </td>
                                          </tr>)}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="tab-pane fade"
                          id="lab-appointment"
                          role="tabpanel">
                          <div className="row">
                            <div className="col-lg-12 col-md-12 col-sm-12">
                              <div className="table-section">
                                <div className="table table-responsive mb-0">
                                  <table className="table mb-0">
                                    <thead>
                                      <tr>
                                        <th>#</th>
                                        <th>Appointment  Id</th>
                                        <th>Test</th>
                                        <th>Appointment  Date</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                      </tr>
                                    </thead>
                                    <tbody>

                                      {labAppointments?.length > 0 &&
                                        labAppointments?.map((item, key) =>
                                          <tr key={key}>
                                            <td>{key + 1}.</td>
                                            <td> #{item?.customId}</td>
                                            <td>
                                              <ul className="admin-test-list">
                                                {item?.testId?.map((test, key) =>
                                                  <li className="admin-test-item" key={key}>{test?.shortName}</li>)}
                                                {/* <li className="admin-test-item">Haemoglobin</li> */}
                                              </ul>
                                            </td>

                                            <td>
                                              {formatDateTime(item?.date)}
                                            </td>

                                            <td >{item?.status == 'completed' ? <span className="approved approved-active ">Completed </span>
                                              : <span className="approved approved-active leaved">{item?.status} </span>}</td>
                                            <td>
                                              <div class="dropdown">
                                                <a
                                                  href="javascript:void(0)"
                                                  class="grid-dots-btn"
                                                  id="acticonMenu1"
                                                  data-bs-toggle="dropdown"
                                                  aria-expanded="false"
                                                >
                                                  <TbGridDots />
                                                </a>
                                                <ul
                                                  class="dropdown-menu dropdown-menu-end  tble-action-menu admin-dropdown-card"
                                                  aria-labelledby="acticonMenu1"
                                                >
                                                  <li className="prescription-item">
                                                    <Link class="prescription-nav" to={`/lab-appointment-details/${item?._id}`}>
                                                      View  Appointment
                                                    </Link>
                                                  </li>
                                                  {/* <li className="prescription-item">
                                                  <a class="prescription-nav" href="#" >
                                                    Edit
                                                  </a>
                                                </li>
                                                <li className="prescription-item">
                                                  <a class="prescription-nav" href="#" >
                                                    Delete
                                                  </a>
                                                </li> */}

                                                </ul>
                                              </div>

                                            </td>
                                          </tr>)}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div
                          className="tab-pane fade"
                          id="home"
                          role="tabpanel"
                        >
                          <div className="row">
                            {/* <div className="text-end mb-3">
                              <NavLink to="/add-prescription" className="thm-btn rounded-3">Add Prescriptions</NavLink>
                            </div> */}



                            {pastAppointments?.filter(item => item.prescriptionId).length > 0 &&
                              pastAppointments?.filter(item => item.prescriptionId).map((item, key) =>
                                <div className="col-lg-12 mb-3" key={key}>
                                  <div className="new-pharmacy-detail-card">
                                    <div className="admin-table-bx d-flex align-items-center justify-content-between nw-pharmacy-details">
                                      <div className="">
                                        <div className="admin-table-sub-details d-flex align-items-center gap-2">
                                          <img src={item?.prescriptionId?.status == 'Inactive' ? "/in-active.png" :
                                            "/prescriptions.png"
                                          } alt="" />
                                          <div>
                                            <h6 className="fs-16 fw-600 text-black">Prescriptions</h6>
                                            <p className="fs-14 fw-500">{new Date(item?.prescriptionId?.createdAt)?.toLocaleDateString('en-GB')}</p>
                                          </div>
                                        </div>

                                      </div>

                                      <div className="admin-table-bx">
                                        <div className="">
                                          <div className="admin-table-sub-details d-flex align-items-center gap-2 doctor-title ">
                                            <img src={item?.doctorId?.doctorId?.profileImage ?
                                              `${base_url}/${item?.doctorId?.doctorId?.profileImage}` : "/doctor-avatr.png"} alt="" />
                                            <div>
                                              <h6>{item?.doctorId?.name} </h6>
                                              <p className="fs-14 fw-500">{item?.doctorId?.unique_id}</p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="d-flex align-items gap-2">
                                        <div>
                                          {item?.prescriptionId?.status === 'Inactive' ? <span className="approved rounded-5 in-active py-1">Inactive</span> :
                                            <span className="approved rounded-5 py-1">Active</span>}
                                        </div>

                                        <button type="button" className="card-sw-btn"><FontAwesomeIcon icon={faPrint} /></button>
                                        <button type="button" className="card-sw-btn" onClick={() => setPastPresData(item?.prescriptionId)} data-bs-toggle="modal" data-bs-target="#add-Prescription"><FontAwesomeIcon icon={faEye} /></button>
                                      </div>
                                    </div>
                                    <div className="mt-3">
                                      <div className="barcd-scannr barcde-scnnr-card ms-0">
                                        <div className="barcd-content">
                                          <h4>{item?.prescriptionId?.customId}</h4>
                                          {/* <img src="/barcode.png" alt="" /> */}
                                          <Barcode value={item?.prescriptionId?.customId} width={1.8} displayValue={false}
                                            height={60} />
                                        </div>

                                        <div className="barcode-id-details">
                                          <div>
                                            <h6>Patient Id </h6>
                                            <p>{customId}</p>
                                          </div>
                                          <div>
                                            <h6>Appointment ID </h6>
                                            <p>{item?.customId}</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>)}
                          </div>
                        </div>

                        <div className="tab-pane fade" id="lab" role="tabpanel">
                          <div className="row">

                            {labReports?.length > 0 &&
                              labReports?.map((item, key) =>
                                <div className="col-lg-6 col-md-6 col-sm-12 mb-3" key={key}>
                                  <div className="qrcode-prescriptions-bx">
                                    <div className="admin-table-bx d-flex align-items-center justify-content-between qr-cd-headr">
                                      <div className="admin-table-sub-details final-reprt d-flex align-items-center gap-2">
                                        <img src="/reprt-plus.png" alt="" className="rounded-0" />
                                        <div>
                                          <h6 className="fs-16 fw-600 text-black">Final Diagnostic Report</h6>
                                          <p className="fs-14 fw-500">{item?._id?.slice(-6)}</p>

                                        </div>
                                      </div>
                                    </div>
                                    <div className="barcode-active-bx">
                                      <div className="mb-2">
                                        <div className="admin-table-sub-details d-flex align-items-center justify-content-between doctor-title ">
                                          <div>
                                            <h6>{item?.labId?.name}</h6>
                                            <p className="fs-14 fw-500">{item?.labId?.unique_id}</p>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="barcd-scannr barcde-scnnr-card">
                                        <div className="barcd-content">
                                          <h4 className="mb-1">SP-{item?._id?.slice(-4)}</h4>

                                          <ul class="qrcode-list">
                                            <li class="qrcode-item">Test  <span class="qrcode-title">: {item?.testId?.shortName}</span></li>
                                            <li class="qrcode-item">Draw  <span class="qrcode-title"> : {new Date(item?.createdAt)?.toLocaleString('en-GB')}</span> </li>
                                          </ul>
                                          {/* <img src="/barcode.png" alt="" /> */}
                                          <Barcode value={item?._id} width={1} displayValue={false}
                                            height={60} />
                                        </div>

                                        <div className="barcode-id-details">
                                          <div>
                                            <h6>Patient Id </h6>
                                            <p>PS-{customId}</p>
                                          </div>
                                          <div>
                                            <h6>Appointment ID </h6>
                                            <p>{item?.appointmentId?.customId}</p>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="text-center mt-3">
                                        <button
                                          disabled={pdfLoading !== null}
                                          onClick={() =>
                                            handleReportDownload(item?.appointmentId?._id, item?.testId?._id, item?._id)
                                          }
                                          className="pdf-download-tbn py-2"><FontAwesomeIcon icon={faFilePdf} style={{ color: "#EF5350" }} />
                                          {pdfLoading == item?._id ? 'Downloading' : 'Download'}</button>

                                      </div>

                                    </div>

                                  </div>
                                </div>)}

                          </div>
                        </div>
                        <div className="tab-pane fade" id="contact" role="tabpanel">
                          <div className="row">
                            <div className="col-lg-12 col-md-12 col-sm-12">
                              <div className="table-section">
                                <div className="table table-responsive mb-0">
                                  <table className="table mb-0">
                                    <thead>
                                      <tr>
                                        <th>#</th>
                                        <th>Doctor</th>
                                        <th>Bed Information</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {allotments.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-3 text-muted">No bed allotments found</td></tr>
                                      ) : allotments.map((item, key) => (
                                        <tr key={key}>
                                          <td>{key + 1}.</td>
                                          <td>
                                            <div className="admin-table-bx">
                                              <div className="admin-table-sub-bx">
                                                <img src={item?.doctorId?.profileImage ? `${base_url}/uploads/doctor/${item.doctorId.profileImage}` : "/doctor-avatr.png"} alt="" />
                                                <div className="admin-table-sub-details doctor-title">
                                                  <h6>{item?.doctorId?.name || "—"}</h6>
                                                  <p>{item?.doctorId?.unique_id || "—"}</p>
                                                </div>
                                              </div>
                                            </div>
                                          </td>
                                          <td>
                                            <div className="admin-table-bx">
                                              <ul className="ad-info-list">
                                                <li className="ad-info-item">Room: <span className="add-info-title">{item?.roomId?.roomName || "—"}</span></li>
                                                <li className="ad-info-item"><b>Floor:</b> <span className="add-info-title">{item?.floorId?.floorName || "—"}</span></li>
                                                <li className="ad-info-item"><b>Bed:</b> <span className="add-info-title">{item?.bedId?.bedName || "—"}</span></li>
                                                <li className="ad-info-item">Daily Rate: <span className="add-info-title">₹{item?.bedId?.pricePerDay || 0}</span></li>
                                                <li className="ad-info-item">Dept: <span className="add-info-title">{item?.departmentId?.departmentName || "—"}</span></li>
                                              </ul>
                                            </div>
                                          </td>
                                          <td>
                                            <ul className="ad-info-list">
                                              <li className="ad-info-item"><b>Allotted:</b> {item?.allotmentDate ? new Date(item.allotmentDate).toLocaleDateString("en-IN") : "—"}</li>
                                              <li className="ad-info-item"><b>Expected:</b> {item?.expectedDischargeDate ? new Date(item.expectedDischargeDate).toLocaleDateString("en-IN") : "—"}</li>
                                              <li className="ad-info-item"><b>Discharged:</b> <span className={item?.dischargeDate ? "" : "not-discharge"}>{item?.dischargeDate ? new Date(item.dischargeDate).toLocaleDateString("en-IN") : "Not yet"}</span></li>
                                            </ul>
                                          </td>
                                          <td><span className={`approved ${item?.status === "Booked" ? "approved-active" : "approved-pending"}`}>{item?.status || "—"}</span></td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="tab-pane fade" id="personal" role="tabpanel">
                          <div className="row">
                            <div className="col-lg-12">
                              <div className="">
                                <div className="ovrview-bx mb-3">
                                  <h4 className="new_title">Medical History</h4>
                                  {/* <p className="">Robert Davis is a board-certified cardiologist with over 8 years of experience in diagnosing and treating heart conditions. She specializes in preventive cardiology and heart failure management.</p> */}
                                </div>

                                <div className="medical-history-content">
                                  <div>
                                    <h4 className="fz-16 fw-700">Do you have any chronic conditions?</h4>
                                    <h5 className="hearth-disese">{medicalHistory?.chronicCondition}</h5>
                                  </div>

                                  <div className="mt-3">
                                    <h4 className="fz-16 fw-700">Are you currently on any medications?</h4>
                                    <h5 className="hearth-disese">{medicalHistory?.onMedication ? 'Yes' : 'No'}</h5>
                                  </div>

                                </div>

                                <div className="medical-history-content my-3">
                                  <div>
                                    <h4 className="fz-16 fw-700">Medication Details</h4>
                                    <p>{medicalHistory?.medicationDetail}</p>
                                  </div>

                                  <div className="mt-3">
                                    <h4 className="fz-16 fw-700">Allergies</h4>
                                    <p>{medicalHistory?.allergies}</p>
                                  </div>

                                </div>

                                <div className="ovrview-bx mb-3">
                                  <h4 className="new_title">Family Medical History</h4>
                                </div>
                                <div className="medical-history-content my-3">
                                  <div>
                                    <h4 className="fz-16 fw-700">Any family history of chronic disease?</h4>
                                    <h5 className="hearth-disese">{medicalHistory?.familyHistory?.chronicHistory}</h5>

                                  </div>

                                  <div className="mt-3">
                                    <h4 className="fz-16 fw-700">Chronic Diseases in Family</h4>
                                    <p> {medicalHistory?.familyHistory?.diseasesInFamily}</p>
                                  </div>

                                </div>

                                <div className="ovrview-bx mb-3">
                                  <h4 className="new_title">Prescriptions and Reports</h4>
                                </div>

                                <div className="row">
                                  {prescription?.length > 0 &&
                                    prescription?.map((item, key) =>
                                      <div className="col-lg-6 mb-3" key={key}>
                                        <div className="prescription-patients-card">
                                          <div className="prescription-patients-picture">
                                            <img src={item?.fileUrl ?
                                              `${base_url}/${item?.fileUrl}` : "/patient-card-one.png"} alt="" />
                                          </div>
                                          <div className="card-details-bx">
                                            <div className="card-info-title">
                                              <h3>{item?.name}</h3>
                                              {/* <p>8/21/2025</p> */}
                                            </div>

                                            <div className="">
                                              <button type="button" className="card-sw-btn"><FontAwesomeIcon icon={faEye} /></button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>}

      {/* <!-- add-Department Alert Popup Start --> */}
      {/* <!--  data-bs-toggle="modal" data-bs-target="#add-Prescription" --> */}
      <div className="modal step-modal" id="add-Prescription" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1"
        aria-labelledby="staticBackdropLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content rounded-5 p-4">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h6 className="lg_title mb-0"> Prescription</h6>
              </div>
              <div>
                <button type="button" className="" data-bs-dismiss="modal" aria-label="Close" style={{ color: "#00000040" }}>
                  <FontAwesomeIcon icon={faCircleXmark} />
                </button>
              </div>
            </div>
            <div className="modal-body" ref={prescriptionRef}>
              <div className="row ">
                <div className="col-lg-12">
                  <div className="view-report-card bg-transparent">
                    <div className="view-report-header">
                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          <span className="active-status">{pastPresData?.status}</span>
                          <h5>{pastPresData?.customId}</h5>
                          <h6>Date: {new Date(pastPresData?.createdAt)?.toLocaleDateString('en-GB')}</h6>
                        </div>

                        <div>
                          <button className="no-print" onClick={handleDownload}><FontAwesomeIcon icon={faDownload} /></button>
                          <button className="no-print"><FontAwesomeIcon icon={faPrint} /></button>
                        </div>
                      </div>

                    </div>

                    <div className="view-report-content">
                      <div className="sub-content-title">
                        <h4>RX.</h4>
                        <h3><BsCapsule style={{ color: "#00B4B5" }} /> Medications</h3>
                      </div>

                      {pastPresData?.medications?.map((item, key) =>
                        <div className="view-medications-bx mb-3" key={key}>
                          <h5>{key + 1}. {item?.name}</h5>
                          <ul className="viwe-medication-list">
                            <li className="viwe-medication-item">Refills: {item?.refills} </li>
                            <li className="viwe-medication-item">Frequency: {item?.frequency} </li>
                            <li className="viwe-medication-item">Duration: {item?.duration}</li>
                            <li className="viwe-medication-item">Instructions: {item?.instructions}</li>

                          </ul>
                        </div>)}



                      <div className="diagnosis-bx mb-3">
                        <h5>Diagnosis</h5>
                        <p>{pastPresData?.diagnosis}</p>
                      </div>

                      <div className="diagnosis-bx mb-3">
                        <h5>Notes</h5>
                        <p>{pastPresData?.notes}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {(showDownload && selectedReport) && <div className="d-none">
        <ReportDownload
          appointmentId={selectedReport?.appointmentId}
          currentTest={selectedReport?.testId}
          endLoading={() => setPdfLoading(null)}
          pdfLoading={pdfLoading}
        />
      </div>}
      {/* <!-- add-Department Popup End --> */}

    </>
  )
}

export default PatientsPersonalInfo