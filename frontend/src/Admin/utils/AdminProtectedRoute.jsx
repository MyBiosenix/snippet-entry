import React from "react";
import { Navigate } from "react-router-dom";
import { clearAdminSession, isAdminSessionValid } from "../../utils/auth";

function AdminProtectedRoute({ children }) {
  if (!isAdminSessionValid()) {
    clearAdminSession();
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default AdminProtectedRoute;
