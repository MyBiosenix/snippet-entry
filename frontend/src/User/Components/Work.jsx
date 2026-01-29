import React, { useState, useEffect, useCallback, useMemo } from "react";
import "../Styles/work.css";

function makeCaptcha(len = 5) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
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

  const [captchaText, setCaptchaText] = useState(() => makeCaptcha(5));
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState("");

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  const refreshCaptcha = useCallback(() => {
    setCaptchaText(makeCaptcha(5));
    setCaptchaInput("");
    setCaptchaError("");
  }, []);

  const fetchNextSnippet = async () => {
    try {
      const res = await fetch(`https://api.freelancing-project.com/api/snippet/next/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.done) {
        setIsCompleted(true);
        setSnippet({ title: "Work Completed!", content: "Work Completed!" });
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
    return normCaptcha(captchaInput) === normCaptcha(captchaText) && captchaInput.length > 0;
  }, [captchaInput, captchaText]);

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
            <div className="para no-copy">
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
              />

              {/* ✅ Responsive Captcha */}
              {!isCompleted && (
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
                    />
                  </div>

                  {captchaError ? <div className="captchaError">{captchaError}</div> : null}
                </div>
              )}

              <button
                className="submitBtn"
                onClick={handleSubmit}
                disabled={isCompleted || !captchaOk}
                title={isCompleted ? "Completed" : !captchaOk ? "Enter correct captcha" : "Submit"}
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
