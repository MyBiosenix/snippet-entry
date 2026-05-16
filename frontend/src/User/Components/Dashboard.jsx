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
  const [softwareUsed, setSoftwareUsed] = useState(false);
  const [notInSequence, setNotInSequence] = useState(false);
  const [isComplete, setIsComplete] = useState(true);
  const [isDeclared, setIsDeclared] = useState(false);

  const navigate = useNavigate();

  const formatDateTimeIN = (v) => {
    if (!v) return "-";
    const d = new Date(v);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleString("en-IN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    });
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) { setError("No user ID found"); return; }

        // fetch dash stats + user flags in parallel
        const [statsRes, userRes] = await Promise.all([
          axios.get(`/auth/${userId}/dash-stats`),
          axios.get(`/auth/${userId}/user`),
        ]);

        setStats(statsRes.data);
        setSoftwareUsed(!!userRes.data?.softwareUsed);
        setNotInSequence(!!userRes.data?.notInSequence);
        setIsComplete(userRes.data?.isComplete === false ? false : true);
        setIsDeclared(!!(userRes.data?.isDeclared ?? userRes.data?.reportDeclared));
      } catch (err) {
        setError("Error fetching dashboard stats: " + err.message);
      }
    };

    fetchAll();
  }, []);

  useEffect(() => {
    if (!stats?.validTill) return;
    const pad = (n) => String(n).padStart(2, "0");
    const compute = () => {
      const expiry = new Date(stats.validTill);
      if (isNaN(expiry.getTime())) { setTimeLeft("-"); return; }
      const diff = expiry.getTime() - new Date().getTime();
      if (diff <= 0) { setTimeLeft("Expired"); return; }
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

  // ── Report card content ──
  const getReportCardContent = () => {
    if (!isDeclared)    return { label: "Not Declared",  sub: null };
    if (softwareUsed)   return { label: "Unavailable",   sub: "Software Used Detected" };
    if (notInSequence)  return { label: "Unavailable",   sub: "Not In Sequence" };
    if (!isComplete)    return { label: "Incomplete",    sub: "Work Marked Incomplete" };
    return { label: "See Results", sub: null };
  };

  const { label: reportLabel, sub: reportSub } = getReportCardContent();
  const reportWarning = softwareUsed || notInSequence || !isComplete;

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

        <div className="dash" onClick={() => navigate("/report")}>
          <h4>Report</h4>
          <FaChartLine className="dashicon" />
          <h5 style={{ color: reportWarning ? "#b91c1c" : "inherit" }}>
            {reportLabel}
          </h5>
          {reportSub ? (
            <p style={{ color: "#b91c1c", fontWeight: 600, fontSize: 11, margin: 0 }}>
              {reportSub}
            </p>
          ) : (
            <p>Under Review</p>
          )}
        </div>
      </div>

      <p className="valid">
        Subscription Validity: {formatDateTimeIN(stats.validTill)}
      </p>
      <p className={`timer ${timeLeft === "Expired" ? "expired" : ""}`}>
        Time Left: {timeLeft}
      </p>
    </div>
  );
}

export default Dashboard;
