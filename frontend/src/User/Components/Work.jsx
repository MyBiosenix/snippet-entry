import React, { useState, useEffect, useCallback } from "react";
import "../Styles/work.css";

/** ✅ Captcha helpers */
function makeCaptcha(len = 5) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // removed O/0/I/1
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
function normCaptcha(v) {
  return String(v || "").trim().toUpperCase();
}

function Work() {
  const [snippet, setSnippet] = useState(null);
  const [snippetNumber, setSnippetNumber] = useState(null);
  const [totalSnippets, setTotalSnippets] = useState(null);
  const [userText, setUserText] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);

  /** ✅ Captcha state */
  const [captchaText, setCaptchaText] = useState(() => makeCaptcha(5));
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState("");

  const refreshCaptcha = useCallback(() => {
    setCaptchaText(makeCaptcha(5));
    setCaptchaInput("");
    setCaptchaError("");
  }, []);

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  const fetchNextSnippet = async () => {
    try {
      const res = await fetch(`https://api.freelancing-project.com/api/snippet/next/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.done) {
        setIsCompleted(true);
        setSnippet({
          title: "Work Completed!",
          content: "Work Completed!",
        });
        setSnippetNumber(null);
        setTotalSnippets(null);
        setUserText("");
        refreshCaptcha();
        return;
      }

      setSnippet(data.snippet);
      setSnippetNumber(data.snippetNumber);
      setTotalSnippets(data.totalSnippets);
      setUserText("");
      setIsCompleted(false);

      // ✅ new snippet => new captcha
      refreshCaptcha();
    } catch (err) {
      console.error("Error fetching snippet:", err);
    }
  };

  useEffect(() => {
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
  }, []);

  const handleSubmit = async () => {
    if (!snippet || !snippet._id || isCompleted) return;

    // ✅ Captcha check ONLY
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
        // ✅ userText can be empty (as you want)
        body: JSON.stringify({ userId, snippetId: snippet._id, userText }),
      });

      fetchNextSnippet();
    } catch (err) {
      console.error("Error submitting:", err);
    }
  };

  const captchaOk =
    normCaptcha(captchaInput) === normCaptcha(captchaText) && captchaInput.length > 0;

  return (
    <div className="mywork">
      {snippet && (
        <>
          {snippetNumber && (
            <h3>
              Page {snippetNumber}/{totalSnippets}
            </h3>
          )}

          <div className="workarea">
            <div
              className="para no-copy"
              onCopy={(e) => e.preventDefault()}
              onSelect={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
            >
              <p>{snippet.content}</p>
            </div>

            <div className="inputarea">
              <textarea
                className="input"
                placeholder={isCompleted ? "✅ Work completed!" : "Start typing here..."}
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                disabled={isCompleted}
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                onPaste={(e) => e.preventDefault()}
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
              ></textarea>

              {/* ✅ Captcha UI */}
              {!isCompleted && (
                <div style={{ marginTop: 12 }}>
                  <label style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>
                    Captcha
                  </label>

                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        padding: "14px 18px",
                        borderRadius: 8,
                        border: "1px solid #c7c7c7",
                        background: "linear-gradient(135deg, #f3f4f6, #e5e7eb)",
                        fontWeight: 800,
                        letterSpacing: 4,
                        userSelect: "none",
                        fontSize: 20,
                        display: "flex",
                        gap: 4,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "-10%",
                          width: "120%",
                          height: 2,
                          background: "rgba(0,0,0,0.25)",
                          transform: "rotate(-8deg)",
                        }}
                      />
                      {captchaText.split("").map((ch, i) => (
                        <span
                          key={i}
                          style={{
                            transform: `rotate(${(Math.random() * 20 - 10).toFixed(1)}deg)`,
                            color: "#111827",
                          }}
                        >
                          {ch}
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={refreshCaptcha}
                      title="Refresh Captcha"
                      style={{
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        background: "white",
                        color: "black",
                        cursor: "pointer",
                        fontSize: 18,
                        fontWeight: 700,
                      }}
                    >
                      ↻
                    </button>

                    <input
                      type="text"
                      value={captchaInput}
                      onChange={(e) => {
                        setCaptchaInput(e.target.value);
                        setCaptchaError("");
                      }}
                      placeholder="Enter captcha"
                      style={{
                        flex: 1,
                        minWidth: 180,
                        height: 35,
                        background: "white",
                        borderWidth: "0.2px",
                        borderRadius: 4,
                        color: "black",
                      }}
                    />
                  </div>

                  {captchaError ? (
                    <div style={{ color: "red", marginTop: 6, fontWeight: 600 }}>
                      {captchaError}
                    </div>
                  ) : null}
                </div>
              )}

              {/* ✅ Submit depends ONLY on captcha + isCompleted */}
              <button
                onClick={handleSubmit}
                disabled={isCompleted || !captchaOk}
                title={
                  isCompleted
                    ? "Completed"
                    : !captchaOk
                    ? "Enter correct captcha"
                    : "Submit"
                }
              >
                {isCompleted ? "Completed" : "Submit"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Work;
