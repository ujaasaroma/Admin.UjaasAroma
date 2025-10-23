// ProtectedRoute.jsx
import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const user = useSelector((state) => state.auth.user);

  if (!user) {
    // User is not logged in, redirect to login
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
