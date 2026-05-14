import React, { useEffect, useState } from 'react';
import '../Styles/reports.css';
import { useNavigate  } from 'react-router-dom';
import http from '../../utils/http';
import { API_BASE } from '../../utils/api';
import { getStoredUserId, getUserToken } from '../../utils/auth';

function ViewComp() {
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState('');

  const userId = getStoredUserId();

  const navigate = useNavigate();
  useEffect(() => {
    const token = getUserToken();

    if (import.meta.env.DEV) {
      console.log('API_BASE:', API_BASE);
      console.log('Has userToken:', Boolean(localStorage.getItem('userToken')));
      console.log('Has token:', Boolean(localStorage.getItem('token')));
      console.log('User ID:', userId);
    }

    if (!token || !userId) {
      setError('Please login again.');
      setResults([]);
      return;
    }

    const fetchUserSnippets = async () => {
      try {
        setError('');
        const res = await http.get(`/snippet/user/${userId}`);
        const data = Array.isArray(res.data) ? res.data : [];
        if (import.meta.env.DEV) {
          console.log('Fetched snippets count:', data.length);
        }
        setResults(data);
      } catch (err) {
        console.error('Error fetching user snippets:', err);
        setError(err?.response?.data?.message || 'Failed to fetch submitted pages.');
        setResults([]);
      }
    };

    fetchUserSnippets();
  }, [userId]);

  return (
    <div className="report-page">
      <p className='back' onClick={()=>navigate('/home')}>Back</p>
      <h2 className="report-title">All Submitted Pages</h2>

      {error ? <p className="no-report">{error}</p> : null}

      {!error && results.length > 0 ? (
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
      ) : !error ? (
        <p className="no-report">No Submitted Work Found.</p>
      ) : null}
    </div>
  );
}

export default ViewComp;
