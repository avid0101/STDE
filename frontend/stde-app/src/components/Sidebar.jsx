import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import authService from "../services/authService";
import "../css/Sidebar.css";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // null by default

  // On mount: get user data
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      const role = currentUser.userType?.toLowerCase();
      setUserRole(role); // "teacher" or "student"
    } else {
      setUser(null);
      setUserRole(null);
    }
  }, []);

  // Logout handler
  const handleLogout = () => {
    authService.logout();
    // Safer: always send to student login for now
    navigate("/login/student");
  };

  // Teacher navigation items
  const teacherNavItems = [
    {
      path: "/teacher/classroom",
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor">
          <path d="M12 14l9-5-9-5-9 5 9 5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      label: "Classroom"
    },
    {
    path: "/teacher/profile", // same as for students if you want a shared profile page
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor">
        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: "Profile"
    }
  ];

  // Student navigation items
  const studentNavItems = [
    {
      path: "/ai-evaluate",
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor">
          <path d="M9.663 17h4.673M12 3v1M6.343 5.343l-.707-.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      label: "AI Evaluate"
    },
    {
      path: "/classroom",
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor">
          <circle cx="12" cy="7" r="4" strokeWidth="2" />
          <path d="M5 21a7 7 0 0114 0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      label: "Classroom"
    },
    {
      path: "/profile",
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor">
          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      label: "Profile"
    }
  ];

  // Decide which nav to use
  let navItems = [];
  if (userRole === "teacher") navItems = teacherNavItems;
  else if (userRole === "student") navItems = studentNavItems;

  // If user data is missing, render nothing (safe fallback)
  if (!user || !userRole) return null;

  // Path highlighting
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

        <button 
          className="nav-item logout-btn" 
          onClick={handleLogout}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Logout</span>
        </button>
      </nav>
    </div>
  );
}
