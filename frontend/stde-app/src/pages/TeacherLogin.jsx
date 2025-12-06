import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../services/authService";
import "../css/Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authService.login({ email, password });
      console.log("Login successful:", response);
      
      // Redirect to AI Evaluate page after successful login
      navigate("/ai-evaluate");
    } catch (err) {
      console.error("Login error:", err);
      setError(err || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left Panel */}
      <div className="left-panel">
        <div className="background-pattern">
          <div className="pattern-box box-1"></div>
          <div className="pattern-box box-2"></div>
          <div className="pattern-box box-3"></div>
        </div>

        <div className="content">
          <h1 className="title">AI-Powered Documentation Analysis</h1>
          <p className="subtitle">
            Revolutionize your software testing workflow with intelligent
            evaluation and insights powered by advanced AI technology.
          </p>

          <div className="features">
            <div className="feature-item">
              <div className="checkmark">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M13.5 4L6 11.5L2.5 8"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p>Automated test case evaluation</p>
            </div>

            <div className="feature-item">
              <div className="checkmark">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M13.5 4L6 11.5L2.5 8"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p>Comprehensive quality metrics</p>
            </div>

            <div className="feature-item">
              <div className="checkmark">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M13.5 4L6 11.5L2.5 8"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p>Instant feedback and recommendations</p>
            </div>
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
            <h2>Welcome back</h2>
            <p>
              Don't have an account? <Link to="/register">Sign up</Link>
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && (
              <div className="error-message" style={{
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
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <div className="password-label">
                <label>Password</label>
                <div className="forget-link">
                  <a href="#">Forget?</a>
                </div>
              </div>

              <div className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <line
                        x1="1"
                        y1="1"
                        x2="23"
                        y2="23"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  ) : (
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  )}
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