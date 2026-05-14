import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../Styles/errors.css";
import http from "../../utils/http";

const ProtectedRoute = ({ children }) => {
  const [isAllowed, setIsAllowed] = useState(null); // null = loading

  useEffect(() => {
    const checkUserStatus = async () => {
      const token =
        localStorage.getItem("userToken") || localStorage.getItem("token");

      if (!token) {
        setIsAllowed(false);
        return;
      }

      try {
        await http.get("/auth/check-auth");
        setIsAllowed(true);
      } catch (err) {
        console.error("Auth check failed:", err?.response?.data || err);

        const status = err.response?.status;
        if ([401, 403, 404].includes(status)) {
          localStorage.removeItem("userToken");
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
