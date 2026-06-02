import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import "../Styles/result.css";
import { API_BASE } from "../../utils/api";
import { getStaffToken } from "../../utils/auth";

function ResultComp() {
  const location = useLocation();
  const routedUser = location.state?.user || null;

  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [userDetails, setUserDetails] = useState(routedUser);
  const [pageError, setPageError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [visibleTotal, setVisibleTotal] = useState(0);
  const [sortOrder, setSortOrder] = useState("default");
  const [editUserTextMode, setEditUserTextMode] = useState(false);
  const [userTextDraft, setUserTextDraft] = useState("");
  const [savingUserText, setSavingUserText] = useState(false);
  const [isDeclared, setIsDeclared] = useState(false);
  const [declaredAt, setDeclaredAt] = useState(null);
  const [declaring, setDeclaring] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);

  const [editValues, setEditValues] = useState({
    capitalSmall: 0,
    punctuation: 0,
    missingExtraWord: 0,
    spelling: 0,
    totalErrorPercentage: 0,
  });

  const token = getStaffToken(window.location.pathname);
  const userId =
    routedUser?._id || sessionStorage.getItem("adminResultUserId") || "";
  const snippetBase = `${API_BASE}/snippet`;
  const authBase = `${API_BASE}/auth`;

  useEffect(() => {
    if (routedUser?._id) {
      sessionStorage.setItem("adminResultUserId", routedUser._id);
      setUserDetails(routedUser);
      setIsDeclared(Boolean(routedUser.isDeclared));
      setDeclaredAt(routedUser.declaredAt || null);
    }
  }, [routedUser]);

  useEffect(() => {
    if (!userId || !token) {
      setPageError(
        "User details not found. Please open the report again from Manage Users."
      );
      return;
    }

    const fetchUserDetails = async () => {
      try {
        const res = await fetch(`${authBase}/admin/${userId}/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch user details");
        }

        setUserDetails(data);
        setIsDeclared(Boolean(data.isDeclared));
        setDeclaredAt(data.declaredAt || null);
        setPageError("");
      } catch (err) {
        setPageError(err.message || "Failed to load user details.");
      }
    };

    fetchUserDetails();
  }, [authBase, token, userId]);

 useEffect(() => {
  if (!userId || !token) return;

  const fetchResults = async () => {
    try {
      setLoadingResults(true);

      const fetchResultPage = async (page = 1) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: "100",
          sortBy: "pageNumber",
          sortOrder: "asc",
        });

        const res = await fetch(
          `${snippetBase}/results/${userId}?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to load user results");
        }

        return data;
      };

      const firstResponse = await fetchResultPage(1);

      const getRows = (data) =>
        Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data?.data?.results)
          ? data.data.results
          : [];

      const firstRows = getRows(firstResponse);

      const pagination =
        firstResponse?.pagination ||
        firstResponse?.data?.pagination ||
        null;

      const totalPages =
        pagination?.totalPages ||
        pagination?.pages ||
        Math.ceil((pagination?.total || firstRows.length) / (pagination?.limit || 100));

      let allRows = [...firstRows];

      if (pagination && totalPages > 1) {
        const remainingRequests = [];

        for (let page = 2; page <= totalPages; page += 1) {
          remainingRequests.push(fetchResultPage(page));
        }

        const remainingResponses = await Promise.all(remainingRequests);

        remainingResponses.forEach((response) => {
          allRows = [...allRows, ...getRows(response)];
        });
      }

      const cleaned = allRows.map((r) => {
        const content = (r.snippetId?.content || "")
          .replace(/\n{2,}/g, "\n\n")
          .replace(/([^\n])\n([^\n])/g, "$1 $2");

        return {
          ...r,
          snippetId: { ...r.snippetId, content },
          userText: (r.userText || "").replace(/\n+/g, "\n"),
        };
      });

      setResults(cleaned);
      setPageError("");

      setSelected((prevSelected) => {
        if (prevSelected?._id) {
          return (
            cleaned.find((item) => item._id === prevSelected._id) ||
            cleaned[0] ||
            null
          );
        }

        return cleaned[0] || null;
      });
    } catch (err) {
      setResults([]);
      setPageError(err.message || "Failed to load user results.");
    } finally {
      setLoadingResults(false);
    }
  };

  fetchResults();
}, [snippetBase, token, userId]);

  useEffect(() => {
    const total = results
      .filter((r) => r.visibleToUser)
      .reduce((sum, r) => sum + Number(r.totalErrorPercentage || 0), 0);

    setVisibleTotal(total);
  }, [results]);

  const sortedResults = useMemo(() => {
    if (sortOrder === "default") return results;

    return [...results].sort((a, b) => {
      const aErr = Number(a.totalErrorPercentage || 0);
      const bErr = Number(b.totalErrorPercentage || 0);

      return sortOrder === "asc" ? aErr - bErr : bErr - aErr;
    });
  }, [results, sortOrder]);

  const isInvalidPage = (r) => Number(r?.totalErrorPercentage || 0) > 100;

  const handleToggleVisibility = async (errorId) => {
    try {
      const res = await fetch(`${snippetBase}/toggle/${userId}/${errorId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to toggle visibility");
      }

      setResults((prev) =>
        prev.map((r) =>
          r._id === errorId ? { ...r, visibleToUser: data.visibleToUser } : r
        )
      );

      if (selected?._id === errorId) {
        setSelected((prev) => ({
          ...prev,
          visibleToUser: data.visibleToUser,
        }));
      }
    } catch (err) {
      alert(err.message || "Failed to toggle visibility");
    }
  };

  const handleDeclareResult = async () => {
    if (!userId) return;

    try {
      setDeclaring(true);

      const res = await fetch(`${authBase}/declare-result/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ declared: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to declare result");
      }

      setIsDeclared(Boolean(data.isDeclared));
      setDeclaredAt(data.declaredAt || null);

      setUserDetails((prev) =>
        prev
          ? {
              ...prev,
              isDeclared: Boolean(data.isDeclared),
              declaredAt: data.declaredAt || null,
            }
          : prev
      );

      alert("Result declared to user");
    } catch (err) {
      alert(err.message || "Failed to declare result");
    } finally {
      setDeclaring(false);
    }
  };

  const handleSnippetClick = (r) => {
    if (selected?._id === r._id) {
      setSelected(null);
      setEditMode(false);
      setEditUserTextMode(false);
      return;
    }

    setSelected(r);
    setEditMode(false);
    setEditUserTextMode(false);
  };

  const handleEditClick = (r) => {
    setSelected(r);
    setEditMode(true);
    setEditUserTextMode(false);

    setEditValues({
      capitalSmall: Number(r.capitalSmall || 0),
      punctuation: Number(r.punctuation || 0),
      missingExtraWord: Number(r.missingExtraWord || 0),
      spelling: Number(r.spelling || 0),
      totalErrorPercentage: Number(r.totalErrorPercentage || 0),
    });
  };

  const calculateTotal = (vals) =>
    Number(vals.capitalSmall || 0) * 0.9 +
    Number(vals.punctuation || 0) * 0.7 +
    Number(vals.missingExtraWord || 0) +
    Number(vals.spelling || 0);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    const newVals = { ...editValues, [name]: Number(value) };
    newVals.totalErrorPercentage = calculateTotal(newVals);
    setEditValues(newVals);
  };

  const handleCancelEdit = () => {
    setEditMode(false);

    if (selected) {
      const fresh = results.find((r) => r._id === selected._id);
      if (fresh) setSelected(fresh);
    }
  };

  const handleSaveEdits = async () => {
    if (!selected) return;

    try {
      const res = await fetch(
        `${snippetBase}/update/${userId}/${selected._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editValues),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save edits");
      }

      setResults((prev) =>
        prev.map((r) =>
          r._id === selected._id ? { ...r, ...data.updated } : r
        )
      );

      setSelected((prev) => ({
        ...prev,
        ...data.updated,
        snippetId: prev.snippetId,
        userText: prev.userText,
      }));

      setEditMode(false);
    } catch (err) {
      alert(err.message || "Failed to save edits");
    }
  };

  const startEditUserText = () => {
    if (!selected) return;

    setUserTextDraft(selected.userText || "");
    setEditUserTextMode(true);
    setEditMode(false);
  };

  const cancelEditUserText = () => {
    setEditUserTextMode(false);
    setUserTextDraft("");

    if (selected) {
      const fresh = results.find((r) => r._id === selected._id);
      if (fresh) setSelected(fresh);
    }
  };

  const saveUserText = async () => {
    if (!selected) return;

    try {
      setSavingUserText(true);

      const res = await fetch(
        `${snippetBase}/edit-text/${userId}/${selected._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userText: userTextDraft }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update user text");
      }

      setResults((prev) =>
        prev.map((r) =>
          r._id === selected._id ? { ...r, ...data.updated } : r
        )
      );

      setSelected((prev) => ({
        ...prev,
        ...data.updated,
        snippetId: prev.snippetId,
      }));

      setEditUserTextMode(false);
    } catch (err) {
      alert(err.message || "Failed to update user text");
    } finally {
      setSavingUserText(false);
    }
  };

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

    for (let i = 1; i <= m; i += 1) {
      for (let j = 1; j <= n; j += 1) {
        if (oNorm[i - 1] === uNorm[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    let i = m;
    let j = n;
    const align = [];

    while (i > 0 && j > 0) {
      if (oNorm[i - 1] === uNorm[j - 1]) {
        align.unshift({ ow: oWords[i - 1], uw: uWords[j - 1] });
        i -= 1;
        j -= 1;
      } else if (dp[i - 1][j] >= dp[i][j - 1]) {
        align.unshift({ ow: oWords[i - 1], uw: null });
        i -= 1;
      } else {
        align.unshift({ ow: null, uw: uWords[j - 1] });
        j -= 1;
      }
    }

    while (i > 0) {
      align.unshift({ ow: oWords[i - 1], uw: null });
      i -= 1;
    }

    while (j > 0) {
      align.unshift({ ow: null, uw: uWords[j - 1] });
      j -= 1;
    }

    const stripPunct = (s = "") =>
      typeof s === "string" ? s.replace(/[^\p{L}\p{N}]/gu, "") : "";

    const getPunct = (s = "") =>
      typeof s === "string" ? s.replace(/[\p{L}\p{N}]/gu, "") : "";

    return align.map(({ ow, uw }, index) => {
      if (ow && !uw) {
        return (
          <span key={index} className="error-red" data-tip="Missing word">
            ({ow}){" "}
          </span>
        );
      }

      if (!ow && uw) {
        return (
          <span key={index} className="error-red" data-tip="Extra word">
            {uw}{" "}
          </span>
        );
      }

      const baseOraw = stripPunct(ow);
      const baseUraw = stripPunct(uw);
      const baseOlower = baseOraw.toLowerCase();
      const baseUlower = baseUraw.toLowerCase();

      if (baseOlower === baseUlower && baseOraw !== baseUraw) {
        return (
          <span
            key={index}
            className="error-red"
            data-tip="Capital/Small mistake"
          >
            {uw}{" "}
          </span>
        );
      }

      if (baseOlower !== baseUlower) {
        return (
          <span key={index} className="error-red" data-tip="Spelling mistake">
            {uw}{" "}
          </span>
        );
      }

      if (getPunct(ow) !== getPunct(uw)) {
        return (
          <span
            key={index}
            className="error-blue"
            data-tip="Punctuation differs"
          >
            {uw}{" "}
          </span>
        );
      }

      return <span key={index}>{uw} </span>;
    });
  }

  return (
    <div className="result-page">
      <div className="user-info">
        <p>
          <b>Name:</b> {userDetails?.name || "-"}
        </p>

        <p>
          <b>Email:</b> {userDetails?.email || "-"}
        </p>

        <p>
          <b>Package:</b> {userDetails?.packages?.name || "-"}
        </p>

        <p>
          <b>Mobile:</b> {userDetails?.mobile || "-"}
        </p>

        <p style={{ marginTop: 10 }}>
          <b>Result Status:</b>{" "}
          {isDeclared ? (
            <span style={{ color: "green" }}>Declared</span>
          ) : (
            <span style={{ color: "red" }}>Not Declared</span>
          )}
        </p>

        {isDeclared && declaredAt ? (
          <p style={{ fontSize: 13, opacity: 0.8 }}>
            <b>Declared At:</b> {new Date(declaredAt).toLocaleString("en-IN")}
          </p>
        ) : null}
      </div>

      <h2 className="page-title">Data Conversion Results</h2>

      {pageError ? (
        <p className="placeholder" style={{ margin: "16px" }}>
          {pageError}
        </p>
      ) : null}

      <div className="result-layout">
        <div className="result-sidebar">
          <h3 className="visible-total">
            Total Error (Visible Pages): {visibleTotal.toFixed(2)}%
          </h3>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{
              width: "100%",
              padding: "6px",
              margin: "10px 0",
              background: "blue",
              borderRadius: "5px",
            }}
          >
            <option value="default">Default Page Order</option>
            <option value="desc">Highest to Lowest Error</option>
            <option value="asc">Lowest to Highest Error</option>
          </select>

          <div className="sidebar-scroll">
            {loadingResults ? (
              <p className="placeholder">Loading results...</p>
            ) : (
              sortedResults.map((r) => {
                const err = Number(r.totalErrorPercentage || 0);
                const invalid = isInvalidPage(r);

                return (
                  <div key={r._id} className="snippet-item-wrapper">
                    <p
                      className={`snippet-item ${
                        selected?._id === r._id ? "active" : ""
                      } ${invalid ? "invalid-page" : ""}`}
                      onClick={() => handleSnippetClick(r)}
                    >
                      Page {r.pageNumber} -{" "}
                      {invalid ? (
                        <>
                          <span className="invalid-badge">INVALID</span>
                          <span style={{ marginLeft: 8, opacity: 0.85 }}>
                            ({err.toFixed(2)}%)
                          </span>
                        </>
                      ) : (
                        <span>{err.toFixed(2)}%</span>
                      )}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginTop: "6px",
                      }}
                    >
                      <button
                        className={`toggle-btn ${
                          r.visibleToUser ? "visible" : "hidden"
                        }`}
                        onClick={() => handleToggleVisibility(r._id)}
                      >
                        {r.visibleToUser ? "Visible" : "Hidden"}
                      </button>

                      <button
                        className="edit-btn"
                        onClick={() => handleEditClick(r)}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={handleDeclareResult}
            disabled={declaring || isDeclared}
            style={{
              marginTop: 12,
              width: "100%",
              padding: "10px",
              borderRadius: 8,
              border: "none",
              background: isDeclared ? "#2ecc71" : "#0b5ed7",
              color: "#fff",
              cursor: declaring || isDeclared ? "not-allowed" : "pointer",
              opacity: declaring || isDeclared ? 0.8 : 1,
              fontWeight: 700,
            }}
          >
            {isDeclared
              ? "Result Already Declared"
              : declaring
              ? "Declaring..."
              : "Declare Result"}
          </button>
        </div>

        <div className="result-details">
          {selected ? (
            <>
              {editMode ? (
                <>
                  <h3 className="edit-title">Edit Errors for this Snippet</h3>

                  <div className="edit-form">
                    <label>
                      Capital/Small:
                      <input
                        type="number"
                        name="capitalSmall"
                        value={editValues.capitalSmall ?? 0}
                        onChange={handleEditChange}
                        min="0"
                      />
                    </label>

                    <label>
                      Punctuation:
                      <input
                        type="number"
                        name="punctuation"
                        value={editValues.punctuation ?? 0}
                        onChange={handleEditChange}
                        min="0"
                      />
                    </label>

                    <label>
                      Missing/Extra Word:
                      <input
                        type="number"
                        name="missingExtraWord"
                        value={editValues.missingExtraWord ?? 0}
                        onChange={handleEditChange}
                        min="0"
                      />
                    </label>

                    <label>
                      Spelling:
                      <input
                        type="number"
                        name="spelling"
                        value={editValues.spelling ?? 0}
                        onChange={handleEditChange}
                        min="0"
                      />
                    </label>

                    <p className="edit-total">
                      <b>Total % Error:</b>{" "}
                      {Number(editValues.totalErrorPercentage || 0).toFixed(2)}
                      %
                    </p>

                    <div className="edit-actions">
                      <button onClick={handleSaveEdits}>Save</button>
                      <button onClick={handleCancelEdit}>Cancel</button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-comparison">
                    <div className="text-box original-box">
                      <h4 className="snippet-title">Original</h4>

                      <div className="scrollable-text">
                        {selected.snippetId?.content || <i>No text</i>}
                      </div>
                    </div>

                    <div className="text-box user-box">
                      <h4
                        className="snippet-title"
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                        }}
                      >
                        User Text
                        <button className="edit-btn" onClick={startEditUserText}>
                          Edit User Text
                        </button>
                      </h4>

                      <div className="scrollable-text">
                        {editUserTextMode ? (
                          <div>
                            <textarea
                              value={userTextDraft}
                              onChange={(e) =>
                                setUserTextDraft(e.target.value)
                              }
                              style={{
                                width: "100%",
                                minHeight: 180,
                                padding: 10,
                                borderRadius: 8,
                                border: "1px solid #ccc",
                              }}
                            />

                            <div
                              style={{
                                display: "flex",
                                gap: 10,
                                marginTop: 10,
                              }}
                            >
                              <button
                                onClick={saveUserText}
                                disabled={savingUserText}
                              >
                                {savingUserText ? "Saving..." : "Save"}
                              </button>

                              <button
                                onClick={cancelEditUserText}
                                disabled={savingUserText}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : Number(selected.capitalSmall) > 0 ||
                          Number(selected.punctuation) > 0 ||
                          Number(selected.missingExtraWord) > 0 ||
                          Number(selected.spelling) > 0 ? (
                          highlightErrors(
                            selected.snippetId?.content,
                            selected.userText
                          )
                        ) : (
                          <span>{selected.userText}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <h4 className="error-heading">Errors</h4>

                  <ul className="error-list">
                    <li>
                      <span className="color-box color-red"></span>
                      Capital/Small: {selected.capitalSmall}
                    </li>

                    <li>
                      <span className="color-box color-blue"></span>
                      Punctuation: {selected.punctuation}
                    </li>

                    <li>
                      <span className="color-box color-red"></span>
                      Missing/Extra Word: {selected.missingExtraWord}
                    </li>

                    <li>
                      <span className="color-box color-red"></span>
                      Spelling: {selected.spelling}
                    </li>

                    <li style={{ marginTop: "10px" }}>
                      <b>Total % Error:</b>{" "}
                      {Number(selected.totalErrorPercentage || 0).toFixed(2)}%
                    </li>
                  </ul>
                </>
              )}
            </>
          ) : (
            <p className="placeholder">Click a snippet to view details</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResultComp;