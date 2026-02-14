import React, { useEffect, useMemo, useState } from "react";
import "../Styles/macomp.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const formatExpiry = (dateVal) => {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();

  return [
    `${dd}/${mm}/${yyyy}`,
    `${dd}-${mm}-${yyyy}`,
    `${yyyy}-${mm}-${dd}`,
    d.toLocaleDateString(),
  ].join(" ");
};

function MuComp() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  const itemsPerPage = 10;

  const admin = JSON.parse(localStorage.getItem("admin") || "{}");
  const role = admin?.role;

  useEffect(() => {
    fetchUsers();
  }, []);

  const patchUserInState = (id, patch) => {
    setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, ...patch } : u)));
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get("https://api.freelancing-project.com/api/auth/all-users");
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      alert(err.response?.data?.message || "Error fetching users");
    }
  };

  // -------------------- activate/deactivate --------------------
  const handleActivate = async (id) => {
    try {
      await axios.put(`https://api.freelancing-project.com/api/auth/${id}/activate`);
      patchUserInState(id, { isActive: true });
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await axios.put(`https://api.freelancing-project.com/api/auth/${id}/deactivate`);
      patchUserInState(id, { isActive: false });
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  // -------------------- drafts --------------------
  const handleAddToDraft = async (id) => {
    try {
      await axios.put(`https://api.freelancing-project.com/api/auth/${id}/add-to-drafts`);
      patchUserInState(id, { isDraft: true });
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleRemoveFromDraft = async (id) => {
    try {
      await axios.put(`https://api.freelancing-project.com/api/auth/${id}/remove-from-drafts`);
      patchUserInState(id, { isDraft: false });
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  // -------------------- ✅ mark complete/incomplete --------------------
  const handleMarkIncomplete = async (id) => {

    const prevUsers = users; // rollback backup
    patchUserInState(id, { isComplete: false }); // optimistic

    try {
      // ✅ using PUT (more compatible)
      await axios.put(`https://api.freelancing-project.com/api/auth/${id}/mark-incomplete`);
    } catch (err) {
      setUsers(prevUsers); // rollback
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleMarkComplete = async (id) => {

    const prevUsers = users; // rollback backup
    patchUserInState(id, { isComplete: true }); // optimistic

    try {
      // ✅ using PUT (more compatible)
      await axios.put(`https://api.freelancing-project.com/api/auth/${id}/mark-complete`);
    } catch (err) {
      setUsers(prevUsers); // rollback
      alert(err.response?.data?.message || err.message);
    }
  };

  // -------------------- delete --------------------
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await axios.delete(`https://api.freelancing-project.com/api/auth/${id}/delete`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Server error");
    }
  };

  // -------------------- sort --------------------
  const sortUsers = (data) => {
    if (sortField === "expiry") {
      return [...data].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      });
    }
    return data;
  };

  // -------------------- filter/search --------------------
  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const adminName = (u.admin?.name || "").toLowerCase();
      const pkgName = (u.packages?.name || "").toLowerCase();

      const expirySearch = formatExpiry(u.date).toLowerCase();
      const statusStr = u.isActive ? "active" : "inactive";
      const draftStr = u.isDraft ? "draft" : "not draft";
      const workStr = u.isComplete === false ? "incomplete" : "complete";

      return (
        name.includes(q) ||
        email.includes(q) ||
        adminName.includes(q) ||
        pkgName.includes(q) ||
        expirySearch.includes(q) ||
        statusStr.includes(q) ||
        draftStr.includes(q) ||
        workStr.includes(q)
      );
    });
  }, [users, searchTerm]);

  const sortedUsers = useMemo(() => sortUsers(filteredUsers), [filteredUsers, sortField, sortOrder]);

  // -------------------- pagination --------------------
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedUsers.slice(indexOfFirstItem, indexOfLastItem);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // -------------------- export --------------------
  const exportToExcel = () => {
    const data = filteredUsers.map((u, i) => ({
      "Sr No.": i + 1,
      Name: u.name,
      Admin: u.admin?.name || "No Admin",
      "Package Taken": u.packages?.name || "No Package",
      Email: u.email,
      Password: u.password,
      Status: u.isActive ? "Active" : "Inactive",
      Work: u.isComplete === false ? "Incomplete" : "Complete",
      Draft: u.isDraft ? "Yes" : "No",
      "Expiry Date": u.date ? new Date(u.date).toLocaleDateString() : "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    XLSX.writeFile(workbook, "UsersList.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Users List", 14, 15);

    const tableColumn = [
      "Sr No.",
      "Name",
      "Admin",
      "Package",
      "Email",
      "Password",
      "Status",
      "Work",
      "Draft",
      "Expiry Date",
    ];

    const tableRows = filteredUsers.map((u, i) => [
      i + 1,
      u.name,
      u.admin?.name || "No Admin",
      u.packages?.name || "No Package",
      u.email,
      u.password,
      u.isActive ? "Active" : "Inactive",
      u.isComplete === false ? "Incomplete" : "Complete",
      u.isDraft ? "Yes" : "No",
      u.date ? new Date(u.date).toLocaleDateString() : "-",
    ]);

    autoTable(doc, {
      startY: 25,
      head: [tableColumn],
      body: tableRows,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save("UsersList.pdf");
  };

  return (
    <div className="comp">
      <h3>Manage Users</h3>

      <div className="incomp">
        <div className="go">
          <h4>All Users List</h4>

          <div style={{ display: "flex", gap: 10 }}>
            {role === "superadmin" && (
              <button className="type" onClick={() => navigate("/admin/manage-user/add-user")}>
                + Add User
              </button>
            )}

            <button className="type" onClick={() => navigate("/admin/drafts")}>
              Drafts
            </button>
          </div>
        </div>

        <div className="go">
          <div className="mygo">
            <p onClick={exportToExcel} style={{ cursor: "pointer" }}>Excel</p>
            <p onClick={exportToPDF} style={{ cursor: "pointer" }}>PDF</p>
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
            onClick={() => {
              setSortField("expiry");
              setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
              setCurrentPage(1);
            }}
          >
            Expiry: {sortOrder === "asc" ? "↑" : "↓"}
          </p>

          <input
            type="text"
            className="search"
            placeholder="Search name / email / admin / package / status / draft / work / expiry..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Sr.No.</th>
                <th>Name</th>
                <th>Admin</th>
                <th>Package Taken</th>
                <th>Email Id</th>
                <th>Password</th>
                <th>Status</th>
                <th>Work</th>
                <th>Goal Status</th>
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
                    <td>{u.admin?.name || "No Admin"}</td>
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

                    <td>
                      {u.isComplete === false ? (
                        <span style={{ color: "#b91c1c", fontWeight: "bold" }}>Incomplete</span>
                      ) : (
                        <span style={{ color: "#065f46", fontWeight: "bold" }}>Complete</span>
                      )}
                    </td>

                    <td>
                      {u.currentIndex}/
                      {typeof u.packages?.pages === "number" && u.packages.pages > 0
                        ? u.packages.pages
                        : u.packages?.name === "VIP" || u.packages?.name === "Diamond"
                        ? 200
                        : 100}
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

                      {u.isDraft ? (
                        <button
                          className="inactive"
                          onClick={() => handleRemoveFromDraft(u._id)}
                          title="Click to remove from drafts"
                        >
                          In Draft
                        </button>
                      ) : (
                        <button className="active" onClick={() => handleAddToDraft(u._id)}>
                          Add To Draft
                        </button>
                      )}

                      {/* ✅ Mark Complete / Incomplete */}
                      {u.isComplete === false ? (
                        <button className="active" onClick={() => handleMarkComplete(u._id)}>
                          Mark Complete
                        </button>
                      ) : (
                        <button className="inactive" onClick={() => handleMarkIncomplete(u._id)}>
                          Mark Incomplete
                        </button>
                      )}

                      <button
                        className="report"
                        onClick={() =>
                          navigate("/admin/manage-user/result", {
                            state: { user: u },
                          })
                        }
                      >
                        Report
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" style={{ textAlign: "center", color: "gray" }}>
                    No users found
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

export default MuComp;
