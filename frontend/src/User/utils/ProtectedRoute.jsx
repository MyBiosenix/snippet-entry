import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../Styles/errors.css";
import http from "../../utils/http";
import { clearUserSession, isUserSessionValid } from "../../utils/auth";

const ProtectedRoute = ({ children }) => {
  const [isAllowed, setIsAllowed] = useState(null); // null = loading

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!isUserSessionValid()) {
        clearUserSession();
        setIsAllowed(false);
        return;
      }

      try {
        await http.get("/auth/check-auth");
        setIsAllowed(true);
      } catch (err) {
        const status = err.response?.status;
        if ([401, 403, 404].includes(status)) {
          clearUserSession();
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
