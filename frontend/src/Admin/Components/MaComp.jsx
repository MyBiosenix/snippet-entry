import React, { useCallback, useEffect, useState } from 'react';
import '../Styles/macomp.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { API_BASE } from "../../utils/api";
import PaginationControls from "../../components/PaginationControls";
import { unwrapPaginatedResponse, useDebouncedValue } from "../../utils/pagination";

function MaComp() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebouncedValue(searchTerm);

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/admin/all-admins`, {
        params: {
          page: currentPage,
          limit: 10,
          search: debouncedSearch,
        },
      });
      const { data, pagination: nextPagination } = unwrapPaginatedResponse(res.data);
      setAdmins(data);
      setPagination(nextPagination);
    } catch (err) {
      alert(err.response?.data?.message || 'Server Error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this admin?')) {
      try {
        await axios.delete(`${API_BASE}/admin/${id}/delete`);
        fetchAdmins();
      } catch (err) {
        alert(err.response?.data?.message || 'Server Error');
      }
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const exportToExcel = () => {
    const data = admins.map((a, i) => ({
      "Sr No.": ((pagination?.page || 1) - 1) * (pagination?.limit || 10) + i + 1,
      "Name": a.name,
      "Admin Type": a.role,
      "Email": a.email,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Admins");
    XLSX.writeFile(workbook, "AdminsList.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Admins List", 14, 15);

    const tableColumn = ["Sr No.", "Name", "Admin Type", "Email"];
    const tableRows = admins.map((a, i) => [
      ((pagination?.page || 1) - 1) * (pagination?.limit || 10) + i + 1,
      a.name,
      a.role,
      a.email,
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
      <h3 className='h3'>Manage Admins</h3>
      <div className='incomp'>
       <div className='toolbar-top'>
  <h4>All Admins List</h4>
  <button className='btn-primary' onClick={() => navigate('/admin/manage-admin/add-admin')}>
    + Add SubAdmin
  </button>
</div>
       <div className='toolbar-bottom'>
  <div className='export-group'>
    <button className='btn-export' onClick={exportToExcel}>↓ Excel</button>
    <button className='btn-export' onClick={exportToPDF}>↓ PDF</button>
  </div>
  <div className='search-wrap'>
    <input type='text' className='search' placeholder='Search admins…'
      value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
  </div>
</div>
<div className='table-wrapper'>
        <table>
          <thead>
            <tr>
              <th>Sr.No.</th>
              <th>Name</th>
              <th>Admin Type</th>
              <th>Email Id</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan='5' style={{ textAlign: 'center', color: 'gray' }}>
                  Loading admins...
                </td>
              </tr>
            ) : admins.length > 0 ? (
              admins.map((a, index) => (
                <tr key={a._id}>
                  <td>{((pagination?.page || 1) - 1) * (pagination?.limit || 10) + index + 1}</td>
                  <td>{a.name}</td>
                  <td><span className='role-badge'>{a.role}</span></td>
                  <td>{a.email}</td>
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
                <td colSpan='5' style={{ textAlign: 'center', color: 'gray' }}>
                  No admins found
                </td>
              </tr>
            )}
          </tbody>
        </table>
</div>
        <PaginationControls pagination={pagination} onPageChange={setCurrentPage} />
      </div>
    </div> );
}

export default MaComp;
