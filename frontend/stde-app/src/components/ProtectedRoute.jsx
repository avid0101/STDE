import { Navigate } from "react-router-dom";
import authService from "../services/authService";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getCurrentUser(); // user must include {role: "STUDENT" or "TEACHER"}

  if (!isAuthenticated || !user) {
    return <Navigate to="/login/student" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If role does not match → redirect to login or dashboard
    return <Navigate to="/login/student" replace />;
  }

  return children;
};

export default ProtectedRoute;
