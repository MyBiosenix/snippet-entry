import React, { useEffect, useState } from 'react';
import '../../Admin/Styles/macomp.css';
import axios from 'axios';
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { API_BASE } from "../../utils/api";

function SMpComp() {
  const [packages, setPackages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPackages = async () => {
    try {
      const res = await axios.get(`${API_BASE}/package/all-packages`);
      setPackages(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Error Fetching Packages');
    }
  };

  const filteredPackages = packages.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchPackages();
  }, []);

  const exportToExcel = () => {
    const data = filteredPackages.map((p, i) => ({
      "Sr No.": i + 1,
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
    const tableRows = filteredPackages.map((p, i) => [
      i + 1,
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
      <h3>Manage Packages</h3>
      <div className='incomp'>
        <div className='go'>
          <h4>All Package List</h4>
        </div>

        <div className='go'>
          <div className='mygo'>
            <p onClick={exportToExcel} style={{ cursor: 'pointer' }}>Excel</p>
            <p onClick={exportToPDF} style={{ cursor: 'pointer' }}>PDF</p>
          </div>
          <input
            type='text'
            className='search'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder='Search'
          />
        </div>

        <table>
          <thead>
            <tr>
              <th>Sr.No.</th>
              <th>Package Name</th>
              <th>Price (Per Paragraph)</th>
            </tr>
          </thead>
          <tbody>
            {filteredPackages.length > 0 ? (
              filteredPackages.map((p, index) => (
                <tr key={p._id}>
                  <td>{index + 1}</td>
                  <td>{p.name}</td>
                  <td>{p.price}</td>
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
      </div>
    </div>
  );
}

export default SMpComp;
