import { Routes, Route, Navigate } from "react-router-dom";

// Pages
import Register from "./pages/Register";
import Login from "./pages/Login";
import TeacherLogin from "./pages/TeacherLogin";
import TeacherRegister from "./pages/TeacherRegister";
import AIEvaluate from "./pages/AIEvaluate";
import Profile from "./pages/Profile";
import TestEvaluation from "./pages/TestEvaluation";
import Classroom from "./pages/Classroom";
import TeacherClassroom from "./pages/TeacherClassroom";
import OAuthCallback from "./pages/OAuthCallback";

// Components
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      {/* Redirect base URL */}
      <Route path="/" element={<Navigate to="/login/student" replace />} />

      <Route path="/auth/callback" element={<OAuthCallback />} />
      
      {/* AUTH ROUTES */}
      <Route path="/login/student" element={<Login />} />
      <Route path="/register/student" element={<Register />} />
      <Route path="/login/teacher" element={<TeacherLogin />} />
      <Route path="/register/teacher" element={<TeacherRegister />} />

      {/* Legacy auth redirect */}
      <Route path="/login" element={<Navigate to="/login/student" replace />} />
      <Route path="/register" element={<Navigate to="/register/student" replace />} />

      {/* STUDENT PROTECTED ROUTES */}
      <Route
        path="/ai-evaluate"
        element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <AIEvaluate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/classroom"
        element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <Classroom />
          </ProtectedRoute>
        }
      />

      {/* TEACHER PROTECTED ROUTES */}
      <Route
        path="/teacher/classroom"
        element={
          <ProtectedRoute allowedRoles={["TEACHER"]}>
            <TeacherClassroom />
          </ProtectedRoute>
        }
      />

      {/* Dev test page */}
      <Route path="/test-eval" element={<TestEvaluation />} />

      {/* 404 */}
      <Route path="*" element={<h1>404 Page Not Found</h1>} />
    </Routes>
  );
}
