import React, { useState, useEffect } from 'react';
import '../Styles/macomp.css';
import axios from 'axios';
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function InactiveComp() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Fetch inactive users
  const getInactiveUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5098/api/auth/inactive-users');
      setUsers(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Server Error');
    }
  };

  useEffect(() => {
    getInactiveUsers();
  }, []);

  // ✅ Filter users by search
  const filteredInactiveUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✅ Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInactiveUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInactiveUsers.length / itemsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // ✅ Export to Excel
  const exportToExcel = () => {
    const data = filteredInactiveUsers.map((u, i) => ({
      "Sr No.": i + 1,
      "Name": u.name,
      "Email": u.email,
      "Status": "Inactive"
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Deactivated Users");
    XLSX.writeFile(workbook, "DeactivatedUsersList.xlsx");
  };

  // ✅ Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Deactivated Users List", 14, 15);

    const tableColumn = ["Sr No.", "Name", "Email", "Status"];
    const tableRows = filteredInactiveUsers.map((u, i) => [
      i + 1,
      u.name,
      u.email,
      "Inactive",
    ]);

    autoTable(doc, {
      startY: 25,
      head: [tableColumn],
      body: tableRows,
      theme: "grid",
      headStyles: { fillColor: [192, 57, 43] },
    });

    doc.save("DeactivatedUsersList.pdf");
  };

  return (
    <div className='comp'>
      <h3>Deactivated Users</h3>
      <div className='incomp'>
        <div className='go'>
          <h4>Deactivated Users List</h4>
        </div>

        <div className='go'>
          <div className='mygo'>
            <p onClick={exportToExcel} style={{ cursor: 'pointer' }}>Excel</p>
            <p onClick={exportToPDF} style={{ cursor: 'pointer' }}>PDF</p>
          </div>
          <input
            type='text'
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className='search'
            placeholder='Search by name or email'
          />
        </div>

        <table>
          <thead>
            <tr>
              <th>Sr.No.</th>
              <th>Name</th>
              <th>Email Id</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((u, index) => (
                <tr key={u._id}>
                  <td>{indexOfFirstItem + index + 1}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td style={{ color: 'red', fontWeight: 'bold' }}>Inactive</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: 'gray' }}>
                  No inactive users found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* ✅ Pagination UI */}
        {filteredInactiveUsers.length > 0 && (
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

export default InactiveComp;
