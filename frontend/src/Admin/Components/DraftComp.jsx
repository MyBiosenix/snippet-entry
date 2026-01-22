import React, { useEffect, useMemo, useState } from "react";
import "../Styles/macomp.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function DraftComp() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [sortField, setSortField] = useState(null); // "expiry" | null
  const [sortOrder, setSortOrder] = useState("asc"); // asc | desc

  const itemsPerPage = 10;

  const admin = JSON.parse(localStorage.getItem("admin"));
  const role = admin?.role;
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchDraftUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Fetch ONLY Draft Users
  const fetchDraftUsers = async () => {
    try {
      // 🔥 Change this route if your backend uses another path
      const res = await axios.get("http://localhost:5098/api/auth/get-drafts", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      alert(err.response?.data?.message || "Error fetching draft users");
      setUsers([]);
    }
  };

  const handleActivate = async (id) => {
    try {
      await axios.put(
        `http://localhost:5098/api/auth/${id}/activate`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
      fetchDraftUsers();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await axios.put(
        `http://localhost:5098/api/auth/${id}/deactivate`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
      fetchDraftUsers();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`http://localhost:5098/api/auth/${id}/delete`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      fetchDraftUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Server error");
    }
  };

  // ✅ Remove from Draft (Move back to Manage Users)
  const handleRemoveFromDraft = async (id) => {
    try {
      await axios.put(
        `http://localhost:5098/api/auth/${id}/remove-from-draft`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
      fetchDraftUsers();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  // --- Helpers for search ---
  const normalize = (v) => String(v ?? "").toLowerCase().trim();

  const expirySearchString = (expiry) => {
    if (!expiry) return "";
    const d = new Date(expiry);
    if (Number.isNaN(d.getTime())) return "";

    const locale = d.toLocaleDateString();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const dmy = `${dd}-${mm}-${yyyy}`;
    const monthName = d.toLocaleString("en-US", { month: "short", year: "numeric" });

    return `${locale} ${dmy} ${monthName}`.toLowerCase();
  };

  // --- Search filter ---
  const filteredUsers = useMemo(() => {
    const term = normalize(searchTerm);
    if (!term) return users;

    return users.filter((u) => {
      const name = normalize(u.name);
      const email = normalize(u.email);
      const pkg = normalize(u.packages?.name);
      const status = u.isActive ? "active" : "inactive";
      const expiryStr = expirySearchString(u.date);

      return (
        name.includes(term) ||
        email.includes(term) ||
        pkg.includes(term) ||
        status.includes(term) ||
        expiryStr.includes(term)
      );
    });
  }, [users, searchTerm]);

  // --- Sort by expiry ---
  const sortedUsers = useMemo(() => {
    const data = [...filteredUsers];

    if (sortField === "expiry") {
      data.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);

        const aTime = Number.isNaN(dateA.getTime()) ? 0 : dateA.getTime();
        const bTime = Number.isNaN(dateB.getTime()) ? 0 : dateB.getTime();

        return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
      });
    }

    return data;
  }, [filteredUsers, sortField, sortOrder]);

  // --- Pagination ---
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedUsers.slice(indexOfFirstItem, indexOfLastItem);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const toggleExpirySort = () => {
    setSortField("expiry");
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    setCurrentPage(1);
  };

  // --- Export Excel ---
  const exportToExcel = () => {
    const data = sortedUsers.map((u, i) => ({
      "Sr No.": i + 1,
      Name: u.name,
      "Package Taken": u.packages?.name || "No Package",
      Email: u.email,
      Password: u.password,
      Status: u.isActive ? "Active" : "Inactive",
      "Expiry Date": u.date ? new Date(u.date).toLocaleDateString() : "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Draft Users");
    XLSX.writeFile(workbook, "DraftUsers.xlsx");
  };

  // --- Export PDF ---
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Draft Users List", 14, 15);

    const tableColumn = ["Sr No.", "Name", "Package Taken", "Email", "Password", "Status", "Expiry Date"];

    const tableRows = sortedUsers.map((u, i) => [
      i + 1,
      u.name,
      u.packages?.name || "No Package",
      u.email,
      u.password,
      u.isActive ? "Active" : "Inactive",
      u.date ? new Date(u.date).toLocaleDateString() : "-",
    ]);

    autoTable(doc, {
      startY: 25,
      head: [tableColumn],
      body: tableRows,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save("DraftUsers.pdf");
  };

  return (
    <div className="comp">
      <h3>Draft Users</h3>

      <div className="incomp">
        <div className="go">
          <h4>Draft Users List</h4>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="type" onClick={() => navigate("/admin/manage-user")}>
              ← Back
            </button>
          </div>
        </div>

        <div className="go">
          <div className="mygo">
            <p onClick={exportToExcel} style={{ cursor: "pointer" }}>
              Excel
            </p>
            <p onClick={exportToPDF} style={{ cursor: "pointer" }}>
              PDF
            </p>
          </div>

          <p
            style={{
              cursor: "pointer",
              background: "#2575fc",
              color: "White",
              padding: "10px 20px",
              borderRadius: "10px",
              userSelect: "none",
            }}
            onClick={toggleExpirySort}
            title="Sort by expiry date"
          >
            Expiry: {sortOrder === "asc" ? "↑" : "↓"}
          </p>

          <input
            type="text"
            className="search"
            placeholder="Search name / email / status / package / expiry..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="mytable">
          <table>
            <thead>
              <tr>
                <th>Sr.No.</th>
                <th>Name</th>
                <th>Package Taken</th>
                <th>Email Id</th>
                <th>Password</th>
                <th>Status</th>
                <th>Expiry Date</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((u, index) => (
                  <tr key={u._id}>
                    <td>{indexOfFirstItem + index + 1}</td>
                    <td>{u.name}</td>
                    <td>{u.packages?.name || "No Package"}</td>
                    <td>{u.email}</td>
                    <td>{u.password}</td>

                    <td>
                      {u.isActive ? (
                        <span style={{ color: "green", fontWeight: "bold" }}>Active</span>
                      ) : (
                        <span style={{ color: "red", fontWeight: "bold" }}>Inactive</span>
                      )}
                    </td>

                    <td>{u.date ? new Date(u.date).toLocaleDateString() : "-"}</td>

                    <td className="mybtnnns">
                      {role === "superadmin" && (
                        <>
                          <button
                            className="edit"
                            onClick={() =>
                              navigate("/admin/manage-user/add-user", {
                                state: { userToEdit: u },
                              })
                            }
                          >
                            Edit
                          </button>

                          <button className="delete" onClick={() => handleDelete(u._id)}>
                            Delete
                          </button>
                        </>
                      )}

                      {u.isActive ? (
                        <button className="inactive" onClick={() => handleDeactivate(u._id)}>
                          Deactivate
                        </button>
                      ) : (
                        <button className="active" onClick={() => handleActivate(u._id)}>
                          Activate
                        </button>
                      )}

                      <button
                        className="draft"
                        onClick={() => handleRemoveFromDraft(u._id)}
                        title="Move back to Manage Users"
                      >
                        Remove Draft
                      </button>

                      <button
                        className="report"
                        onClick={() => navigate("/admin/manage-user/result", { state: { user: u } })}
                      >
                        Report
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", color: "gray" }}>
                    No draft users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {sortedUsers.length > 0 && (
          <div className="pagination-container">
            <div className="pagination">
              <button onClick={() => goToPage(1)} disabled={currentPage === 1}>
                «
              </button>
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                ‹
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                ›
              </button>
              <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>
                »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DraftComp;
