import { Routes, Route, Navigate } from "react-router-dom";

// Pages
import Register from "./pages/Register";
import Login from "./pages/Login";
import AIEvaluate from "./pages/AIEvaluate";

export default function App() {
  return (
    <Routes>
      {/* Default route */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Authentication */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      {/* Main Platform */}
      <Route path="/ai-evaluate" element={<AIEvaluate />} />

      {/* If no match */}
      <Route path="*" element={<h1>404 Page Not Found</h1>} />
    </Routes>
  );
}
