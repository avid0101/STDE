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

// Components
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      {/* Public routes - Default redirect to student login */}
      <Route path="/" element={<Navigate to="/login/student" />} />
      
      {/* Student Auth Routes */}
      <Route path="/login/student" element={<Login />} />
      <Route path="/register/student" element={<Register />} />
      
      {/* Teacher Auth Routes */}
      <Route path="/login/teacher" element={<TeacherLogin />} />
      <Route path="/register/teacher" element={<TeacherRegister />} />
      
      {/* Legacy routes - redirect to student routes */}
      <Route path="/login" element={<Navigate to="/login/student" />} />
      <Route path="/register" element={<Navigate to="/register/student" />} />

      {/* Protected routes - Student */}
      <Route 
        path="/ai-evaluate" 
        element={
          <ProtectedRoute>
            <AIEvaluate />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/classroom" 
        element={
          <ProtectedRoute>
            <Classroom />
          </ProtectedRoute>
        }
      />

      {/* Protected routes - Teacher */}
      <Route 
        path="/teacher/classroom" 
        element={
          <ProtectedRoute>
            <TeacherClassroom />
          </ProtectedRoute>
        }
      />

      {/* Dev Test Page (not protected) */}
      <Route path="/test-eval" element={<TestEvaluation />} />

      {/* 404 */}
      <Route path="*" element={<h1>404 Page Not Found</h1>} />
    </Routes>
  );
}
