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
    
    // Check if the user is ADMIN and redirect to a general login if an Admin page isn't set up yet
    const redirectPath = user.userType === "TEACHER" 
      ? "/login/teacher" 
      : "/login/student"; // Default to student login for all others (including ADMIN, as ADMIN login isn't separate yet)
    
    // For a fully integrated ADMIN route, you would use:
    // const redirectPath = user.userType === "ADMIN" ? "/login/admin" : user.userType === "TEACHER" ? "/login/teacher" : "/login/student";
    
    return <Navigate to={redirectPath} replace />;
  }
  
  // NOTE: For the ADMIN Dashboard to load, you'll need to manually set 
  // a test user's role to "ADMIN" in the database.

  return children;
};

export default ProtectedRoute;