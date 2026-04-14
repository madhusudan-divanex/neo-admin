import { useEffect, useState } from "react";
import { TbGridDots } from "react-icons/tb";
import {
  HiChevronDoubleLeft,
  HiChevronDoubleRight,
  HiChevronLeft,
  HiChevronRight
} from "react-icons/hi";
import Pagination from "../Common/Pagination";
import { faFilter, faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, NavLink } from "react-router-dom";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import api from "../../utils/axios";
import { formatDate } from "../../utils/date";
import base_url from "../../Services/baseUrl";


function DoctorsList() {
  const [loading, setLoading] = useState(false);


  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  /* ================= FETCH DOCTORS ================= */
  const loadDoctors = async () => {
    try {
      setLoading(true);

      const res = await api.get("/api/admin/doctor", {
        params: { search, page }
      });

      setDoctors(res.data.data);
      // console.log("Doctor",res.data.data)
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, [page]);

  /* 🔍 Search debounce */
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      loadDoctors();
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  /* ================= TOGGLE STATUS ================= */
  const toggleStatus = async (doctorId) => {
    try {
      setLoading(true);
      await api.patch(`/api/admin/doctor/${doctorId}/status`);
      toast.success("Status updated");
      loadDoctors();
    } catch {
      toast.error("Failed to update status");
      setLoading(false);
    }
  };


  /* ================= DELETE ================= */
  const deleteDoctor = async (id) => {
    const ok = await Swal.fire({
      title: "Delete doctor?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete"
    });

    if (!ok.isConfirmed) return;

    try {
      setLoading(true);
      await api.delete(`/api/admin/doctor/${id}`);
      toast.success("Doctor deleted");
      loadDoctors();
    } catch {
      toast.error("Delete failed");
      setLoading(false);
    }
  };


  return (
    <>
      <div className="main-content flex-grow-1 p-3 overflow-auto">

        {/* ================= HEADER ================= */}
        <div className="row mb-3">
          <h3 className="innr-title mb-2 gradient-text">Doctors list</h3>
        </div>

        <div className="new-mega-card">

          {/* ================= SEARCH ================= */}
          <div className="d-flex justify-content-between mb-3">
            <div className="custom-frm-bx mb-0">
              <input
                className="form-control admin-table-search-frm"
                placeholder="Search doctor"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="adm-search-bx">
                <button className="tp-search-btn">
                  <FontAwesomeIcon icon={faSearch} />
                </button>
              </div>
            </div>
            <div>
              <Link to={'/add-doctor'} className="thm-btn">Add Doctor</Link>
            </div>
          </div>

          {/* ================= TABLE ================= */}
          {loading && (
            <div className="text-center my-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

          {!loading && (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>DOB</th>
                    {/* <th>Specialty</th>
                  <th>Hospital</th> */}
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {doctors.length === 0 && (
                    <tr>
                      <td colSpan="9" className="text-center">No doctors found</td>
                    </tr>
                  )}

                  {doctors.map((d, i) => (
                    <tr key={d._id}>
                      <td>{(page - 1) * limit + i + 1}.</td>

                      <td>
                        <img
                          src={d?.profileImage ? `${base_url}/${d?.profileImage}` : "/doctor-avatr.png"}
                          width="40"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/doctor-avatr.png";
                          }}
                          alt=""
                        />
                      </td>

                      <td><ul className="ad-info-list">
                        <li> {d.name || "-"}</li>
                        <li> {d?.user?.nh12}</li>
                      </ul></td>

                      <td>
                        <ul className="ad-info-list">
                          <li> {d.contactNumber || "-"}</li>
                          <li> {d.email}</li>
                        </ul>
                      </td>

                      <td>{formatDate(d.dob)}</td>
                      {/* <td>{d.specialty || "-"}</td>
                    <td>{d.hospitalName || "-"}</td> */}

                      {/* ===== STATUS TOGGLE ===== */}
                      <td>
                        <span
                          className={`approved ${d.status === "approved"
                            ? "approved-active"
                            : "approved-reject"
                            }`}
                          style={{ cursor: "pointer" }}
                          onClick={() => toggleStatus(d._id)}
                        >
                          {d.status === "approved" ? "Approved" : "Pending"}
                        </span>
                      </td>


                      {/* ===== ACTION ===== */}
                      <td>
                        <div className="dropdown">
                          <a
                            href="javascript:void(0)"
                            className="grid-dots-btn"
                            data-bs-toggle="dropdown"
                          >
                            <TbGridDots />
                          </a>

                          <ul className="dropdown-menu dropdown-menu-end">
                            <li>
                              <NavLink
                                to={`/doctor-info-details/${d?.user?._id}`}
                                className="dropdown-item"
                              >
                                View Details
                              </NavLink>
                            </li>

                            {/* <li>
                            <a
                              className="dropdown-item"
                              onClick={() => toggleStatus(d._id)}
                            >
                              {d.isActive ? "Inactive" : "Active"}
                            </a>
                          </li> */}

                            <li>
                              <a
                                className="dropdown-item text-danger"
                                onClick={() => deleteDoctor(d._id)}
                              >
                                Delete
                              </a>
                            </li>
                          </ul>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    </>
  );
}

export default DoctorsList;
