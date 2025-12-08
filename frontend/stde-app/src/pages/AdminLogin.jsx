import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import authService from "../services/authService";
import "../css/TeacherLogin.css";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(searchParams.get('error') || "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authService.login({ email, password });
      const user = response.user;

      // STRICT VALIDATION: Only ADMIN allowed
      if (user.userType !== "ADMIN") {
        setError("Access denied. This login is for system administrators only.");
        authService.logout(); // Clear any stored data
        setLoading(false);
        return;
      }

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", response.token);

      navigate("/admin/dashboard");

    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left Panel - Simplified for Admin context */}
      <div className="left-panel">
        <div className="background-pattern">
          <div className="pattern-box box-1"></div>
          <div className="pattern-box box-2"></div>
          <div className="pattern-box box-3"></div>
        </div>

        <div className="content">
          <h1 className="title">STDE System Administration</h1>
          <p className="subtitle">
            Secure access for managing users, roles, and system health.
          </p>

          <div className="features">
            <div className="feature-item"><div className="checkmark">✔</div>Full User Control</div>
            <div className="feature-item"><div className="checkmark">✔</div>Role Assignment</div>
            <div className="feature-item"><div className="checkmark">✔</div>System Monitoring</div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="right-panel">
        <div className="form-container">
          <div className="logo">
            <div className="logo-icon">S</div>
            <span className="logo-text">STDE</span>
          </div>

          <div className="welcome">
            <h2>Admin Login</h2>
            <p className="role-switch">
              Need Student or Teacher access?{" "}
              <Link to="/login/student">Login here</Link>
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && (
            <div className="error-message"
              style={{
                backgroundColor: '#fee',
                color: '#c33',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
              {error}
            </div>
          )}

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Admin email"
                required
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label>Password</label>

              <div className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="footer">
            <p>Capstone Project 2025</p>
          </div>
        </div>
      </div>
    </div>
  );
}