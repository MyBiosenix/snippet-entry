import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../../utils/api";
import { useNavigate } from "react-router-dom";
import "../Styles/mucomp.css";

function TrashUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTrashUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/auth/trash-users`);
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to fetch trash users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrashUsers();
  }, []);

  const formatDateTime = (value) => {
    if (!value) return "—";

    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getDeleteAfterDate = (deletedAt) => {
    if (!deletedAt) return "—";

    const date = new Date(deletedAt);
    date.setDate(date.getDate() + 60);

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

const handleRestore = async (id) => {
  const confirmed = window.confirm(
    "Are you sure you want to restore this user?"
  );

  if (!confirmed) return;

  try {
    const res = await axios.put(`${API_BASE}/auth/${id}/restore`);

    alert(res.data?.message || "User restored successfully");

    await fetchTrashUsers();
  } catch (err) {
    const status = err.response?.status;
    const message = err.response?.data?.message;

    if (status === 409) {
      alert(
        message ||
          "This user's email is already being used by another active user. Change the email before restoring."
      );
      return;
    }

    if (status === 404) {
      alert(message || "User was not found in Trash.");
      await fetchTrashUsers();
      return;
    }

    alert(message || "Failed to restore user");
  }
};

  const handlePermanentDelete = async (id) => {
    if (!window.confirm("Permanently delete this user? This cannot be undone.")) return;

    try {
      await axios.delete(`${API_BASE}/auth/${id}/permanent-delete`);
      fetchTrashUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to permanently delete user");
    }
  };

  return (
    <section className="mu-page">
      <div className="mu-page-header">
        <div className="mu-page-header-left">
          <div className="mu-breadcrumb">
            Admin / <span>Trash Users</span>
          </div>
          <h3 className="mu-page-title">Trash Users</h3>
        </div>

        <div className="mu-page-header-actions">
          <button
            className="mu-button mu-button-ghost"
            onClick={() => navigate("/admin/manage-user")}
          >
            Back to Users
          </button>
        </div>
      </div>

      <div className="mu-panel">
        <div className="mu-toolbar-top">
          <div className="mu-title-group">
            <h4>Deleted Users</h4>
            <span>Users will be permanently deleted after 2 months</span>
          </div>
        </div>

        <div className="mu-table-wrapper">
          <table className="mu-table">
            <thead>
              <tr>
                <th>#</th>
                <th>User</th>
                <th>Email</th>
                <th>Admin</th>
                <th>Package</th>
                <th>Deleted At</th>
                <th>Auto Delete After</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8">Loading trash users...</td>
                </tr>
              ) : users.length > 0 ? (
                users.map((u, index) => (
                  <tr key={u._id}>
                    <td>{index + 1}</td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.admin?.name || "No Admin"}</td>
                    <td>{u.packages?.name || "No Package"}</td>
                    <td>{formatDateTime(u.deletedAt)}</td>
                    <td>{getDeleteAfterDate(u.deletedAt)}</td>
                    <td>
                      <div className="mu-actions-cell">
                        <button
                          className="mu-action-button active"
                          onClick={() => handleRestore(u._id)}
                        >
                          Restore
                        </button>

                        <button
                          className="mu-action-button delete"
                          onClick={() => handlePermanentDelete(u._id)}
                        >
                          Delete Forever
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8">
                    <div className="mu-empty-state">
                      <div className="mu-empty-icon">🗑</div>
                      Trash is empty
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default TrashUsers;