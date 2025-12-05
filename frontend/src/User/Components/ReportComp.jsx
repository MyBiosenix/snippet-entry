import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import '../Styles/reports.css';
import { useNavigate } from 'react-router-dom';

Modal.setAppElement('#root');

function ReportComp() {
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  useEffect(() => {
  if (!userId) return;

  fetch(`https://api.freelancing-project.com/api/snippet/user-visible/${userId}`)
    .then(res => res.json())
    .then(data => {
      console.log("Fetched data:", data); // 👈 check this in console
      setResults(data);
    })
    .catch(err => console.error(err));
}, [userId]);


 function highlightErrors(original = "", userText = "") {

  const normalize = (s = "") =>
    s.normalize("NFKC")
      .replace(/\u2026/g, "...") 
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\u2013|\u2014/g, "-")
      .replace(/\u00A0/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  original = normalize(original);
  userText = normalize(userText);

  const strip = (s) => s.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();

  const oWords = original.split(/\s+/);
  const uWords = userText.split(/\s+/);

  const oNorm = oWords.map(strip);
  const uNorm = uWords.map(strip);

  const m = oNorm.length;
  const n = uNorm.length;

  // LCS matrix
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oNorm[i - 1] === uNorm[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // Backtrack
  let i = m, j = n;
  const align = [];

  while (i > 0 && j > 0) {
    if (oNorm[i - 1] === uNorm[j - 1]) {
      align.unshift({ ow: oWords[i - 1], uw: uWords[j - 1] });
      i--; j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      align.unshift({ ow: oWords[i - 1], uw: null });
      i--;
    } else {
      align.unshift({ ow: null, uw: uWords[j - 1] });
      j--;
    }
  }

  while (i > 0) align.unshift({ ow: oWords[i - 1], uw: null }), i--;
  while (j > 0) align.unshift({ ow: null, uw: uWords[j - 1] }), j--;

  const stripPunct = (s) => s.replace(/[^\p{L}\p{N}]/gu, "");
  const getPunct = (s) => s.replace(/[\p{L}\p{N}]/gu, "");

  // BUILD JSX
  const result = [];

  for (let k = 0; k < align.length; k++) {
    const { ow, uw } = align[k];

    // ---------------- Missing word ----------------
    if (ow && !uw) {
      result.push(
        <span key={k} className="error-red" data-tip="Missing word">
          ({ow}){" "}
        </span>
      );
      continue;
    }

    // ---------------- Extra word ----------------
    if (!ow && uw) {
      result.push(
        <span key={k} className="error-orange" data-tip="Extra word">
          {uw}{" "}
        </span>
      );
      continue;
    }

    // Both exist → spelling or punctuation or correct
    const baseO = stripPunct(ow).toLowerCase();
    const baseU = stripPunct(uw).toLowerCase();

    // ---------------- Spelling mistake ----------------
    if (baseO !== baseU) {
      result.push(
        <span key={k} className="error-red" data-tip="Spelling mistake">
          {uw}{" "}
        </span>
      );
      continue;
    }

    // ---------------- Punctuation difference ----------------
    const pO = getPunct(ow);
    const pU = getPunct(uw);

    if (pO !== pU) {
      result.push(
        <span key={k} className="error-blue" data-tip="Punctuation differs">
          {uw}{" "}
        </span>
      );
      continue;
    }

    // ---------------- Correct word ----------------
    result.push(<span key={k}>{uw} </span>);
  }

  return result;
}


  const generateCSV = () => {
    if (results.length === 0) return "";

    const rows = [
      ["Page", "Capital/Small", "Punctuation", "Missing/Extra Word", "Spelling", "Total % Error"]
    ];

    let totalErrorSum = 0;

    results.forEach((r, idx) => {
      const total = r.totalErrorPercentage || 0;
      totalErrorSum += total;
      rows.push([
        `Page ${idx + 1}`,
        r.capitalSmall,
        r.punctuation,
        r.missingExtraWord,
        r.spelling,
        total.toFixed(2)
      ]);
    });

    rows.push(["TOTAL % ERROR", "", "", "", "", "", totalErrorSum.toFixed(2)]);

    return "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
  };

 const handleConfirmDownload = async () => {
  if (!results || results.length === 0) return;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Typing Report");

  // Title
  sheet.mergeCells("A1:F1");
  const title = sheet.getCell("A1");
  title.value = "DATA CONVERSION REPORT";
  title.font = { size: 18, bold: true, color: { argb: "FFFFFFFF" } };
  title.alignment = { horizontal: "center", vertical: "middle" };
  title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4B6584" } };

  sheet.mergeCells("A2:F2");
  const dateCell = sheet.getCell("A2");
  dateCell.value = `Generated On: ${new Date().toLocaleString()}`;
  dateCell.font = { italic: true, size: 11, color: { argb: "333333" } };
  dateCell.alignment = { horizontal: "center" };

  sheet.addRow([]);


  const headerRow = sheet.addRow([
    "Page",
    "Capital/Small Errors",
    "Punctuation Errors",
    "Missing/Extra Words",
    "Spelling Errors",
    "Total % Error"
  ]);

  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "2C3E50" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  let totalErrorSum = 0;
  results.forEach((r, idx) => {
    const total = r.totalErrorPercentage || 0;
    totalErrorSum += total;

    const row = sheet.addRow([
      `Page ${r.pageNumber || idx + 1}`,
      r.capitalSmall,
      r.punctuation,
      r.missingExtraWord,
      r.spelling,
      total.toFixed(2)
    ]);

    const bgColor = idx % 2 === 0 ? "F8F9F9" : "FFFFFF";
    row.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin", color: { argb: "DDDDDD" } },
        left: { style: "thin", color: { argb: "DDDDDD" } },
        bottom: { style: "thin", color: { argb: "DDDDDD" } },
        right: { style: "thin", color: { argb: "DDDDDD" } },
      };
    });
    row.getCell(1).font = { bold: true };
  });

  sheet.addRow([]);

  const totalRow = sheet.addRow([
    "TOTAL % ERROR", "", "", "", "", totalErrorSum.toFixed(2)
  ]);
  totalRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "000000" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FAD7A0" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin", color: { argb: "000000" } },
      left: { style: "thin", color: { argb: "000000" } },
      bottom: { style: "thin", color: { argb: "000000" } },
      right: { style: "thin", color: { argb: "000000" } },
    };
  });
  sheet.mergeCells(`A${totalRow.number}:E${totalRow.number}`);

  sheet.columns = [
    { width: 18 },
    { width: 22 },
    { width: 22 },
    { width: 25 },
    { width: 20 },
    { width: 18 },
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `DATA_CONVERSION_Report_${new Date().toISOString().slice(0, 10)}.xlsx`
  );

  setShowModal(false);
};


  return (
    <div className="report-page">
      <p className='back' onClick={()=>navigate('/home')}>Back</p>
      <h2 className="report-title">Data Conversion Reports</h2>

      {results.length > 0 && (
        <div className="snippet-buttons">
          {results.map((r, idx) => (
            <button
              key={r._id}
              className={selectedIndex === idx ? "active-btn" : ""}
              onClick={() => setSelectedIndex(idx)}
            >
              Page {r.pageNumber}
            </button>
          ))}
          <button className="download-btn" onClick={() => setShowModal(true)}>Download Report</button>
        </div>
      )}

      {results.length === 0 && <p className="no-report">No reports available yet.</p>}

      {results[selectedIndex] && (
        <div key={results[selectedIndex]._id} className="report-block">
          <h3 className="snippet-title">
            Page {results[selectedIndex].pageNumber}
          </h3>

          <div className="snippet-flex">
            <div className="snippet-box original">
              <h4>Original Image</h4>
              <p>{results[selectedIndex].snippetId?.content}</p>
            </div>

            <div className="snippet-box user">
              <h4>Your Submitted Work</h4>
              <div className="highlighted-text">
                {highlightErrors(
                  results[selectedIndex].snippetId?.content,
                  results[selectedIndex].userText
                )}
              </div>
            </div>
          </div>

          <div className="error-summary">
            <h4>Errors Summary</h4>
            <ul>
              <li>
                <span className="color-box color-yellow"></span>
                Capital/Small: {results[selectedIndex].capitalSmall}
              </li>
              <li>
                <span className="color-box color-blue"></span>
                Punctuation: {results[selectedIndex].punctuation}
              </li>
              <li>
                <span className="color-box color-red"></span>
                Missing/Extra Word: {results[selectedIndex].missingExtraWord}
              </li>
              <li>
                <span className="color-box color-orange"></span>
                Spelling: {results[selectedIndex].spelling}
              </li>
              <li>
                <b>Total % Error: {results[selectedIndex].totalErrorPercentage?.toFixed(2)}%</b>
              </li>
            </ul>
          </div>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onRequestClose={() => setShowModal(false)}
        contentLabel="Report Preview"
        className="modal-content"
        overlayClassName="modal-overlay"
      >
        <h2>Data Conversion Report Preview</h2>
        <table className="modal-table">
          <thead>
            <tr>
              <th>Page</th>
              <th>Capital/Small</th>
              <th>Punctuation</th>
              <th>Missing/Extra Word</th>
              <th>Spelling</th>
              <th>Total % Error</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, idx) => (
              <tr key={r._id}>
                <td>Page {results[selectedIndex].pageNumber}</td>
                <td>{r.capitalSmall}</td>
                <td>{r.punctuation}</td>
                <td>{r.missingExtraWord}</td>
                <td>{r.spelling}</td>
                <td>{r.totalErrorPercentage?.toFixed(2)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan="5"><b>TOTAL % ERROR</b></td>
              <td><b>{results.reduce((sum, r) => sum + (r.totalErrorPercentage || 0), 0).toFixed(2)}</b></td>
            </tr>

          </tbody>
        </table>
        <div className="modal-buttons">
          <button onClick={handleConfirmDownload}>Download CSV</button>
          <button onClick={() => setShowModal(false)}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}

export default ReportComp;
