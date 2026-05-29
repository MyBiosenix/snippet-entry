import React, { useCallback, useEffect, useState } from "react";
import "../Styles/mucomp.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getPackagePageLimit } from "../../utils/packageRules";
import { API_BASE } from "../../utils/api";
import PaginationControls from "../../components/PaginationControls";
import { unwrapPaginatedResponse, useDebouncedValue } from "../../utils/pagination";

/* ─── helpers ─────────────────────────────────────────────────── */

const dropItemStyle = {
  padding: "8px 12px",
  fontSize: "12px",
  color: "#334155",
  borderRadius: "7px",
  cursor: "pointer",
  borderBottom: "1px solid #f1f5f9",
  transition: "background .12s",
};

/** Two-letter initials from a full name */
function getInitials(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Pick an avatar colour class based on first char of name */
const AVATAR_CLASSES = ["av-green", "av-purple", "av-amber", "av-red", "av-teal", ""];
function avatarClass(name = "") {
  const idx = (name.charCodeAt(0) || 0) % AVATAR_CLASSES.length;
  return AVATAR_CLASSES[idx];
}

/* ─── component ───────────────────────────────────────────────── */

function MuComp() {
  const navigate = useNavigate();

  const [users, setUsers]                     = useState([]);
  const [searchTerm, setSearchTerm]           = useState("");
  const [currentPage, setCurrentPage]         = useState(1);
  const [sortField, setSortField]             = useState("date");
  const [sortOrder, setSortOrder]             = useState("desc");
  const [openActionDropdown, setOpenActionDropdown] = useState(null);
  const [pagination, setPagination]           = useState(null);
  const [loading, setLoading]                 = useState(false);
  const [activeFilter, setActiveFilter]       = useState("all"); // "all" | "active" | "inactive"
  const [stats, setStats]                     = useState(null);  // optional stats endpoint

  const debouncedSearch = useDebouncedValue(searchTerm);

  const admin = JSON.parse(localStorage.getItem("admin") || "{}");
  const role  = admin?.role;

  /* close dropdown on outside click */
  useEffect(() => {
    const close = () => setOpenActionDropdown(null);
    if (openActionDropdown) document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [openActionDropdown]);

  /* ── fetch ── */
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page:      currentPage,
        limit:     10,
        search:    debouncedSearch,
        sortBy:    sortField,
        sortOrder,
      };
      if (activeFilter !== "all") params.isActive = activeFilter === "active";

      const res = await axios.get(`${API_BASE}/auth/all-users`, { params });
      const { data, pagination: nextPagination } = unwrapPaginatedResponse(res.data);
      setUsers(data);
      setPagination(nextPagination);

      /* optional: derive stats from the response if your API returns them */
      if (res.data?.stats) setStats(res.data.stats);
    } catch (err) {
      alert(err.response?.data?.message || "Error fetching users");
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, sortField, sortOrder, activeFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  /* ── helpers ── */
  const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const getWorkTags = (user) => {
    const tags = [];
    tags.push(user.isComplete === false
      ? { label: "Incomplete", tone: "danger" }
      : { label: "Complete",   tone: "success" });
    if (user.softwareUsed) tags.push({ label: "Software Used",   tone: "accent"  });
    if (user.notInSequence) tags.push({ label: "Not In Sequence", tone: "warning" });
    return tags;
  };

  const progressPercent = (user) => {
    const done  = user.completedPages ?? user.currentIndex ?? 0;
    const total = getPackagePageLimit(user.packages) || 1;
    return Math.min(100, Math.round((done / total) * 100));
  };

  /* ── optimistic state patch ── */
  const patchUserInState = (id, patch) =>
    setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, ...patch } : u)));

  /* ── action handlers ── */
  const handleActivate   = async (id) => { try { await axios.put(`${API_BASE}/auth/${id}/activate`);   patchUserInState(id, { isActive: true  }); } catch (e) { alert(e.response?.data?.message || e.message); } };
  const handleDeactivate = async (id) => { try { await axios.put(`${API_BASE}/auth/${id}/deactivate`); patchUserInState(id, { isActive: false }); } catch (e) { alert(e.response?.data?.message || e.message); } };

  const handleAddToDraft      = async (id) => { try { await axios.put(`${API_BASE}/auth/${id}/add-to-drafts`);      patchUserInState(id, { isDraft: true  }); } catch (e) { alert(e.response?.data?.message || e.message); } };
  const handleRemoveFromDraft = async (id) => { try { await axios.put(`${API_BASE}/auth/${id}/remove-from-drafts`); patchUserInState(id, { isDraft: false }); } catch (e) { alert(e.response?.data?.message || e.message); } };

  const handleMarkComplete   = async (id) => { try { await axios.put(`${API_BASE}/auth/${id}/mark-complete`);   patchUserInState(id, { isComplete: true  }); setOpenActionDropdown(null); } catch (e) { alert(e.response?.data?.message || e.message); } };
  const handleMarkIncomplete = async (id) => { try { await axios.put(`${API_BASE}/auth/${id}/mark-incomplete`); patchUserInState(id, { isComplete: false }); setOpenActionDropdown(null); } catch (e) { alert(e.response?.data?.message || e.message); } };

  const handleMarkSoftwareUsed   = async (id) => { try { await axios.put(`${API_BASE}/auth/${id}/mark-software-used`);   patchUserInState(id, { softwareUsed: true  }); setOpenActionDropdown(null); } catch (e) { alert(e.response?.data?.message || e.message); } };
  const handleUnmarkSoftwareUsed = async (id) => { try { await axios.put(`${API_BASE}/auth/${id}/unmark-software-used`); patchUserInState(id, { softwareUsed: false }); setOpenActionDropdown(null); } catch (e) { alert(e.response?.data?.message || e.message); } };

  const handleMarkNotInSequence   = async (id) => { try { await axios.put(`${API_BASE}/auth/${id}/mark-not-in-sequence`);   patchUserInState(id, { notInSequence: true  }); setOpenActionDropdown(null); } catch (e) { alert(e.response?.data?.message || e.message); } };
  const handleUnmarkNotInSequence = async (id) => { try { await axios.put(`${API_BASE}/auth/${id}/unmark-not-in-sequence`); patchUserInState(id, { notInSequence: false }); setOpenActionDropdown(null); } catch (e) { alert(e.response?.data?.message || e.message); } };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try { await axios.delete(`${API_BASE}/auth/${id}/delete`); fetchUsers(); }
    catch (err) { alert(err.response?.data?.message || "Server error"); }
  };

  /* ── exports ── */
  const exportToExcel = () => {
    const data = users.map((u, i) => ({
      "Sr No.":         ((pagination?.page || 1) - 1) * (pagination?.limit || 10) + i + 1,
      Name:             u.name,
      Admin:            u.admin?.name || "No Admin",
      "Package Taken":  u.packages?.name || "No Package",
      Email:            u.email,
      Password:         u.password || "—",
      Status:           u.isActive ? "Active" : "Inactive",
      Work:             u.isComplete === false ? "Incomplete" : "Complete",
      "Software Used":  u.softwareUsed ? "Yes" : "No",
      "Not In Sequence": u.notInSequence ? "Yes" : "No",
      Draft:            u.isDraft ? "Yes" : "No",
      "Expiry Date":    formatDate(u.date),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, "UsersList.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.text("Users List", 14, 15);
    autoTable(doc, {
      startY: 25,
      head: [["Sr No.", "Name", "Admin", "Package", "Email", "Status", "Work", "Draft", "Expiry"]],
      body: users.map((u, i) => [
        ((pagination?.page || 1) - 1) * (pagination?.limit || 10) + i + 1,
        u.name,
        u.admin?.name || "No Admin",
        u.packages?.name || "No Package",
        u.email,
        u.isActive ? "Active" : "Inactive",
        u.isComplete === false ? "Incomplete" : "Complete",
        u.isDraft ? "Yes" : "No",
        formatDate(u.date),
      ]),
      theme: "grid",
      styles:     { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [37, 117, 252] },
    });
    doc.save("UsersList.pdf");
  };

  /* ── derived stats (fallback computed from current page) ── */
  const totalUsers    = pagination?.total ?? users.length;
  const activeCount   = stats?.active   ?? users.filter((u) => u.isActive).length;
  const inactiveCount = stats?.inactive ?? users.filter((u) => !u.isActive).length;
  const incompleteCount = stats?.incomplete ?? users.filter((u) => u.isComplete === false).length;
  const draftCount    = stats?.drafts   ?? users.filter((u) => u.isDraft).length;

  /* ─────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────── */
  return (
    <section className="mu-page">

      {/* ── Page header ── */}
      <div className="mu-page-header">
        <div className="mu-page-header-left">
          <div className="mu-breadcrumb">
            Admin / <span>Manage Users</span>
          </div>
          <h3 className="mu-page-title">Manage Users</h3>
        </div>

        <div className="mu-page-header-actions">
          {role === "superadmin" && (
            <button
              className="mu-button mu-button-primary"
              onClick={() => navigate("/admin/manage-user/add-user")}
            >
              + Add User
            </button>
          )}
          <button
            className="mu-button mu-button-ghost"
            onClick={() => navigate("/admin/drafts")}
          >
            Drafts
          </button>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="mu-stats-grid">
        <div className="mu-stat-card">
          <div className="mu-stat-label">
            <span className="mu-stat-dot" style={{ background: "#2575fc" }} />
            Total Users
          </div>
          <div className="mu-stat-value">{totalUsers}</div>
          <div className="mu-stat-sub">across all admins</div>
        </div>

        <div className="mu-stat-card">
          <div className="mu-stat-label">
            <span className="mu-stat-dot" style={{ background: "#15803d" }} />
            Active
          </div>
          <div className="mu-stat-value">{activeCount}</div>
          <div className="mu-stat-sub">
            {totalUsers ? Math.round((activeCount / totalUsers) * 100) : 0}% of total
          </div>
        </div>

        <div className="mu-stat-card">
          <div className="mu-stat-label">
            <span className="mu-stat-dot" style={{ background: "#b91c1c" }} />
            Inactive
          </div>
          <div className="mu-stat-value">{inactiveCount}</div>
          <div className="mu-stat-sub">
            {totalUsers ? Math.round((inactiveCount / totalUsers) * 100) : 0}% of total
          </div>
        </div>

        <div className="mu-stat-card">
          <div className="mu-stat-label">
            <span className="mu-stat-dot" style={{ background: "#92400e" }} />
            Incomplete
          </div>
          <div className="mu-stat-value">{incompleteCount}</div>
          <div className="mu-stat-sub">need attention</div>
        </div>

        <div className="mu-stat-card">
          <div className="mu-stat-label">
            <span className="mu-stat-dot" style={{ background: "#6d28d9" }} />
            In Drafts
          </div>
          <div className="mu-stat-value">{draftCount}</div>
          <div className="mu-stat-sub">awaiting review</div>
        </div>
      </div>

      {/* ── Main panel ── */}
      <div className="mu-panel">

        {/* toolbar top */}
        <div className="mu-toolbar-top">
          <div className="mu-title-group">
            <h4>All Users List</h4>
            <span>{totalUsers} records found</span>
          </div>
          <div className="mu-top-actions">
            <button className="mu-button mu-button-ghost" onClick={exportToExcel}>
              ↓ Excel
            </button>
            <button className="mu-button mu-button-ghost" onClick={exportToPDF}>
              ↓ PDF
            </button>
          </div>
        </div>

        {/* toolbar bottom */}
        <div className="mu-toolbar-bottom">
          {/* sort */}
          <button
            className="mu-button mu-button-sort"
            onClick={() => {
              setSortField("date");
              setSortOrder((p) => (p === "asc" ? "desc" : "asc"));
              setCurrentPage(1);
            }}
            title="Sort by expiry date"
          >
            Expiry {sortOrder === "asc" ? "↑" : "↓"}
          </button>

          {/* filter pills */}
          <div className="mu-filter-pills">
            {["all", "active", "inactive"].map((f) => (
              <button
                key={f}
                className={`mu-pill-filter${activeFilter === f ? " is-active-filter" : ""}`}
                onClick={() => { setActiveFilter(f); setCurrentPage(1); }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* search */}
          <div className="mu-search-wrap">
            <span className="mu-search-icon" aria-hidden="true">🔍</span>
            <input
              type="text"
              className="mu-search"
              placeholder="Search name, email, admin, package, status…"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        {/* table */}
        <div className="mu-table-wrapper">
          <table className="mu-table">
            <thead>
              <tr>
                <th>#</th>
                <th>User</th>
                <th>Admin</th>
                <th>Package</th>
                <th>Email</th>
                <th>Password</th>
                <th>Status</th>
                <th>Work</th>
                <th>Progress</th>
                <th>Expiry</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                /* skeleton rows */
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 11 }).map((__, j) => (
                      <td key={j}>
                        <div className="mu-skeleton" style={{ width: j === 0 ? 24 : "80%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length > 0 ? (
                users.map((u, index) => {
                  const srNo = ((pagination?.page || 1) - 1) * (pagination?.limit || 10) + index + 1;
                  const done  = u.completedPages ?? u.currentIndex ?? 0;
                  const total = getPackagePageLimit(u.packages);
                  const pct   = progressPercent(u);

                  return (
                    <tr key={u._id}>
                      {/* # */}
                      <td className="mu-cell-center mu-text-muted">{srNo}</td>

                      {/* user */}
                      <td>
                        <div className="mu-name-cell">
                          <div className={`mu-avatar ${avatarClass(u.name)}`}>
                            {getInitials(u.name)}
                          </div>
                          <div>
                            <div className="mu-name-text">{u.name}</div>
                            {u.isDraft && <span className="mu-name-draft">In Draft</span>}
                          </div>
                        </div>
                      </td>

                      {/* admin */}
                      <td className="mu-text-muted">{u.admin?.name || "No Admin"}</td>

                      {/* package */}
                      <td>
                        <span className="mu-pkg-pill">
                          {u.packages?.name || "No Package"}
                        </span>
                      </td>

                      {/* email */}
                      <td className="mu-nowrap mu-text-muted">{u.email}</td>

                      {/* password */}
                      <td className="mu-password-cell">{u.password || "—"}</td>

                      {/* status */}
                      <td className="mu-cell-center">
                        <span className={`mu-status ${u.isActive ? "is-active" : "is-inactive"}`}>
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* work tags */}
                      <td>
                        <div className="mu-work-tags">
                          {getWorkTags(u).map((tag) => (
                            <span key={tag.label} className={`mu-tag mu-tag-${tag.tone}`}>
                              {tag.label}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* progress */}
                      <td>
                        <div className="mu-progress-wrap">
                          <div className="mu-progress-bar">
                            <div className="mu-progress-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="mu-progress-text">{done}/{total}</span>
                        </div>
                      </td>

                      {/* expiry */}
                      <td className="mu-nowrap mu-text-muted">{formatDate(u.date)}</td>

                      {/* actions */}
                      <td>
                        <div className="mu-actions-cell">
                          {role === "superadmin" && (
                            <>
                              <button
                                className="mu-action-button edit"
                                onClick={() =>
                                  navigate("/admin/manage-user/add-user", { state: { userToEdit: u } })
                                }
                              >
                                Edit
                              </button>
                              <button
                                className="mu-action-button delete icon-only"
                                title="Delete user"
                                onClick={() => handleDelete(u._id)}
                              >
                                🗑
                              </button>
                            </>
                          )}

                          {/* activate / deactivate */}
                          {u.isActive ? (
                            <button className="mu-action-button inactive" onClick={() => handleDeactivate(u._id)}>
                              Deactivate
                            </button>
                          ) : (
                            <button className="mu-action-button active" onClick={() => handleActivate(u._id)}>
                              Activate
                            </button>
                          )}

                          {/* draft toggle */}
                          {u.isDraft ? (
                            <button
                              className="mu-action-button inactive"
                              onClick={() => handleRemoveFromDraft(u._id)}
                              title="Remove from drafts"
                            >
                              In Draft
                            </button>
                          ) : (
                            <button
                              className="mu-action-button active"
                              onClick={() => handleAddToDraft(u._id)}
                            >
                              Add Draft
                            </button>
                          )}

                          {/* work status dropdown */}
                          <div className="mu-dropdown" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="mu-action-button inactive"
                              onClick={() =>
                                setOpenActionDropdown(openActionDropdown === u._id ? null : u._id)
                              }
                            >
                              Work ▾
                            </button>

                            {openActionDropdown === u._id && (
                              <div className="mu-dropdown-menu">
                                {u.isComplete === false ? (
                                  <div className="mu-drop-item" onClick={() => handleMarkComplete(u._id)}>
                                    ✓ Mark Complete
                                  </div>
                                ) : (
                                  <div className="mu-drop-item" onClick={() => handleMarkIncomplete(u._id)}>
                                    ✗ Mark Incomplete
                                  </div>
                                )}

                                {u.softwareUsed ? (
                                  <div className="mu-drop-item" onClick={() => handleUnmarkSoftwareUsed(u._id)}>
                                    Unmark Software Used
                                  </div>
                                ) : (
                                  <div className="mu-drop-item" onClick={() => handleMarkSoftwareUsed(u._id)}>
                                    Mark Software Used
                                  </div>
                                )}

                                {u.notInSequence ? (
                                  <div className="mu-drop-item" onClick={() => handleUnmarkNotInSequence(u._id)}>
                                    Unmark Not In Sequence
                                  </div>
                                ) : (
                                  <div className="mu-drop-item" onClick={() => handleMarkNotInSequence(u._id)}>
                                    Mark Not In Sequence
                                  </div>
                                )}

                                <div
                                  className="mu-drop-item close"
                                  onClick={() => setOpenActionDropdown(null)}
                                >
                                  Close
                                </div>
                              </div>
                            )}
                          </div>

                          {/* report */}
                          <button
                            className="mu-action-button report"
                            title="View report"
                            onClick={() =>
                              navigate("/admin/manage-user/result", { state: { user: u } })
                            }
                          >
                            Report
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="11">
                    <div className="mu-empty-state">
                      <div className="mu-empty-icon">👤</div>
                      No users found
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* pagination */}
        {pagination && (
          <div className="mu-pagination-wrap">
            <span className="mu-pagination-info">
              Showing {((pagination.page - 1) * pagination.limit) + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
            </span>
            <PaginationControls pagination={pagination} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>
    </section>
  );
}

export default MuComp;