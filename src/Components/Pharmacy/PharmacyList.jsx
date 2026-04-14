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
import { IMAGE_BASE_URL } from "../../utils/config";

function PharmacyList() {
  const [loading, setLoading] = useState(false);
  const [pharmacies, setPharmacies] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  /* ================= LOAD ================= */
  const loadPharmacies = async () => {
  try {
    setLoading(true);
    const res = await api.get("/api/admin/pharmacy", {
      params: { search, page }
    });
    setPharmacies(res.data.data);
    setTotalPages(res.data.totalPages);
  } catch {
    toast.error("Failed to load pharmacies");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadPharmacies();
  }, [page]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      loadPharmacies();
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  /* ================= STATUS ================= */
  const toggleStatus = async (id) => {
    try {
      await api.patch(`/api/admin/pharmacy/${id}/status`);
      toast.success("Status updated");
      loadPharmacies();
    } catch {
      toast.error("Status update failed");
    }
  };

  /* ================= DELETE ================= */
  const deletePharmacy = async (id) => {
    const ok = await Swal.fire({
      title: "Delete pharmacy?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete"
    });

    if (!ok.isConfirmed) return;

    try {
      await api.delete(`/api/admin/pharmacy/${id}`);
      toast.success("Pharmacy deleted");
      loadPharmacies();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <>
      <div className="main-content flex-grow-1 p-3 overflow-auto">
        <h3 className="innr-title mb-3 gradient-text">Pharmacy List</h3>

        {/* SEARCH */}
        <div className="d-flex justify-content-between mb-3">
          <div className="custom-frm-bx mb-0">
            <input
              className="form-control admin-table-search-frm"
              placeholder="Search"
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
            <Link to={'/add-pharmacy'} className="thm-btn">Add Pharmacy</Link>
          </div>
        </div>

        {/* TABLE */}
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Pharmacy</th>
                <th>Contact Person</th>
                <th>Address</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    <span className="spinner-border text-primary" role="status"></span>
                  </td>
                </tr>
              )}

              {!loading && pharmacies.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center">
                    No pharmacies found
                  </td>
                </tr>
              )}

              {!loading &&
                pharmacies.map((p, i) => (
                  <tr key={p._id}>
                    <td>{(page - 1) * limit + i + 1}.</td>

                    <td>
                      <ul className="ad-info-list">
                        <li className="ad-info-item">{p.name}</li>
                        <li className="ad-info-item">
                          <span className="ad-info-title">Mobile :</span> {p.contactNumber}
                        </li>
                        <li className="ad-info-item">
                          <span className="ad-info-title">Email :</span> {p.email}
                        </li>
                        {p?.userId?.nh12 && <li className="ad-info-item">
                          <span className="ad-info-title">Id :</span> {p?.userId?.nh12}
                        </li>}
                      </ul>
                    </td>

                    <td>
                      <div className="admin-table-bx">
                        <div className="admin-table-sub-details d-flex align-items-center gap-2">
                          <img src={IMAGE_BASE_URL+p.logo || "/doctor-avatr.png"} alt="" />
                          <h6>{p.name}</h6>
                        </div>
                        <ul className="ad-info-list">
                          <li>📞 {p.contactNumber}</li>
                          <li>✉️ {p.email}</li>
                        </ul>
                      </div>
                    </td>

                    <td>{p.address || "-"}</td>

                    <td>
                      <span
                        className={`approved ${
                          p.status === "verify"
                            ? "approved-active"
                            : "approved-reject"
                        }`}
                        style={{ cursor: "pointer" }}
                        onClick={() => toggleStatus(p._id)}
                      >
                        {p.status}
                      </span>
                    </td>

                    <td>
                      <div className="dropdown">
                        <a className="grid-dots-btn" data-bs-toggle="dropdown">
                          <TbGridDots />
                        </a>
                        <ul className="dropdown-menu dropdown-menu-end admin-dropdown-card">
                          <li className="prescription-item">
                            <NavLink
                              to={`/pharmacy-info-details/${p.userId}`}
                              className="prescription-nav"
                            >
                              View Details
                            </NavLink>
                          </li>
                          <li className="prescription-item">
                            <a
                              className="prescription-nav"
                              onClick={() => toggleStatus(p._id)}
                            >
                              Toggle Status
                            </a>
                          </li>
                          <li className="prescription-item">
                            <a
                              className="prescription-nav text-danger"
                              onClick={() => deletePharmacy(p._id)}
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

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </>
  );
}

export default PharmacyList;
