import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import "../Styles/work.css";
import axios from "../utils/axiosInstance"; // ✅ same as Dashboard

function makeCaptcha(len = 5) {
  const chars = "abcdefghijklmnopqrstuvwxysABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
function normCaptcha(v) {
  return String(v || "").trim();
}

function Work() {
  const [snippet, setSnippet] = useState(null);
  const [snippetNumber, setSnippetNumber] = useState(null);
  const [totalSnippets, setTotalSnippets] = useState(null);
  const [userText, setUserText] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);

  const [captchaText, setCaptchaText] = useState(() => makeCaptcha(5));
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState("");

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  // ✅ validity lock states
  const [validTill, setValidTill] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [expiryChecked, setExpiryChecked] = useState(false);

  // ✅ input security refs (mobile-safe)
  const lastInputTypeRef = useRef("");
  const prevTextRef = useRef("");
  const isComposingRef = useRef(false);

  const refreshCaptcha = useCallback(() => {
    setCaptchaText(makeCaptcha(5));
    setCaptchaInput("");
    setCaptchaError("");
  }, []);

  // ✅ fetch validTill from dash-stats (same as Dashboard)
  useEffect(() => {
    const fetchValidity = async () => {
      try {
        if (!userId || !token) {
          setExpiryChecked(true);
          return;
        }

        const res = await axios.get(`/auth/${userId}/dash-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const vt = res.data?.validTill || null;
        setValidTill(vt);
      } catch (err) {
        // Don't clear localStorage here, just mark checked
        console.error("Error fetching validity:", err?.message || err);
      } finally {
        setExpiryChecked(true);
      }
    };

    fetchValidity();
  }, [userId, token]);

  // ✅ compute expired (valid till end of expiry day)
  useEffect(() => {
    if (!validTill) {
      setIsExpired(false);
      return;
    }

    const compute = () => {
      const expiry = new Date(validTill);
      expiry.setHours(23, 59, 59, 999);
      setIsExpired(expiry.getTime() <= Date.now());
    };

    compute();
    const t = setInterval(compute, 1000);
    return () => clearInterval(t);
  }, [validTill]);

  const fetchNextSnippet = async () => {
    try {
      const res = await fetch(
        `https://api.freelancing-project.com/api/snippet/next/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json();

      if (data.done) {
        setIsCompleted(true);
        setSnippet({ title: "Work Completed!", content: "Work Completed!" });
        setSnippetNumber(null);
        setTotalSnippets(null);
        setUserText("");
        prevTextRef.current = "";
        refreshCaptcha();
        return;
      }

      setSnippet(data.snippet);
      setSnippetNumber(data.snippetNumber);
      setTotalSnippets(data.totalSnippets);

      setUserText("");
      prevTextRef.current = "";
      setIsCompleted(false);
      refreshCaptcha();
    } catch (err) {
      console.error("Error fetching snippet:", err);
    }
  };

  useEffect(() => {
    // ✅ wait until we know expiry status
    if (!expiryChecked) return;

    // ✅ if expired, don't fetch work at all
    if (isExpired) {
      setSnippet({ title: "Plan Expired", content: "Your plan has expired." });
      setSnippetNumber(null);
      setTotalSnippets(null);
      setUserText("");
      prevTextRef.current = "";
      return;
    }

    fetchNextSnippet();

    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      if (
        (e.ctrlKey && (e.key === "c" || e.key === "v" || e.key === "x" || e.key === "a")) ||
        (e.metaKey && (e.key === "c" || e.key === "v" || e.key === "x" || e.key === "a"))
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiryChecked, isExpired]);

  // ✅ STRICT block: paste/clipboard suggestion/text replacement
  const handleBeforeInput = (e) => {
    if (isCompleted || isExpired) return;

    const ne = e.nativeEvent;
    const t = ne?.inputType || "";
    const data = ne?.data ?? "";
    lastInputTypeRef.current = t;

    if (t.startsWith("delete") || t === "historyUndo" || t === "historyRedo") return;
    if (isComposingRef.current) return;

    const blockedTypes = new Set([
      "insertFromPaste",
      "insertFromDrop",
      "insertFromYank",
      "insertReplacementText",
    ]);

    if (blockedTypes.has(t)) {
      e.preventDefault();
      setCaptchaError("Pasting / keyboard suggestion fill is not allowed.");
      return;
    }

    if (typeof data === "string" && data.length > 1) {
      e.preventDefault();
      setCaptchaError("Pasting / keyboard suggestion fill is not allowed.");
      return;
    }
  };

  const handleChange = (e) => {
    if (isExpired) return;

    const next = e.target.value;
    const prev = prevTextRef.current;
    const t = lastInputTypeRef.current;

    if (!isComposingRef.current) {
      const delta = next.length - prev.length;

      const suspiciousBulk =
        delta > 1 &&
        (t === "insertText" || t === "insertReplacementText" || t === "insertFromPaste" || t === "");

      if (suspiciousBulk) {
        setCaptchaError("Pasting / keyboard suggestion fill is not allowed.");
        e.target.value = prev;
        setUserText(prev);
        return;
      }
    }

    prevTextRef.current = next;
    setUserText(next);
  };

  const handleSubmit = async () => {
    if (isExpired) {
      alert("Your plan has expired. Please contact admin to renew.");
      return;
    }

    if (!snippet || !snippet._id || isCompleted) return;

    if (normCaptcha(captchaInput) !== normCaptcha(captchaText)) {
      setCaptchaError("Captcha is incorrect. Please try again.");
      setCaptchaText(makeCaptcha(5));
      setCaptchaInput("");
      return;
    }
    setCaptchaError("");

    const confirmSubmit = window.confirm(
      "Are you sure you want to submit? You won’t be able to change your answer after submission."
    );
    if (!confirmSubmit) return;

    try {
      await fetch("https://api.freelancing-project.com/api/snippet/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, snippetId: snippet._id, userText }),
      });

      fetchNextSnippet();
    } catch (err) {
      console.error("Error submitting:", err);
    }
  };

  const captchaOk = useMemo(() => {
    if (isExpired) return false;
    return normCaptcha(captchaInput) === normCaptcha(captchaText) && captchaInput.length > 0;
  }, [captchaInput, captchaText, isExpired]);

  const locked = isExpired || isCompleted;

  // if expiry not checked yet, show loading (optional)
  if (!expiryChecked) {
    return <p className="load">Loading...</p>;
  }

  return (
    <div className="mywork">
      {/* ✅ Expired banner */}
      {isExpired ? (
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            background: "#fff1f2",
            border: "1px solid #fecdd3",
            color: "#9f1239",
            fontWeight: 800,
            marginBottom: 12,
            textAlign: "center",
            maxWidth: 900,
            marginInline: "auto",
          }}
        >
          ⛔ Your Plan has Expired. You can’t work until admin renews your validity.
          {validTill ? (
            <div style={{ marginTop: 8, fontWeight: 700, fontSize: 13 }}>
              Valid Till: {new Date(validTill).toLocaleDateString("en-GB")}
            </div>
          ) : null}
        </div>
      ) : null}

      {snippet && (
        <>
          {snippetNumber && (
            <h3>
              Page {snippetNumber}/{totalSnippets}
            </h3>
          )}

          <div className="workarea">
            <div className="para no-copy">
              <p>{snippet.content}</p>
            </div>

            <div className="inputarea">
              <textarea
                className="input"
                placeholder={
                  isExpired
                    ? "⛔ Plan Expired"
                    : isCompleted
                    ? "✅ Work completed!"
                    : "Start typing here..."
                }
                value={userText}
                disabled={locked}
                onBeforeInput={handleBeforeInput}
                onChange={handleChange}
                onCompositionStart={() => {
                  isComposingRef.current = true;
                }}
                onCompositionEnd={() => {
                  isComposingRef.current = false;
                  prevTextRef.current = userText;
                }}
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                autoComplete="off"
                name="typing_field_no_autofill"
                onPaste={(e) => {
                  e.preventDefault();
                  setCaptchaError("Pasting / keyboard suggestion fill is not allowed.");
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setCaptchaError("Pasting / keyboard suggestion fill is not allowed.");
                }}
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
              />

              {/* Captcha only if not completed and not expired */}
              {!isCompleted && !isExpired && (
                <div className="captchaWrap">
                  <label className="captchaLabel">Captcha</label>

                  <div className="captchaRow">
                    <div className="captchaBox" aria-label="captcha">
                      <div className="captchaLine" />
                      {captchaText.split("").map((ch, i) => (
                        <span
                          key={i}
                          className="captchaChar"
                          style={{
                            transform: `rotate(${(Math.random() * 20 - 10).toFixed(1)}deg)`,
                          }}
                        >
                          {ch}
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="captchaRefresh"
                      onClick={refreshCaptcha}
                      title="Refresh Captcha"
                    >
                      ↻
                    </button>

                    <input
                      className="captchaInput"
                      type="text"
                      value={captchaInput}
                      onChange={(e) => {
                        setCaptchaInput(e.target.value);
                        setCaptchaError("");
                      }}
                      placeholder="Enter captcha"
                      autoComplete="off"
                      onPaste={(e) => e.preventDefault()}
                      onDrop={(e) => e.preventDefault()}
                    />
                  </div>

                  {captchaError ? <div className="captchaError">{captchaError}</div> : null}
                </div>
              )}

              <button
                className="submitBtn"
                onClick={handleSubmit}
                disabled={locked || !captchaOk}
                title={
                  isExpired
                    ? "Plan expired"
                    : isCompleted
                    ? "Completed"
                    : !captchaOk
                    ? "Enter correct captcha"
                    : "Submit"
                }
              >
                {isExpired ? "Plan Expired" : isCompleted ? "Completed" : "Submit"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Work;