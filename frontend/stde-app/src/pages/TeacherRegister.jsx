import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../services/authService";
import "../css/Register.css";

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register({
        fullName,
        email,
        password,
      });
      
      console.log("Registration successful:", response);
      
      // Redirect to login page after successful registration
      navigate("/login", { 
        state: { message: "Registration successful! Please log in." } 
      });
    } catch (err) {
      console.error("Registration error:", err);
      setError(err || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      {/* Left Panel */}
      <div className="left-panel">
        <div className="background-pattern">
          <div className="pattern-box box-1"></div>
          <div className="pattern-box box-2"></div>
          <div className="pattern-box box-3"></div>
        </div>

        <div className="content">
          <h1 className="title">Join the Future of Testing</h1>
          <p className="subtitle">
            Get started with our AI-powered platform and transform how you
            evaluate software testing documentation.
          </p>

          <div className="features">
            <div className="feature-item">
              <div className="checkmark">
                <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                  <path
                    d="M13.5 4L6 11.5L2.5 8"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p>Intelligent document analysis</p>
            </div>

            <div className="feature-item">
              <div className="checkmark">
                <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                  <path
                    d="M13.5 4L6 11.5L2.5 8"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p>Real-time quality feedback</p>
            </div>

            <div className="feature-item">
              <div className="checkmark">
                <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                  <path
                    d="M13.5 4L6 11.5L2.5 8"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p>Advanced reporting tools</p>
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
            <h2>Create account</h2>
            <p>
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </div>

          <form className="register-form" onSubmit={handleSubmit}>
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
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
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
                        strokeLinecap="round"
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

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
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
              {loading ? "Creating account..." : "Create account"}
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