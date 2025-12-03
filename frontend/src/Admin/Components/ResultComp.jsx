import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../Styles/result.css';

function ResultComp() {
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [visibleTotal, setVisibleTotal] = useState(0);
  const [editValues, setEditValues] = useState({
    capitalSmall: 0,
    punctuation: 0,
    missingExtraWord: 0,
    spelling: 0,
    totalErrorPercentage: 0
  });

  const location = useLocation();
  const user = location.state?.user;
  const userId = user?._id || localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) return;

    fetch(`https://api.freelancing-project.com/api/snippet/results/${userId}`)
      .then(res => res.json())
      .then(data => {
        const cleaned = data.map(r => {
        let content = r.snippetId?.content || "";
        let userText = r.userText || "";

        content = content
          .replace(/\n{2,}/g, "\n\n")
          .replace(/([^\n])\n([^\n])/g, "$1 $2");

        userText = userText.replace(/\n+/g, "\n");

        return {
          ...r,
          snippetId: { ...r.snippetId, content },
          userText,
        };
      });

      setResults(cleaned);
    })

      .catch(err => console.error(err));
  }, [userId]);


  useEffect(() => {
    const total = results
      .filter(r => r.visibleToUser)
      .reduce((sum, r) => sum + Number(r.totalErrorPercentage || 0), 0);
    setVisibleTotal(total);
  }, [results]);

  const handleToggleVisibility = async (errorId) => {
    try {
      const res = await fetch(`https://api.freelancing-project.com/api/snippet/toggle/${userId}/${errorId}`, {
        method: "PATCH",
      });
      const data = await res.json();

      if (res.ok) {
        setResults(prev =>
          prev.map(r =>
            r._id === errorId ? { ...r, visibleToUser: data.visibleToUser } : r
          )
        );
        if (selected && selected._id === errorId) {
          setSelected(prev => ({ ...prev, visibleToUser: data.visibleToUser }));
        }
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSnippetClick = (r) => {
    if (selected?._id === r._id) {
      setSelected(null);
      setEditMode(false);
    } else {
      setSelected(r);
      setEditMode(false);
    }
  };

  const handleEditClick = (r) => {
    setSelected(r);
    setEditMode(true);
    setEditValues({
      capitalSmall: Number(r.capitalSmall || 0),
      punctuation: Number(r.punctuation || 0),
      missingExtraWord: Number(r.missingExtraWord || 0),
      spelling: Number(r.spelling || 0),
      totalErrorPercentage: Number(r.totalErrorPercentage || 0),
    });
  };

  const calculateTotal = (vals) => {
    const cs = Number(vals.capitalSmall || 0);
    const p = Number(vals.punctuation || 0);
    const mw = Number(vals.missingExtraWord || 0);
    const s = Number(vals.spelling || 0);
    return (cs * 0.9) + (p * 0.7) + (mw * 1) + (s * 1);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    const newVals = { ...editValues, [name]: Number(value) };
    const newTotal = calculateTotal(newVals);
    newVals.totalErrorPercentage = newTotal;
    setEditValues(newVals);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    if (selected) {
      const fresh = results.find(r => r._id === selected._id);
      if (fresh) setSelected(fresh);
    }
  };

  const handleSaveEdits = async () => {
    if (!selected) return;
    const errorId = selected._id;

    const payload = {
      capitalSmall: editValues.capitalSmall,
      punctuation: editValues.punctuation,
      missingExtraWord: editValues.missingExtraWord,
      spelling: editValues.spelling,
      totalErrorPercentage: editValues.totalErrorPercentage,
    };

    try {        
      const res = await fetch(`https://api.freelancing-project.com/api/snippet/update/${userId}/${errorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to update");
        return;
      }

      setResults(prev =>
        prev.map(r =>
          r._id === errorId ? { ...r, ...data.updated } : r
        )
      );

      setSelected(prev => ({
        ...prev,
        ...data.updated,
        snippetId: prev.snippetId,
        userText: prev.userText,
      }));

      setEditMode(false);
    } catch (err) {
      console.error(err);
      alert("Error saving edits, check console.");
    }
  };

  function highlightErrors(original, userText) {
    if (!original || !userText) {
      return <span className="no-text">No text available to compare.</span>;
    }

    const origWords = original.split(/\s+/).filter(Boolean);
    const userWords = userText.split(/\s+/).filter(Boolean);
    const stripPunct = s => s.replace(/[^A-Za-z0-9]/g, "");

    function lcsIndices(a, b) {
      const n = a.length, m = b.length;
      const dp = Array(n + 1).fill(null).map(() => Array(m + 1).fill(0));
      for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
          if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
          else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
      let i = n, j = m, pairs = [];
      while (i > 0 && j > 0) {
        if (a[i - 1] === b[j - 1]) {
          pairs.unshift([i - 1, j - 1]);
          i--; j--;
        } else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
        else j--;
      }
      return pairs;
    }

    const origNorm = origWords.map(w => stripPunct(w).toLowerCase());
    const userNorm = userWords.map(w => stripPunct(w).toLowerCase());
    const matchedPairs = lcsIndices(origNorm, userNorm);

    let res = [];
    let oPrev = -1, uPrev = -1;

    for (let k = 0; k <= matchedPairs.length; k++) {
      const [oNext, uNext] = matchedPairs[k] || [origWords.length, userWords.length];
      const origSeg = origWords.slice(oPrev + 1, oNext);
      const userSeg = userWords.slice(uPrev + 1, uNext);

      for (let uw of userSeg) {
        res.push(<span key={"extra-" + res.length} className="error-red">{uw} </span>);
      }
      for (let ow of origSeg.slice(userSeg.length)) {
        res.push(<span key={"miss-" + res.length} className="error-red">(missing:{ow}) </span>);
      }

      if (oNext < origWords.length && uNext < userWords.length) {
        const ow = origWords[oNext];
        const uw = userWords[uNext];
        if (ow === uw) {
          res.push(<span key={"ok-" + res.length}>{uw} </span>);
        } else if (ow.toLowerCase() === uw.toLowerCase()) {
          res.push(<span key={"cap-" + res.length} className="error-orange">{uw} </span>);
        } else if (stripPunct(ow).toLowerCase() === stripPunct(uw).toLowerCase()) {
          res.push(<span key={"punc-" + res.length} className="error-blue">{uw} </span>);
        } else {
          res.push(<span key={"spell-" + res.length} className="error-red">{uw} </span>);
        }
      }

      oPrev = oNext;
      uPrev = uNext;
    }

    return res;
  }

  return (
    <div className="result-page">
      <div className="user-info">
        <p><b>Name:</b> {user?.name}</p>
        <p><b>Email:</b> {user?.email}</p>
        <p><b>Package:</b> {JSON.stringify(user?.packages?.name)}</p>
        <p><b>Mobile:</b> {user?.mobile}</p>
      </div>

      <h2 className="page-title">Data Conversion Results</h2>

      <div className="result-layout">
        <div className="result-sidebar">
          <h3 className="visible-total">
            Total Error (Visible Pages): {visibleTotal.toFixed(2)}%
          </h3>
          <div className="sidebar-scroll">
          {results.map((r, idx) => (
            <div key={r._id || idx} className="snippet-item-wrapper">
              <p
                className={`snippet-item ${selected?._id === r._id ? "active" : ""}`}
                onClick={() => handleSnippetClick(r)}
              >
                Page {idx + 1} – {
                  r.userText?.trim().length === 0 || Number(r.totalErrorPercentage) > 150
                    ? `${Number(r.totalErrorPercentage || 0).toFixed(2)}% Invalid❗`
                    : `${Number(r.totalErrorPercentage || 0).toFixed(2)}%`
                }
              </p>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  className={`toggle-btn ${r.visibleToUser ? "visible" : "hidden"}`}
                  onClick={() => handleToggleVisibility(r._id)}
                >
                  {r.visibleToUser ? "Visible ✅" : "Hidden ❌"}
                </button>
                <button
                  className="edit-btn"
                  onClick={() => handleEditClick(r)}
                >
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
                      <b>Total % Error:</b> {editValues.totalErrorPercentage.toFixed(2)}%
                    </p>

                    <div className="edit-actions">
                      <button onClick={handleSaveEdits}>💾 Save</button>
                      <button onClick={handleCancelEdit}>❌ Cancel</button>
                    </div>
                  </div>
                </>
              )}

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
                      <h4 className="snippet-title">User Text</h4>
                      <div className="scrollable-text">
                        {(
                          Number(selected.capitalSmall) > 0 ||
                          Number(selected.punctuation) > 0 ||
                          Number(selected.missingExtraWord) > 0 ||
                          Number(selected.spelling) > 0
                        ) ? (
                          highlightErrors(selected.snippetId?.content, selected.userText)
                        ) : (
                          <span>{selected.userText}</span>
                        )}
                      </div>
                    </div>

                  </div>

                  <h4 className="error-heading">Errors</h4>
                  <ul className="error-list">
                    <li>Capital/Small: {selected.capitalSmall}</li>
                    <li>Punctuation: {selected.punctuation}</li>
                    <li>Missing/Extra Word: {selected.missingExtraWord}</li>
                    <li>Spelling: {selected.spelling}</li>
                    <li>
                      <b>Total % Error:</b> {Number(selected.totalErrorPercentage || 0).toFixed(2)}%
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
