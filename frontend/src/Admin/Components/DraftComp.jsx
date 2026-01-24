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

  const itemsPerPage = 10;

  const fetchDraftUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5098/api/auth/get-drafts");
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      alert(err.response?.data?.message || "Error fetching draft users");
    }
  };

  useEffect(() => {
    fetchDraftUsers();
  }, []);

  const patchUserInState = (id, patch) => {
    setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, ...patch } : u)));
  };

  const removeUserFromList = (id) => {
    setUsers((prev) => prev.filter((u) => u._id !== id));
  };

  const handleActivate = async (id) => {
    try {
      await axios.put(`http://localhost:5098/api/auth/${id}/activate`);
      patchUserInState(id, { isActive: true });
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await axios.put(`http://localhost:5098/api/auth/${id}/deactivate`);
      patchUserInState(id, { isActive: false });
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await axios.delete(`http://localhost:5098/api/auth/${id}/delete`);
      removeUserFromList(id);
    } catch (err) {
      alert(err.response?.data?.message || "Server error");
    }
  };

  const handleRemoveFromDraft = async (id) => {
    try {
      await axios.put(`http://localhost:5098/api/auth/${id}/remove-from-drafts`);
      removeUserFromList(id);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const normalize = (v) => String(v ?? "").toLowerCase().trim();

  const filteredUsers = useMemo(() => {
    const term = normalize(searchTerm);
    if (!term) return users;

    return users.filter((u) => {
      const name = normalize(u.name);
      const email = normalize(u.email);
      const pkg = normalize(u.packages?.name);
      const admin = normalize(u.admin?.name);
      const status = u.isActive ? "active" : "inactive";
      const expiry = u.date ? new Date(u.date).toLocaleDateString().toLowerCase() : "";

      return (
        name.includes(term) ||
        email.includes(term) ||
        pkg.includes(term) ||
        admin.includes(term) ||
        status.includes(term) ||
        expiry.includes(term)
      );
    });
  }, [users, searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const exportToExcel = () => {
    const data = filteredUsers.map((u, i) => ({
      "Sr No.": i + 1,
      Name: u.name,
      Admin: u.admin?.name || "No Admin",
      "Package Taken": u.packages?.name || "No Package",
      Email: u.email,
      Password: u.password,
      Status: u.isActive ? "Active" : "Inactive",
      Draft: "Yes",
      "Expiry Date": u.date ? new Date(u.date).toLocaleDateString() : "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DraftUsers");
    XLSX.writeFile(workbook, "DraftUsers.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Draft Users List", 14, 15);

    const tableColumn = ["Sr No.", "Name", "Admin", "Package", "Email", "Status", "Expiry"];
    const tableRows = filteredUsers.map((u, i) => [
      i + 1,
      u.name,
      u.admin?.name || "No Admin",
      u.packages?.name || "No Package",
      u.email,
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

          <button className="type" onClick={() => navigate("/admin/manage-user")}>
            ← Back
          </button>
        </div>

        <div className="go">
          <div className="mygo">
            <p onClick={exportToExcel}>Excel</p>
            <p onClick={exportToPDF}>PDF</p>
          </div>

          <input
            type="text"
            className="search"
            placeholder="Search by name / email / admin / package / status..."
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
                        {u.currentIndex}/{
                            u.packages?.name === "Gold"
                            ? 100
                            : (u.packages?.name === "VIP" || u.packages?.name === "Diamond")
                            ? 200
                            : "-"
                        }
                    </td>

                    <td>{u.date ? new Date(u.date).toLocaleDateString() : "-"}</td>

                    <td className="mybtnnns">
                      <button
                        className="edit"
                        onClick={() =>
                          navigate("/admin/manage-user/add-user", { state: { userToEdit: u } })
                        }
                      >
                        Edit
                      </button>

                      <button className="delete" onClick={() => handleDelete(u._id)}>
                        Delete
                      </button>

                      {u.isActive ? (
                        <button className="inactive" onClick={() => handleDeactivate(u._id)}>
                          Deactivate
                        </button>
                      ) : (
                        <button className="active" onClick={() => handleActivate(u._id)}>
                          Activate
                        </button>
                      )}

                      <button className="draft" onClick={() => handleRemoveFromDraft(u._id)}>
                        Remove Draft
                      </button>

                      <button
                        className="report"
                        onClick={() =>
                          navigate("/admin/manage-user/result", { state: { user: u } })
                        }
                      >
                        Report
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", color: "gray" }}>
                    No draft users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredUsers.length > 0 && (
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
