import React from "react";
import { Navigate } from "react-router-dom";
import {
  clearSubAdminSession,
  isSubAdminSessionValid,
} from "../../utils/auth";

function SubAdminProtectedRoute({ children }) {
  if (!isSubAdminSessionValid()) {
    clearSubAdminSession();
    return <Navigate to="/sub-admin/login" replace />;
  }

  return children;
}

export default SubAdminProtectedRoute;
