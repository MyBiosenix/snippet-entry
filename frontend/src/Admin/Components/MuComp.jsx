import React, { useEffect, useState } from 'react';
import '../Styles/macomp.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function MuComp() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const token = localStorage.getItem('token');
  const admin = JSON.parse(localStorage.getItem('admin'));
  const role = admin?.role;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5098/api/auth/all-users');
      setUsers(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Error fetching users');
    }
  };

  const handleActivate = async (id) => {
    try {
      await axios.put(`http://localhost:5098/api/auth/${id}/activate`);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await axios.put(`http://localhost:5098/api/auth/${id}/deactivate`);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`http://localhost:5098/api/auth/${id}/delete`);
        fetchUsers();
      } catch (err) {
        alert(err.response?.data?.message || 'Server error');
      }
    }
  };

  // 🔍 Search filter
  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const exportToExcel = () => {
    const data = filteredUsers.map((u, i) => ({
      "Sr No.": i + 1,
      "Name": u.name,
      "Package Taken": u.packages?.name || 'No Package',
      "Email": u.email,
      "Password": u.password,
      "Status": u.isActive ? "Active" : "Inactive"
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    XLSX.writeFile(workbook, "UsersList.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Users List", 14, 15);

    const tableColumn = ["Sr No.", "Name", "Package Taken", "Email", "Password", "Status"];
    const tableRows = filteredUsers.map((u, i) => [
      i + 1,
      u.name,
      u.packages?.name || 'No Package',
      u.email,
      u.password,
      u.isActive ? "Active" : "Inactive"
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
          {role === 'superadmin' && (
            <button
              className='type'
              onClick={() => navigate('/admin/manage-user/add-user')}
            >
              + Add User
            </button>
          )}
        </div>

        <div className='go'>
          <div className='mygo'>
            <p onClick={exportToExcel} style={{ cursor: 'pointer' }}>Excel</p>
            <p onClick={exportToPDF} style={{ cursor: 'pointer' }}>PDF</p>
          </div>
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
              <th>Password</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((u, index) => (
                <tr key={u._id}>
                  <td>{indexOfFirstItem + index + 1}</td>
                  <td>{u.name}</td>
                  <td>{u.packages?.name || 'No Package'}</td>
                  <td>{u.email}</td>
                  <td>{u.password}</td>
                  <td>
                    {u.isActive ? (
                      <span style={{ color: 'green', fontWeight: 'bold' }}>Active</span>
                    ) : (
                      <span style={{ color: 'red', fontWeight: 'bold' }}>Inactive</span>
                    )}
                  </td>
                  <td className='mybtnnns'>
                    {role === 'superadmin' && (
                      <>
                        <button
                          className='edit'
                          onClick={() =>
                            navigate('/admin/manage-user/add-user', { state: { userToEdit: u } })
                          }
                        >
                          Edit
                        </button>
                        <button className='delete' onClick={() => handleDelete(u._id)}>
                          Delete
                        </button>
                      </>
                    )}
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
                        navigate('/admin/manage-user/result', { state: { user: u } })
                      }
                    >
                      Report
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan='7' style={{ textAlign: 'center', color: 'gray' }}>
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>


        {filteredUsers.length > 0 && (
          <div className="pagination-container">
            <div className="pagination">
              <button onClick={() => goToPage(1)} disabled={currentPage === 1}>«</button>
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>‹</button>
              <span>Page {currentPage} of {totalPages}</span>
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>›</button>
              <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>»</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default MuComp;
