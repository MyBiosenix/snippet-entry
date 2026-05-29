import React, { useState, useEffect } from 'react';
import '../Styles/macomp.css';
import axios from 'axios';
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { API_BASE } from "../../utils/api";
import PaginationControls from "../../components/PaginationControls";
import { unwrapPaginatedResponse, useDebouncedValue } from "../../utils/pagination";

function InactiveComp() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebouncedValue(searchTerm);

  useEffect(() => {
    const getInactiveUsers = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/auth/inactive-users`, {
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
        alert(err.response?.data?.message || 'Server Error');
      } finally {
        setLoading(false);
      }
    };

    getInactiveUsers();
  }, [currentPage, debouncedSearch]);

  const exportToExcel = () => {
    const data = users.map((u, i) => ({
      "Sr No.": ((pagination?.page || 1) - 1) * (pagination?.limit || 10) + i + 1,
      "Name": u.name,
      "Email": u.email,
      "Status": "Inactive"
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Deactivated Users");
    XLSX.writeFile(workbook, "DeactivatedUsersList.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Deactivated Users List", 14, 15);

    const tableColumn = ["Sr No.", "Name", "Email", "Status"];
    const tableRows = users.map((u, i) => [
      ((pagination?.page || 1) - 1) * (pagination?.limit || 10) + i + 1,
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
      <h3 className='h3'>Deactivated Users</h3>
      <div className='incomp'>
        <div className='go'>
          <h4 >Deactivated Users List</h4>
        </div>

        <div className='go'>
          <div className='mygo'>
            <p onClick={exportToExcel} style={{ cursor: 'pointer' }} className='add-btn'>Excel</p>
            <p onClick={exportToPDF} style={{ cursor: 'pointer' }} className='add-btn'>PDF</p>
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
            {loading ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: 'gray' }}>
                  Loading inactive users...
                </td>
              </tr>
            ) : users.length > 0 ? (
              users.map((u, index) => (
                <tr key={u._id}>
                  <td>{((pagination?.page || 1) - 1) * (pagination?.limit || 10) + index + 1}</td>
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

        <PaginationControls pagination={pagination} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}

export default InactiveComp;
