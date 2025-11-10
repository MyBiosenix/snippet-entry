import React, { useState, useEffect } from "react";
import "../Styles/work.css";

function Work() {
  const [snippet, setSnippet] = useState(null);
  const [snippetNumber, setSnippetNumber] = useState(null);
  const [totalSnippets, setTotalSnippets] = useState(null);
  const [userText, setUserText] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  const fetchNextSnippet = async () => {
    try {
      const res = await fetch(`http://localhost:5098/api/snippet/next/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.done) {
        setIsCompleted(true);
        setSnippet({
          title: "🎉 All Snippets Completed!",
          content: "You have finished all typing practice sessions!",
        });
        setSnippetNumber(null);
        return;
      }

      setSnippet(data.snippet);
      setSnippetNumber(data.snippetNumber);
      setTotalSnippets(data.totalSnippets);
      setUserText("");
      setIsCompleted(false);
    } catch (err) {
      console.error("Error fetching snippet:", err);
    }
  };

  useEffect(() => {
    fetchNextSnippet();

    /*const handleContextMenu = (e) => e.preventDefault();
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
    };*/
  }, []);

  const handleSubmit = async () => {
    if (!snippet || !snippet._id || isCompleted) return;

    const confirmSubmit = window.confirm(
      "Are you sure you want to submit? You won’t be able to change your answer after submission."
    );
    if (!confirmSubmit) return;

    try {
      await fetch("http://localhost:5098/api/snippet/submit", {
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
              /*onCopy={(e) => e.preventDefault()}
              onSelect={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}*/
            >
              <p>{snippet.content}</p>
            </div>

            <div className="inputarea">
              <textarea
                className="input"
                placeholder={
                  isCompleted ? "✅ All snippets completed!" : "Start typing here..."
                }
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                /*disabled={isCompleted}*/
                /*autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                onPaste={(e) => e.preventDefault()}
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}*/
              ></textarea>

              <button onClick={handleSubmit} disabled={isCompleted}>
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
