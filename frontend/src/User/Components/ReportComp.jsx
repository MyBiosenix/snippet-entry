import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import "../Styles/reports.css";
import { useNavigate } from "react-router-dom";

Modal.setAppElement("#root");

/* ------------------- Status Card (same concept as ResultComp) ------------------- */
function StatusCard({ title, message, tone = "neutral", onBack }) {
  const styles =
    tone === "warning"
      ? {
          border: "1px solid #fecaca",
          background: "#fff7ed",
          heading: "#7c2d12",
        }
      : {
          border: "1px solid #e5e7eb",
          background: "#fff",
          heading: "#111827",
        };

  return (
    <div className="report-page">
      <p className="back" onClick={onBack}>
        Back
      </p>

      <div
        style={{
          maxWidth: 900,
          margin: "30px auto",
          padding: 20,
          borderRadius: 12,
          border: styles.border,
          background: styles.background,
        }}
      >
        <h2 style={{ margin: 0, color: styles.heading }}>{title}</h2>
        <p style={{ marginTop: 10, color: "#374151", lineHeight: 1.6 }}>
          {message}
        </p>
      </div>
    </div>
  );
}

function ReportComp() {
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [packages, setPackages] = useState("");
  const [mobile, setMobile] = useState("");

  // ✅ gating states
  const [checking, setChecking] = useState(true);
  const [isDeclared, setIsDeclared] = useState(false);
  const [isComplete, setIsComplete] = useState(true);

  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  // ✅ change base URL here only
  const API_BASE = "https://api.freelancing-project.com/api";
  const AUTH_BASE = `${API_BASE}/auth`;
  const SNIPPET_BASE = `${API_BASE}/snippet`;

  // ✅ load user from localStorage ONCE
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    if (userData?.name) {
      setUsername(userData.name);
      setEmail(userData.email);
      setMobile(userData.mobile);
      setPackages(userData.package || userData?.packages?.name || "");
    }
  }, []);

  // ✅ check declared + complete status first
  useEffect(() => {
    if (!userId) {
      setChecking(false);
      return;
    }

    setChecking(true);

    fetch(`${AUTH_BASE}/${userId}/user`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((data) => {
        // ✅ support both naming styles
        const declared = !!(data?.isDeclared ?? data?.reportDeclared);
        setIsDeclared(declared);

        // ✅ if backend sends isComplete false -> block report
        setIsComplete(data?.isComplete === false ? false : true);
      })
      .catch(() => {
        setIsDeclared(false);
        setIsComplete(true);
      })
      .finally(() => setChecking(false));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ✅ fetch report only if declared + complete
  useEffect(() => {
    if (!userId || !isDeclared || !isComplete) return;

    fetch(`${SNIPPET_BASE}/user-visible/${userId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setResults(list);
      })
      .catch((err) => console.error(err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isDeclared, isComplete]);

  // ✅ keep selectedIndex safe when results change
  useEffect(() => {
    if (selectedIndex >= results.length) setSelectedIndex(0);
  }, [results, selectedIndex]);

  function highlightErrors(original = "", userText = "") {
    const normalize = (s = "") =>
      s
        .normalize("NFKC")
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

    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (oNorm[i - 1] === uNorm[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
        else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }

    let i = m,
      j = n;
    const align = [];

    while (i > 0 && j > 0) {
      if (oNorm[i - 1] === uNorm[j - 1]) {
        align.unshift({ ow: oWords[i - 1], uw: uWords[j - 1] });
        i--;
        j--;
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

    const result = [];

    for (let k = 0; k < align.length; k++) {
      const { ow, uw } = align[k];

      if (ow && !uw) {
        result.push(
          <span key={k} className="error-red" data-tip="Missing word">
            ({ow}){" "}
          </span>
        );
        continue;
      }

      if (!ow && uw) {
        result.push(
          <span key={k} className="error-orange" data-tip="Extra word">
            {uw}{" "}
          </span>
        );
        continue;
      }

      const baseO = stripPunct(ow).toLowerCase();
      const baseU = stripPunct(uw).toLowerCase();

      if (baseO !== baseU) {
        result.push(
          <span key={k} className="error-red" data-tip="Spelling mistake">
            {uw}{" "}
          </span>
        );
        continue;
      }

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

      result.push(<span key={k}>{uw} </span>);
    }

    return result;
  }

  const handleConfirmDownload = async () => {
    if (!results || results.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Typing Report");

    sheet.mergeCells("A1:F1");
    const title = sheet.getCell("A1");
    title.value = "DATA CONVERSION REPORT";
    title.font = { size: 18, bold: true, color: { argb: "FFFFFFFF" } };
    title.alignment = { horizontal: "center", vertical: "middle" };
    title.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "4B6584" },
    };

    sheet.mergeCells("A2:F2");
    const dateCell = sheet.getCell("A2");
    dateCell.value = `Generated On: ${new Date().toLocaleString("en-IN")}`;
    dateCell.font = { italic: true, size: 11, color: { argb: "333333" } };
    dateCell.alignment = { horizontal: "center" };

    sheet.addRow([]);

    const headerRow = sheet.addRow([
      "Page",
      "Capital/Small Errors",
      "Punctuation Errors",
      "Missing/Extra Words",
      "Spelling Errors",
      "Total % Error",
    ]);

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "2C3E50" },
      };
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
      const total = Number(r.totalErrorPercentage || 0);
      totalErrorSum += total;

      const row = sheet.addRow([
        `Page ${r.pageNumber || idx + 1}`,
        r.capitalSmall,
        r.punctuation,
        r.missingExtraWord,
        r.spelling,
        total.toFixed(2),
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
      "TOTAL % ERROR",
      "",
      "",
      "",
      "",
      totalErrorSum.toFixed(2),
    ]);

    totalRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "000000" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FAD7A0" },
      };
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
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `DATA_CONVERSION_Report_${new Date().toISOString().slice(0, 10)}.xlsx`
    );

    setShowModal(false);
  };

  /* ------------------- GATED UI ------------------- */
  if (checking) {
    return (
      <div className="report-page">
        <p className="back" onClick={() => navigate("/home")}>
          Back
        </p>
        <p style={{ padding: 20 }}>Checking report status...</p>
      </div>
    );
  }

  if (!isDeclared) {
    return (
      <StatusCard
        tone="neutral"
        title="Report Not Available"
        message="Your report is not available yet because the result has not been declared."
        onBack={() => navigate("/home")}
      />
    );
  }

  if (!isComplete) {
    return (
      <StatusCard
        tone="warning"
        title="Report Incomplete"
        message="Your report is currently unavailable because your assigned work is marked as incomplete. Please complete the remaining forms to generate the final report.

If you believe this is incorrect, please contact your administrator."
        onBack={() => navigate("/home")}
      />
    );
  }

  /* ------------------- NORMAL REPORT UI ------------------- */
  return (
    <div className="report-page">
      <p className="back" onClick={() => navigate("/home")}>
        Back
      </p>

      <div className="userdets">
        <p>
          <b>Name:</b> {username}{" "}
        </p>
        <p>
          <b>Email:</b> {email}{" "}
        </p>
        <p>
          <b>Package:</b> {packages}{" "}
        </p>
        <p>
          <b>Mobile:</b> {mobile}{" "}
        </p>
      </div>

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
          <button className="download-btn" onClick={() => setShowModal(true)}>
            Download Report
          </button>
        </div>
      )}

      {results.length === 0 && (
        <p className="no-report">Result declared, but no visible pages available yet.</p>
      )}

      {results[selectedIndex] && (
        <div key={results[selectedIndex]._id} className="report-block">
          <h3 className="snippet-title">Page {results[selectedIndex].pageNumber}</h3>

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
                <span className="color-box color-red"></span>
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
                <span className="color-box color-red"></span>
                Spelling: {results[selectedIndex].spelling}
              </li>
              <li>
                <b>
                  Total % Error:{" "}
                  {Number(results[selectedIndex].totalErrorPercentage || 0).toFixed(2)}%
                </b>
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
            {results.map((r) => (
              <tr key={r._id}>
                <td>Page {r.pageNumber}</td>
                <td>{r.capitalSmall}</td>
                <td>{r.punctuation}</td>
                <td>{r.missingExtraWord}</td>
                <td>{r.spelling}</td>
                <td>{Number(r.totalErrorPercentage || 0).toFixed(2)}</td>
              </tr>
            ))}

            <tr>
              <td colSpan="5">
                <b>TOTAL % ERROR</b>
              </td>
              <td>
                <b>
                  {results
                    .reduce((sum, r) => sum + Number(r.totalErrorPercentage || 0), 0)
                    .toFixed(2)}
                </b>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="modal-buttons">
          <button onClick={handleConfirmDownload}>Download Excel</button>
          <button onClick={() => setShowModal(false)}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}

export default ReportComp;
