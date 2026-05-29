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

function MpComp() {
  const [packages, setPackages] = useState([]);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebouncedValue(searchTerm);

  const admin = JSON.parse(localStorage.getItem('admin'));
  const role = admin?.role;

  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/package/all-packages`, {
        params: {
          page: currentPage,
          limit: 10,
          search: debouncedSearch,
        },
      });
      const { data, pagination: nextPagination } = unwrapPaginatedResponse(res.data);
      setPackages(data);
      setPagination(nextPagination);
    } catch (err) {
      alert(err.response?.data?.message || 'Error Fetching Packages');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this Package?')) {
      try {
        await axios.delete(`${API_BASE}/package/${id}/delete-package`);
        fetchPackages();
      } catch (err) {
        alert(err.response?.data?.message || 'Server error');
      }
    }
  };

  const exportToExcel = () => {
    const data = packages.map((p, i) => ({
      "Sr No.": ((pagination?.page || 1) - 1) * (pagination?.limit || 10) + i + 1,
      "Package Name": p.name,
      "Price (Per Paragraph)": p.price,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Packages");
    XLSX.writeFile(workbook, "PackagesList.xlsx");
  };


  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Packages List", 14, 15);

    const tableColumn = ["Sr No.", "Package Name", "Price (Per Paragraph)"];
    const tableRows = packages.map((p, i) => [
      ((pagination?.page || 1) - 1) * (pagination?.limit || 10) + i + 1,
      p.name,
      p.price,
    ]);

    autoTable(doc, {
      startY: 25,
      head: [tableColumn],
      body: tableRows,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save("PackagesList.pdf");
  };

  return (
    <div className='comp'>
      <h3 className='h3'>Manage Packages</h3>
      <div className='incomp'>
        <div className='go'>
          <h4>All Package List</h4>
          {role === 'superadmin' && (
            <>
              <button
                className='add-btn'
                onClick={() => navigate('/admin/manage-package/add-package')}
              >
                + Add Package
              </button>
            </>
          )}
        </div>

        <div className='go'>
          <div className='mygo'>
            <p onClick={exportToExcel} style={{ cursor: 'pointer' }}className='add-btn'>Excel</p>
            <p onClick={exportToPDF} style={{ cursor: 'pointer' }}className='add-btn'>PDF</p>
          </div>
          <input
            type='text'
            className='search'
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder='Search'
          />
        </div>

        <table>
          <thead>
            <tr>
              <th>Sr.No.</th>
              <th>Package Name</th>
              <th>Price (Per Paragraph)</th>
              <th>No. of Pages</th>
              {role === 'superadmin' && (
                <>
                  <th>Action</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan='5' style={{ textAlign: 'center', color: 'gray' }}>
                  Loading packages...
                </td>
              </tr>
            ) : packages.length > 0 ? (
              packages.map((p, index) => (
                <tr key={p._id}>
                  <td>{((pagination?.page || 1) - 1) * (pagination?.limit || 10) + index + 1}</td>
                  <td>{p.name}</td>
                  <td>{p.price}</td>
                  <td>{p.pages}</td>
                  <td className='mybtnnns'>
                    {role === 'superadmin' && (
                      <>
                        <button
                          className='edit'
                          onClick={() =>
                            navigate('/admin/manage-package/add-package', {
                              state: { packageToEdit: p },
                            })
                          }
                        >
                          Edit
                        </button>
                        <button className='delete' onClick={() => handleDelete(p._id)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan='4' style={{ textAlign: 'center', color: 'gray' }}>
                  No packages found
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

export default MpComp;
