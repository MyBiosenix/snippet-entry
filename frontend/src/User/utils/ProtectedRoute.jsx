import { Navigate } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";
import "../Styles/errors.css";
import { API_BASE } from "../../utils/api";

const ProtectedRoute = ({ children }) => {
  const [isAllowed, setIsAllowed] = useState(null); // null = loading

  useEffect(() => {
    const checkUserStatus = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setIsAllowed(false);
        return;
      }

      try {
        await axios.get(`${API_BASE}/auth/check-auth`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsAllowed(true);
      } catch (err) {
        console.error("Auth check failed:", err?.response?.data || err);

        const status = err.response?.status;
        if ([401, 403, 404].includes(status)) {
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          setIsAllowed(false);
        } else {
          setIsAllowed(false);
        }
      }
    };

    checkUserStatus();
  }, []);

  if (isAllowed === null)
    return (
      <div className="myerrs">
        <h3>Checking your account status...</h3>
      </div>
    );

  return isAllowed ? children : <Navigate to="/" replace />;
};

export default ProtectedRoute;
