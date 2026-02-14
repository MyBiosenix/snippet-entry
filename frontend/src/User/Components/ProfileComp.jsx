import React, { useEffect, useMemo, useState } from "react";
import "../Styles/profile.css";
import axios from "axios";

function ProfileComp() {
  const id = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const [user, setUser] = useState(null);

  const getUser = async () => {
    try {
      const res = await axios.get(
        `https://api.freelancing-project.com/api/auth/${id}/user`,
        token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : undefined
      );
      setUser(res.data);
    } catch (err) {
      if (err?.response?.data?.message) alert(err.response.data.message);
      else alert("Error Fetching User");
    }
  };

  useEffect(() => {
    getUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const expiryInfo = useMemo(() => {
    if (!user) return { expiryText: "-", statusText: "-", isExpired: false, daysAgo: 0 };

    // support different field names
    const raw = user.expiry || user.validity || user.date || user.subscriptionValidity;
    if (!raw) return { expiryText: "-", statusText: "Active", isExpired: false, daysAgo: 0 };

    const d = new Date(raw);
    if (isNaN(d.getTime())) return { expiryText: "-", statusText: "Active", isExpired: false, daysAgo: 0 };

    const now = new Date();
    const isExpired = d.getTime() < now.getTime();
    const daysAgo = isExpired ? Math.floor((now - d) / (1000 * 60 * 60 * 24)) : 0;

    const expiryText = d.toLocaleDateString("en-IN"); // 30/01/2026
    const statusText = isExpired ? "Expired" : "Active";

    return { expiryText, statusText, isExpired, daysAgo };
  }, [user]);

  const name = user?.name || "—";
  const email = user?.email || "—";
  const phone = user?.mobile || user?.phone || "—";
  const pkg = user?.packages?.name || user?.packageName || "—";
  const price = user?.price ? `₹${Number(user.price).toLocaleString("en-IN")}` : "—";

  // small initials for avatar fallback
  const initials = (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "U";

  return (
    <div className="profile-page">
      <div className="profile-shell">
        {/* LEFT SIDEBAR */}
        <aside className="profile-sidebar">
          <div className="profile-avatar">
            <div className="avatar-circle">{initials}</div>
            <span className="avatar-dot" />
          </div>

          <div className="profile-mini">
            <h3 className="profile-name">{name}</h3>
            <p className="profile-tier">{pkg}</p>

            <span className={`status-pill ${expiryInfo.isExpired ? "expired" : "active"}`}>
              {expiryInfo.statusText}
            </span>
          </div>
        </aside>

        {/* RIGHT CONTENT */}
        <main className="profile-content">
          <div className="content-head">
            <h2 className="content-title">Information</h2>
            <p className="content-sub">Your account details shown below</p>
          </div>

          <div className="info-grid">
            <InfoCard label="Email" value={email} icon="✉️" />
            <InfoCard label="Phone" value={phone} icon="📞" />

            <InfoCard label="Package" value={pkg} icon="🏷️" />
            <InfoCard label="Price" value={price} icon="💳" />

            <div className="info-card info-card--full">
              <div className="info-top">
                <span className="info-icon">📅</span>
                <span className="info-label">Validity</span>
              </div>

              <div className="validity-row">
                <span className="info-value">{expiryInfo.expiryText}</span>
                {expiryInfo.isExpired && expiryInfo.expiryText !== "-" ? (
                  <span className="expired-text">
                    • Expired {expiryInfo.daysAgo} days ago
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function InfoCard({ label, value, icon }) {
  return (
    <div className="info-card">
      <div className="info-top">
        <span className="info-icon">{icon}</span>
        <span className="info-label">{label}</span>
      </div>
      <div className="info-value">{value}</div>
    </div>
  );
}

export default ProfileComp;
