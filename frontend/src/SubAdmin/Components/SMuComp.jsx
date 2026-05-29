import React, { useCallback, useEffect, useState } from 'react';
import '../../Admin/Styles/macomp.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getPackagePageLimit } from "../../utils/packageRules";
import { API_BASE } from "../../utils/api";
import { getSubAdminToken } from "../../utils/auth";
import PaginationControls from "../../components/PaginationControls";
import { unwrapPaginatedResponse, useDebouncedValue } from "../../utils/pagination";

function SMuComp() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("desc");
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebouncedValue(searchTerm);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = getSubAdminToken();
      const res = await axios.get(`${API_BASE}/sub-admin/getusers`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          page: currentPage,
          limit: 10,
          search: debouncedSearch,
          sortBy: "date",
          sortOrder,
        },
      });
      const { data, pagination: nextPagination } = unwrapPaginatedResponse(res.data);
      setUsers(data);
      setPagination(nextPagination);
    } catch (err) {
      alert(err.response?.data?.message || 'Error fetching users');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleActivate = async (id) => {
    try {
      await axios.put(`${API_BASE}/auth/${id}/activate`);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await axios.put(`${API_BASE}/auth/${id}/deactivate`);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const exportToExcel = () => {
    const data = users.map((u, i) => ({
      "Sr No.": ((pagination?.page || 1) - 1) * (pagination?.limit || 10) + i + 1,
      "Name": u.name,
      "Package Taken": u.packages?.name || 'No Package',
      "Email": u.email,
      "Status": u.isActive ? "Active" : "Inactive",
      "Expiry Date": new Date(u.date).toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    XLSX.writeFile(workbook, "UsersList.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Users List", 14, 15);

    const tableColumn = ["Sr No.", "Name", "Package Taken", "Email", "Status", "Expiry Date"];
    const tableRows = users.map((u, i) => [
      ((pagination?.page || 1) - 1) * (pagination?.limit || 10) + i + 1,
      u.name,
      u.packages?.name || 'No Package',
      u.email,
      u.isActive ? "Active" : "Inactive",
      new Date(u.date).toLocaleDateString()
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
    <div className='comp'>
      <h3>Manage Users</h3>
      <div className='incomp'>
        <div className='go'>
          <h4>All Users List</h4>
        </div>

        <div className='go'>
          <div className="mygo">
            <p onClick={exportToExcel}>Excel</p>
            <p onClick={exportToPDF}>PDF</p>
          </div>
          <p
            style={{ cursor: "pointer", background:'#2575fc', color:'White', padding: '10px 20px', borderRadius:'10px' }}
            onClick={() => {
              setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
              setCurrentPage(1);
            }}
          >
            Expiry: {sortOrder === "asc" ? "â†‘" : "â†“"}
          </p>

          <input
            type='text'
            className='search'
            placeholder='Search by name or email'
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <table>
          <thead>
            <tr>
              <th>Sr.No.</th>
              <th>Name</th>
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
                <td colSpan='8' style={{ textAlign: 'center', color: 'gray' }}>
                  Loading users...
                </td>
              </tr>
            ) : users.length > 0 ? (
              users.map((u, index) => (
                <tr key={u._id}>
                  <td>{((pagination?.page || 1) - 1) * (pagination?.limit || 10) + index + 1}</td>
                  <td>{u.name}</td>
                  <td>{u.packages?.name || 'No Package'}</td>
                  <td>{u.email}</td>
                  <td>
                    {u.isActive ? (
                      <span style={{ color: 'green', fontWeight: 'bold' }}>Active</span>
                    ) : (
                      <span style={{ color: 'red', fontWeight: 'bold' }}>Inactive</span>
                    )}
                  </td>
                  <td>{(u.completedPages ?? u.currentIndex ?? 0)}/{getPackagePageLimit(u.packages)}</td>
                  <td>{new Date(u.date).toLocaleDateString()}</td>
                  <td className='mybtnnns'>
                    {u.isActive ? (
                      <button className='inactive' onClick={() => handleDeactivate(u._id)}>
                        Deactivate
                      </button>
                    ) : (
                      <button className='active' onClick={() => handleActivate(u._id)}>
                        Activate
                      </button>
                    )}
                    <button
                      className='report'
                      onClick={() =>
                        navigate('/sub-admin/manage-user/result', { state: { user: u } })
                      }
                    >
                      Report
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan='8' style={{ textAlign: 'center', color: 'gray' }}>
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <PaginationControls pagination={pagination} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}

export default SMuComp;
