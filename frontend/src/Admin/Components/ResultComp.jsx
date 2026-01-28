import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import "../Styles/result.css";

function ResultComp() {
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);

  const [editMode, setEditMode] = useState(false);
  const [visibleTotal, setVisibleTotal] = useState(0);
  const [sortOrder, setSortOrder] = useState("default");

  const [editValues, setEditValues] = useState({
    capitalSmall: 0,
    punctuation: 0,
    missingExtraWord: 0,
    spelling: 0,
    totalErrorPercentage: 0,
  });

  const [editUserTextMode, setEditUserTextMode] = useState(false);
  const [userTextDraft, setUserTextDraft] = useState("");
  const [savingUserText, setSavingUserText] = useState(false);

  const location = useLocation();
  const user = location.state?.user;
  const userId = user?._id || localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) return;

    fetch(`https://api.freelancing-project.com/api/snippet/results/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        const cleaned = (Array.isArray(data) ? data : []).map((r, index) => {
          let content = r.snippetId?.content || "";
          let userText = r.userText || "";

          content = content
            .replace(/\n{2,}/g, "\n\n")
            .replace(/([^\n])\n([^\n])/g, "$1 $2");

          userText = userText.replace(/\n+/g, "\n");

          return {
            ...r,
            // ✅ do not override DB pageNumber
            pageNumber: r.pageNumber ?? index + 1,
            snippetId: { ...r.snippetId, content },
            userText,
          };
        });

        setResults(cleaned);

        // refresh selected from latest list
        if (selected?._id) {
          const fresh = cleaned.find((x) => x._id === selected._id);
          if (fresh) setSelected(fresh);
        }
      })
      .catch((err) => console.error(err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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

  const handleToggleVisibility = async (errorId) => {
    try {
      const res = await fetch(
        `https://api.freelancing-project.com/api/snippet/toggle/${userId}/${errorId}`,
        { method: "PATCH" }
      );
      const data = await res.json();

      if (res.ok) {
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
      } else {
        alert(data.message || "Failed to toggle visibility");
      }
    } catch (err) {
      console.error(err);
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

  // ✅ match backend weights (capital=0.7, punctuation=0.9)
  const calculateTotal = (vals) => {
    return (
      Number(vals.capitalSmall || 0) * 0.7 +
      Number(vals.punctuation || 0) * 0.9 +
      Number(vals.missingExtraWord || 0) +
      Number(vals.spelling || 0)
    );
  };

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
        `https://api.freelancing-project.com/api/snippet/update/${userId}/${selected._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editValues),
        }
      );

      const data = await res.json();
      if (!res.ok) return alert(data.message || "Failed");

      setResults((prev) =>
        prev.map((r) => (r._id === selected._id ? { ...r, ...data.updated } : r))
      );

      setSelected((prev) => ({
        ...prev,
        ...data.updated,
        snippetId: prev.snippetId,
        userText: prev.userText,
      }));

      setEditMode(false);
    } catch (err) {
      console.error(err);
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
        `https://api.freelancing-project.com/api/snippet/edit-text/${userId}/${selected._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userText: userTextDraft }),
        }
      );

      const data = await res.json();
      if (!res.ok) return alert(data.message || "Failed");

      // update list
      setResults((prev) =>
        prev.map((r) => (r._id === selected._id ? { ...r, ...data.updated } : r))
      );

      // update selected
      setSelected((prev) => ({
        ...prev,
        ...data.updated,
        snippetId: prev.snippetId, // keep populated snippet
      }));

      setEditUserTextMode(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update user text");
    } finally {
      setSavingUserText(false);
    }
  };

  // ✅ helper: render backend tokens (single source of truth)
  const renderDisplayTokens = (tokens = []) => {
    return tokens.map((t, i) =>
      t?.cls ? (
        <span key={i} className={t.cls} data-tip={t.tip}>
          {t.text}{" "}
        </span>
      ) : (
        <span key={i}>{t?.text} </span>
      )
    );
  };

  return (
    <div className="result-page">
      <div className="user-info">
        <p>
          <b>Name:</b> {user?.name}
        </p>
        <p>
          <b>Email:</b> {user?.email}
        </p>
        <p>
          <b>Package:</b> {user?.packages?.name}
        </p>
        <p>
          <b>Mobile:</b> {user?.mobile}
        </p>
      </div>

      <h2 className="page-title">Data Conversion Results</h2>

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
            <option value="desc">Highest → Lowest Error</option>
            <option value="asc">Lowest → Highest Error</option>
          </select>

          <div className="sidebar-scroll">
            {sortedResults.map((r) => (
              <div key={r._id} className="snippet-item-wrapper">
                <p
                  className={`snippet-item ${selected?._id === r._id ? "active" : ""}`}
                  onClick={() => handleSnippetClick(r)}
                >
                  Page {r.pageNumber} – {Number(r.totalErrorPercentage || 0).toFixed(2)}%
                </p>

                <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                  <button
                    className={`toggle-btn ${r.visibleToUser ? "visible" : "hidden"}`}
                    onClick={() => handleToggleVisibility(r._id)}
                  >
                    {r.visibleToUser ? "Visible ✅" : "Hidden ❌"}
                  </button>

                  <button className="edit-btn" onClick={() => handleEditClick(r)}>
                    Edit ✏️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="result-details">
          {selected ? (
            <>
              {/* ✅ Edit numeric errors */}
              {editMode && (
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
                      {Number(editValues.totalErrorPercentage || 0).toFixed(2)}%
                    </p>

                    <div className="edit-actions">
                      <button onClick={handleSaveEdits}>💾 Save</button>
                      <button onClick={handleCancelEdit}>❌ Cancel</button>
                    </div>
                  </div>
                </>
              )}

              {/* ✅ Normal view */}
              {!editMode && (
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
                          Edit User Text ✏️
                        </button>
                      </h4>

                      <div className="scrollable-text">
                        {editUserTextMode ? (
                          <div>
                            <textarea
                              value={userTextDraft}
                              onChange={(e) => setUserTextDraft(e.target.value)}
                              style={{
                                width: "100%",
                                minHeight: 180,
                                padding: 10,
                                borderRadius: 8,
                                border: "1px solid #ccc",
                              }}
                            />

                            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                              <button onClick={saveUserText} disabled={savingUserText}>
                                {savingUserText ? "Saving..." : "Save ✅"}
                              </button>

                              <button onClick={cancelEditUserText} disabled={savingUserText}>
                                Cancel ❌
                              </button>
                            </div>
                          </div>
                        ) : selected.displayTokens?.length ? (
                          renderDisplayTokens(selected.displayTokens)
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
