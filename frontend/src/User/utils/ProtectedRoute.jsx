import { Navigate } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";
import "../Styles/errors.css";

const ProtectedRoute = ({ children }) => {
  const [isAllowed, setIsAllowed] = useState(null); // null = loading

  useEffect(() => {
    const checkUserStatus = async () => {
      const token = localStorage.getItem("token");

      // 🚫 No token = not logged in
      if (!token) {
        setIsAllowed(false);
        return;
      }

      try {
        // ✅ Verify user is authenticated and active
        await axios.get("http://localhost:5098/api/auth/check-auth", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsAllowed(true);
      } catch (err) {
        console.error("Auth check failed:", err?.response?.data || err);

        // ❌ Handle all expected auth errors
        const status = err.response?.status;
        if ([401, 403, 404].includes(status)) {
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          setIsAllowed(false);
        } else {
          // Unexpected error (e.g., server down)
          setIsAllowed(false);
        }
      }
    };

    checkUserStatus();
  }, []);

  // 🕓 While verifying authentication
  if (isAllowed === null)
    return (
      <div className="myerrs">
        <h3>Checking your account status...</h3>
      </div>
    );

  // ✅ If allowed → render children, otherwise → redirect to login
  return isAllowed ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
