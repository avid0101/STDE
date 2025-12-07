import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import authService from "../services/authService";
import "../css/Login.css";

export default function Login() {
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
      const user = response.user ? response.user : response;

      // STRICT VALIDATION: Only STUDENT allowed
      if (user.userType !== "STUDENT") {
        setError("Access denied. This login is for students only. Please use the teacher login page.");
        authService.logout(); // Clear any stored data
        setLoading(false);
        return;
      }

      // Save user and token
      localStorage.setItem("user", JSON.stringify(user));
      if (response.token) {
        localStorage.setItem("token", response.token);
      }

      navigate("/student/dashboard");
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:8080/api/oauth2/login/student';
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
              <div className="checkmark">✔</div>
              <p>Automated test case evaluation</p>
            </div>
            <div className="feature-item">
              <div className="checkmark">✔</div>
              <p>Comprehensive quality metrics</p>
            </div>
            <div className="feature-item">
              <div className="checkmark">✔</div>
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
            <h2>Student Login</h2>
            <p>
              Don't have an account?{" "}
              <Link to="/register/student">Sign up</Link>
            </p>
            <p className="role-switch">
              Are you a teacher?{" "}
              <Link to="/login/teacher">Login here</Link>
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
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
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
                  tabIndex={-1}
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

            <div style={{ 
              margin: '1.5rem 0 1rem', 
              textAlign: 'center', 
              color: '#9ca3af',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
              <span>OR</span>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb',
                background: 'white',
                color: '#374151',
                fontSize: '0.95rem',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                transition: 'all 0.2s',
                opacity: loading ? 0.6 : 1
              }}
              onMouseEnter={(e) => !loading && (e.target.style.background = '#f9fafb')}
              onMouseLeave={(e) => !loading && (e.target.style.background = 'white')}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9.003 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.438 15.983 5.482 18 9.003 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"/>
                <path fill="#EA4335" d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.003 0 5.482 0 2.438 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z"/>
              </svg>
              Continue with Google
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