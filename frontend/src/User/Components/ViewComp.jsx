import React, { useEffect, useState } from "react";
import "../Styles/reports.css";
import { useNavigate } from "react-router-dom";
import http from "../../utils/http";
import { getStoredUserId, getUserToken } from "../../utils/auth";
import "../Styles/cp.css"; // For shared styles like .back

function ViewComp() {
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const userId = getStoredUserId();
  const navigate = useNavigate();

  useEffect(() => {
    const token = getUserToken();

    if (!token || !userId) {
      setError("Please login again.");
      setResults([]);
      return;
    }

    const fetchUserSnippets = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await http.get(`/snippet/user/${userId}`, {
          params: {
            limit: 100000,
            sortBy: "pageNumber",
            sortOrder: "asc",
          },
        });

        const responseData = res.data;

        const rows = Array.isArray(responseData)
          ? responseData
          : Array.isArray(responseData?.data)
          ? responseData.data
          : Array.isArray(responseData?.results)
          ? responseData.results
          : Array.isArray(responseData?.data?.results)
          ? responseData.data.results
          : [];

        setResults(rows);
      } catch (err) {
        setError(
          err?.response?.data?.message || "Failed to fetch submitted pages."
        );
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserSnippets();
  }, [userId]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  return (
    <div className="report-page">
      <p className="back-btn" onClick={() => navigate("/home")}>
        <span>←</span> Back
      </p>

      <h2 className="report-title">All Submitted Pages</h2>

      {error ? <p className="no-report">{error}</p> : null}

      {loading ? (
        <p className="no-report">Loading submitted pages...</p>
      ) : !error && results.length > 0 ? (
        <>
          <div className="snippet-buttons">
            {results.map((r, idx) => (
              <button
                key={r._id}
                className={selectedIndex === idx ? "active-btn" : ""}
                onClick={() => setSelectedIndex(idx)}
              >
                Page {r.pageNumber || idx + 1}
              </button>
            ))}
          </div>

          <div className="report-block">
            <h3 className="snippet-title">
              Page {results[selectedIndex]?.pageNumber || selectedIndex + 1}
            </h3>

            <div className="snippet-flex">
              <div className="snippet-box original">
                <h4>Original Image</h4>
                <p>
                  {results[selectedIndex]?.snippetId?.content ||
                    "No original text found."}
                </p>
              </div>

              <div className="snippet-box user">
                <h4>Your Submitted Work</h4>
                <p>
                  {results[selectedIndex]?.userText ||
                    "No user submission found."}
                </p>
              </div>
            </div>
          </div>
        </>
      ) : !error ? (
        <p className="no-report">No Submitted Work Found.</p>
      ) : null}
    </div>
  );
}

export default ViewComp;