import React, { useEffect, useState } from 'react';
import '../Styles/macomp.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function MaComp() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAdmins = async () => {
    try {
      const res = await axios.get('https://api.freelancing-project.com/api/admin/all-admins');
      setAdmins(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Server Error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this admin?')) {
      try {
        await axios.delete(`https://api.freelancing-project.com/api/admin/${id}/delete`);
        fetchAdmins();
      } catch (err) {
        alert(err.response?.data?.message || 'Server Error');
      }
    }
  };

  const filteredAdmins = admins.filter(a =>
    a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchAdmins();
  }, []);

  const exportToExcel = () => {
    const data = filteredAdmins.map((a, i) => ({
      "Sr No.": i + 1,
      "Name": a.name,
      "Admin Type": a.role,
      "Email": a.email,
      "Password": a.password,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Admins");
    XLSX.writeFile(workbook, "AdminsList.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Admins List", 14, 15);

    const tableColumn = ["Sr No.", "Name", "Admin Type", "Email", "Password"];
    const tableRows = filteredAdmins.map((a, i) => [
      i + 1,
      a.name,
      a.role,
      a.email,
      a.password
    ]);

    autoTable(doc, {
      startY: 25,
      head: [tableColumn],
      body: tableRows,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save("AdminsList.pdf");
  };

  return (
    <div className='comp'>
      <h3>Manage Admins</h3>
      <div className='incomp'>
        <div className='go'>
          <h4>All Admins List</h4>
          <button
            className='type'
            onClick={() => navigate('/admin/manage-admin/add-admin')}
          >
            + Add SubAdmin
          </button>
        </div>
        <div className='go'>
          <div className='mygo'>
            <p onClick={exportToExcel} style={{ cursor: 'pointer' }}>Excel</p>
            <p onClick={exportToPDF} style={{ cursor: 'pointer' }}>PDF</p>
          </div>
          <input
            type='text'
            className='search'
            placeholder='Search'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <table>
          <thead>
            <tr>
              <th>Sr.No.</th>
              <th>Name</th>
              <th>Admin Type</th>
              <th>Email Id</th>
              <th>Password</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdmins.length > 0 ? (
              filteredAdmins.map((a, index) => (
                <tr key={a._id}>
                  <td>{index + 1}</td>
                  <td>{a.name}</td>
                  <td>{a.role}</td>
                  <td>{a.email}</td>
                  <td>{a.password}</td>
                  <td className='mybtnnns'>
                    <button
                      className='edit'
                      onClick={() =>
                        navigate('/admin/manage-admin/add-admin', {
                          state: { adminToEdit: a },
                        })
                      }
                    >
                      Edit
                    </button>
                    <button
                      className='delete'
                      onClick={() => handleDelete(a._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan='6' style={{ textAlign: 'center', color: 'gray' }}>
                  No admins found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MaComp;
