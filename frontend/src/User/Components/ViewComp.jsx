import React, { useEffect, useState } from 'react';
import '../Styles/reports.css';
import { useNavigate  } from 'react-router-dom';

function ViewComp() {
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const userId = localStorage.getItem("userId");

  const navigate = useNavigate();
  useEffect(() => {
    if (!userId) return;

    fetch(`https://dms-2g0q.onrender.com/api/snippet/user/${userId}`)
      .then(res => res.json())
      .then(data => {
        console.log("Fetched snippets:", data);
        setResults(data);
      })
      .catch(err => console.error("Error fetching user snippets:", err));
  }, [userId]);

  return (
    <div className="report-page">
      <p className='back' onClick={()=>navigate('/home')}>Back</p>
      <h2 className="report-title">All Submitted Pages</h2>

      {results.length > 0 ? (
        <>
          <div className="snippet-buttons">
            {results.map((r, idx) => (
              <button
                key={r._id}
                className={selectedIndex === idx ? "active-btn" : ""}
                onClick={() => setSelectedIndex(idx)}
              >
                Page {idx + 1}
              </button>
            ))}
          </div>

          <div className="report-block">
            <h3 className="snippet-title">Page {selectedIndex + 1}</h3>

            <div className="snippet-flex">
              <div className="snippet-box original">
                <h4>Original Image</h4>
                <p>{results[selectedIndex]?.snippetId?.content || "No original text found."}</p>
              </div>

              <div className="snippet-box user">
                <h4>Your Submitted Work</h4>
                <p>{results[selectedIndex]?.userText || "No user submission found."}</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className="no-report">No Submitted Work Found.</p>
      )}
    </div>
  );
}

export default ViewComp;
