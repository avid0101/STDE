import { Navigate } from "react-router-dom";
import authService from "../services/authService";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getCurrentUser();

  // Not logged in at all
  if (!isAuthenticated || !user) {
    return <Navigate to="/login/student" replace />;
  }

  // Check role permissions
  if (allowedRoles && !allowedRoles.includes(user.userType)) {
    // Log out and redirect to correct login page
    authService.logout();
    
    const redirectPath = user.userType === "TEACHER" 
      ? "/login/teacher" 
      : "/login/student";
    
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;