// User Dashboard.jsx (UPDATED)
import React, { useEffect, useState } from "react";
import "../Styles/dashboard.css";
import { MdSubscriptions, MdOutlineTrackChanges } from "react-icons/md";
import { FaBullseye, FaChartLine } from "react-icons/fa";
import axios from "../utils/axiosInstance";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");

  const navigate = useNavigate();

  const formatDateTimeIN = (v) => {
    if (!v) return "-";
    const d = new Date(v);
    if (isNaN(d.getTime())) return "-";

    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("token");

        if (!userId) {
          setError("No user ID found in localStorage");
          return;
        }

        const res = await axios.get(`/auth/${userId}/dash-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setStats(res.data);
      } catch (err) {
        console.error(err);
        setError("Error fetching dashboard stats: " + err.message);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    if (!stats?.validTill) return;

    const pad = (n) => String(n).padStart(2, "0");

    const compute = () => {
      const expiry = new Date(stats.validTill);
      if (isNaN(expiry.getTime())) {
        setTimeLeft("-");
        return;
      }

      const now = new Date();
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / (3600 * 24));
      const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft(`${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    compute();
    const interval = setInterval(compute, 1000);
    return () => clearInterval(interval);
  }, [stats?.validTill]);

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!stats) return <p className="load">Loading dashboard...</p>;

  return (
    <div className="dashboard">
      <h3>Dashboard</h3>

      <div className="indash">
        <div className="dash" onClick={() => navigate("/profile")}>
          <h4>Plan</h4>
          <MdSubscriptions className="dashicon" />
          <h5>{stats.package}</h5>
          <p>Data Conversion</p>
        </div>

        <div className="dash" onClick={() => navigate("/work")}>
          <h4>Goal</h4>
          <FaBullseye className="dashicon" />
          <h5>{stats.goal}</h5>
          <p>Pages</p>
        </div>

        <div className="dash" onClick={() => navigate("/view")}>
          <h4>Goal Status</h4>
          <MdOutlineTrackChanges className="dashicon" />
          <h5>{stats.completed}</h5>
          <p>Done</p>
        </div>

        {/* ✅ Keep navigation same. Message will be shown on /report page only */}
        <div className="dash" onClick={() => navigate("/report")}>
          <h4>Report</h4>
          <FaChartLine className="dashicon" />
          <h5>See Results</h5>
          <p>Under Review</p>
        </div>
      </div>

      <p className="valid">Subscription Validity: {formatDateTimeIN(stats.validTill)}</p>

      <p className={`timer ${timeLeft === "Expired" ? "expired" : ""}`}>Time Left: {timeLeft}</p>
    </div>
  );
}

export default Dashboard;
