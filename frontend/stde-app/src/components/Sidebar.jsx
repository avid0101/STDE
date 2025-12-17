import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import authService from "../services/authService";
import "../css/Sidebar.css";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isModalExiting, setIsModalExiting] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(null); // 'cancel', 'logout', or null

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      const role = currentUser.userType?.toLowerCase();
      setUserRole(role);
    } else {
      setUser(null);
      setUserRole(null);
    }
  }, []);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
    setHoveredButton(null);
  };

  const handleLogoutConfirm = () => {
    setIsModalExiting(true);
    setTimeout(() => {
      setShowLogoutModal(false);
      setIsModalExiting(false);
      setHoveredButton(null);
      authService.logout();
      if (userRole === "teacher") {
        navigate("/login/teacher");
      } else {
        navigate("/login/student");
      }
    }, 200);
  };

  const handleLogoutCancel = () => {
    setIsModalExiting(true);
    setTimeout(() => {
      setShowLogoutModal(false);
      setIsModalExiting(false);
      setHoveredButton(null);
    }, 200);
  };

  // Animated Emoji Face Component
  const AnimatedEmoji = ({ mood }) => {
    const isHappy = mood === 'happy';
    const isSad = mood === 'sad';

    return (
      <div className={`emoji-container ${isSad ? 'emoji-sad' : ''} ${isHappy ? 'emoji-happy' : ''}`}>
        <svg viewBox="0 0 100 100" className="emoji-svg">
          {/* Face circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            className={`emoji-face ${isSad ? 'face-sad' : ''} ${isHappy ? 'face-happy' : ''}`}
          />

          {/* Left eye */}
          <g className={`emoji-eye left-eye ${isSad ? 'eye-sad' : ''} ${isHappy ? 'eye-happy' : ''}`}>
            <ellipse cx="35" cy="40" rx="6" ry={isHappy ? "8" : "6"} className="eye-shape" />
            <circle cx="35" cy="40" r="2" className="eye-pupil" />
            {isSad && <path d="M28 30 Q35 25 42 30" className="eyebrow-sad" />}
          </g>

          {/* Right eye */}
          <g className={`emoji-eye right-eye ${isSad ? 'eye-sad' : ''} ${isHappy ? 'eye-happy' : ''}`}>
            <ellipse cx="65" cy="40" rx="6" ry={isHappy ? "8" : "6"} className="eye-shape" />
            <circle cx="65" cy="40" r="2" className="eye-pupil" />
            {isSad && <path d="M58 30 Q65 25 72 30" className="eyebrow-sad" />}
          </g>

          {/* Mouth */}
          {isSad ? (
            <path
              d="M30 70 Q50 55 70 70"
              className="emoji-mouth mouth-sad"
            />
          ) : isHappy ? (
            <path
              d="M30 60 Q50 80 70 60"
              className="emoji-mouth mouth-happy"
            />
          ) : (
            <path
              d="M35 65 L65 65"
              className="emoji-mouth mouth-neutral"
            />
          )}

          {/* Blush for happy */}
          {isHappy && (
            <>
              <circle cx="25" cy="55" r="6" className="emoji-blush" />
              <circle cx="75" cy="55" r="6" className="emoji-blush" />
            </>
          )}

          {/* Tear for sad */}
          {isSad && (
            <ellipse cx="38" cy="52" rx="3" ry="5" className="emoji-tear" />
          )}
        </svg>
      </div>
    );
  };

  const teacherNavItems = [
    {
      path: "/teacher/dashboard",
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      label: "Dashboard"
    },
    {
      path: "/teacher/classrooms",
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor">
          <path d="M12 14l9-5-9-5-9 5 9 5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      label: "Classrooms"
    },
    {
      path: "/teacher/profile",
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor">
          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      label: "Profile"
    }
  ];

  const studentNavItems = [
    {
      path: "/student/dashboard",
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      label: "Dashboard"
    },
    {
      path: "/student/classrooms",
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor">
          <circle cx="12" cy="7" r="4" strokeWidth="2" />
          <path d="M5 21a7 7 0 0114 0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      label: "Classrooms"
    },
    {
      path: "/student/profile",
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor">
          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      label: "Profile"
    }
  ];

  let navItems = [];
  if (userRole === "teacher") navItems = teacherNavItems;
  else if (userRole === "student") navItems = studentNavItems;

  if (!user || !userRole) return null;

  const activePath = location.pathname;

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">S</div>
          <span className="logo-text">STDE Platform</span>
        </div>
        <div className="user-role">
          <span className="role-badge">
            {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
          </span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item${activePath === item.path ? " active" : ""}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}

        <button className="nav-item logout-btn" onClick={handleLogoutClick}>
          <svg width="20" height="20" fill="none" stroke="currentColor">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Logout</span>
        </button>
      </nav>

      {/* Custom Logout Modal with Animated Emoji */}
      {showLogoutModal && (
        <div className={`confirm-overlay ${isModalExiting ? 'confirm-overlay-exit' : ''}`}>
          <div className={`confirm-modal ${isModalExiting ? 'confirm-modal-exit' : ''}`}>
            <div className="confirm-glow"></div>
            <div className="confirm-content">
              {/* Animated Emoji instead of icon */}
              <AnimatedEmoji
                mood={hoveredButton === 'logout' ? 'sad' : hoveredButton === 'cancel' ? 'happy' : null}
              />

              <div className="confirm-text">
                <h3 className="confirm-title">Confirm Logout</h3>
                <p className="confirm-message">Are you sure you want to logout?</p>
              </div>

              <div className="confirm-buttons">
                <button
                  className="confirm-btn confirm-btn-cancel"
                  onClick={handleLogoutCancel}
                  onMouseEnter={() => setHoveredButton('cancel')}
                  onMouseLeave={() => setHoveredButton(null)}
                >
                  Cancel
                </button>
                <button
                  className="confirm-btn confirm-btn-danger"
                  onClick={handleLogoutConfirm}
                  onMouseEnter={() => setHoveredButton('logout')}
                  onMouseLeave={() => setHoveredButton(null)}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}