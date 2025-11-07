import React, { useEffect, useState } from 'react';
import '../Styles/dashboard.css';
import { MdSubscriptions, MdOutlineTrackChanges } from 'react-icons/md';
import { FaBullseye, FaChartLine } from 'react-icons/fa';
import axios from '../utils/axiosInstance';
import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token')
        if (!userId) {
          setError("No user ID found in localStorage");
          return;
        }

        const res = await axios.get(`/auth/${userId}/dash-stats`,
          {headers:{Authorization: `Bearer ${token}`}}
        );
        setStats(res.data);
      } catch (err) {
        console.error(err);
        setError("Error fetching dashboard stats: " + err.message);
      }
    };

    fetchStats();
  }, []);

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!stats) return <p className='load'>Loading dashboard...</p>;

  return (
    <div className='dashboard'>
      <h3>Dashboard</h3>

      <div className='indash'>
        <div className='dash'>
          <h4>Plan</h4>
          <MdSubscriptions className='dashicon' />
          <h5>{stats.package}</h5>
          <p>Data Conversion</p>
        </div>

        <div className='dash'>
          <h4>Goal</h4>
          <FaBullseye className='dashicon' />
          <h5>{stats.goal}</h5>
          <p>Pages</p>
        </div>

        <div className='dash' onClick={() => navigate('/view')}>
          <h4>Goal Status</h4>
          <MdOutlineTrackChanges className='dashicon' />
          <h5>{stats.completed}</h5>
          <p>Done</p>
        </div>

        <div className='dash' onClick={() => navigate('/report')}>
          <h4>Report</h4>
          <FaChartLine className='dashicon' />
          <h5>See Results</h5>
          <p>Under Review</p>
        </div>
      </div>

      <p className='valid'>
        Subscription Validity: {new Date(stats.validTill).toLocaleDateString('en-GB')}
      </p>
    </div>
  );
}

export default Dashboard;
