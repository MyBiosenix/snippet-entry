import React, { useCallback, useEffect, useState } from "react";
import "../Styles/macomp.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getPackagePageLimit } from "../../utils/packageRules";
import { API_BASE } from "../../utils/api";
import PaginationControls from "../../components/PaginationControls";
import { unwrapPaginatedResponse, useDebouncedValue } from "../../utils/pagination";

function DraftComp() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebouncedValue(searchTerm);

  const fetchDraftUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/auth/get-drafts`, {
        params: {
          page: currentPage,
          limit: 10,
          search: debouncedSearch,
        },
      });
      const { data, pagination: nextPagination } = unwrapPaginatedResponse(res.data);
      setUsers(data);
      setPagination(nextPagination);
    } catch (err) {
      alert(err.response?.data?.message || "Error fetching draft users");
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch]);

  useEffect(() => {
    fetchDraftUsers();
  }, [fetchDraftUsers]);

  const patchUserInState = (id, patch) => {
    setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, ...patch } : u)));
  };

  const handleActivate = async (id) => {
    try {
      await axios.put(`${API_BASE}/auth/${id}/activate`);
      patchUserInState(id, { isActive: true });
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await axios.put(`${API_BASE}/auth/${id}/deactivate`);
      patchUserInState(id, { isActive: false });
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await axios.delete(`${API_BASE}/auth/${id}/delete`);
      fetchDraftUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Server error");
    }
  };

  const handleRemoveFromDraft = async (id) => {
    try {
      await axios.put(`${API_BASE}/auth/${id}/remove-from-drafts`);
      fetchDraftUsers();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const exportToExcel = () => {
    const data = users.map((u, i) => ({
      "Sr No.": ((pagination?.page || 1) - 1) * (pagination?.limit || 10) + i + 1,
      Name: u.name,
      Admin: u.admin?.name || "No Admin",
      "Package Taken": u.packages?.name || "No Package",
      Email: u.email,
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
    const tableRows = users.map((u, i) => [
      ((pagination?.page || 1) - 1) * (pagination?.limit || 10) + i + 1,
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
            â† Back
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
                <th>Status</th>
                <th>Goal Status</th>
                <th>Expiry Date</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", color: "gray" }}>
                    Loading draft users...
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((u, index) => (
                  <tr key={u._id}>
                    <td>{((pagination?.page || 1) - 1) * (pagination?.limit || 10) + index + 1}</td>
                    <td>{u.name}</td>
                    <td>{u.admin?.name || "No Admin"}</td>
                    <td>{u.packages?.name || "No Package"}</td>
                    <td>{u.email}</td>

                    <td>
                      {u.isActive ? (
                        <span style={{ color: "green", fontWeight: "bold" }}>Active</span>
                      ) : (
                        <span style={{ color: "red", fontWeight: "bold" }}>Inactive</span>
                      )}
                    </td>
                    <td>{(u.completedPages ?? u.currentIndex ?? 0)}/{getPackagePageLimit(u.packages)}</td>

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

        <PaginationControls pagination={pagination} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}

export default DraftComp;
