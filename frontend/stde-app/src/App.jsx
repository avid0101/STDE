import { Routes, Route, Navigate } from "react-router-dom";

// Pages
import Register from "./pages/Register";
import Login from "./pages/Login";
import TeacherLogin from "./pages/TeacherLogin";
import TeacherRegister from "./pages/TeacherRegister";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import Profile from "./pages/Profile";
import Classroom from "./pages/Classroom";
import TeacherClassroom from "./pages/TeacherClassroom";
import ClassroomDetails from './pages/ClassroomDetails';
import OAuthCallback from "./pages/OAuthCallback";
import TeacherProfile from "./pages/TeacherProfile";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login/student" replace />} />
      <Route path="/auth/callback" element={<OAuthCallback />} />

      {/* AUTH */}
      <Route path="/login/student" element={<Login />} />
      <Route path="/register/student" element={<Register />} />
      <Route path="/login/teacher" element={<TeacherLogin />} />
      <Route path="/register/teacher" element={<TeacherRegister />} />
      
      {/* Legacy */}
      <Route path="/login" element={<Navigate to="/login/student" replace />} />
      <Route path="/register" element={<Navigate to="/register/student" replace />} />

      {/* STUDENT */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/profile"
        element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/classrooms"
        element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <Classroom />
          </ProtectedRoute>
        }
      />
      
      {/* SHARED */}
      <Route 
        path="/classroom/:id" 
        element={
        <ClassroomDetails />} 
      />

      {/* TEACHER */}
      <Route
        path="/teacher/dashboard" 
        element={
          <ProtectedRoute allowedRoles={["TEACHER"]}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/classrooms"
        element={
          <ProtectedRoute allowedRoles={["TEACHER"]}>
            <TeacherClassroom />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/profile"
        element={
          <ProtectedRoute allowedRoles={["TEACHER"]}>
            <TeacherProfile />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<h1>404 Page Not Found</h1>} />
    </Routes>
  );
}