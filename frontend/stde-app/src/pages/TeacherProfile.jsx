import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import authService from '../services/authService';
import '../css/Profile.css';

export default function TeacherProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalClassrooms: 0,
    totalStudents: 0,
    activeClassrooms: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user data from localStorage
    const userData = authService.getCurrentUser();
    if (userData) {
      setUser(userData);
      // TODO: Fetch teacher stats from API
      fetchTeacherStats(userData.id);
    }
    setLoading(false);
  }, []);

  const fetchTeacherStats = async (teacherId) => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/teachers/${teacherId}/stats`);
      // const data = await response.json();
      
      // Mock data for now
      setStats({
        totalClassrooms: 3,
        totalStudents: 45,
        activeClassrooms: 2
      });
    } catch (error) {
      console.error('Error fetching teacher stats:', error);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login/teacher');
  };

  if (loading || !user) {
    return (
      <div className="ai-evaluate-container">
        <Sidebar />
        <div className="main-content">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-evaluate-container">
      <Sidebar />

      <div className="main-content">
        <div className="header">
          <div className="breadcrumb">
            <span className="breadcrumb-item">Pages</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-item">Profile</span>
          </div>
          <h1 className="page-title">Teacher Profile</h1>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div className="stat-card" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '1.5rem',
            borderRadius: '12px',
            color: 'white'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalClassrooms}</div>
            <div style={{ opacity: 0.9, marginTop: '0.5rem' }}>Total Classrooms</div>
          </div>

          <div className="stat-card" style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            padding: '1.5rem',
            borderRadius: '12px',
            color: 'white'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalStudents}</div>
            <div style={{ opacity: 0.9, marginTop: '0.5rem' }}>Total Students</div>
          </div>

          <div className="stat-card" style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            padding: '1.5rem',
            borderRadius: '12px',
            color: 'white'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.activeClassrooms}</div>
            <div style={{ opacity: 0.9, marginTop: '0.5rem' }}>Active Classrooms</div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="profile-card">
          {/* Avatar Section */}
          <div className="profile-header">
            <div className="avatar-section">
              <div className="avatar-large">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Profile" />
                ) : (
                  <span className="avatar-initials">
                    {user.firstname?.charAt(0)}{user.lastname?.charAt(0)}
                  </span>
                )}
              </div>
              <div className="user-info">
                <h2 className="user-name">{user.firstname} {user.lastname}</h2>
                <p className="user-role">
                  <svg width="16" height="16" fill="currentColor" style={{ marginRight: '0.5rem', display: 'inline' }}>
                    <path d="M12 14l9-5-9-5-9 5 9 5z"/>
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
                  </svg>
                  Teacher
                </p>
              </div>
            </div>
          </div>

          {/* Information Section */}
          <div className="profile-body">
            <h3 className="section-title">Account Information</h3>
            
            <div className="info-grid">
              <div className="info-item">
                <label className="info-label">First Name</label>
                <div className="info-value">{user.firstname}</div>
              </div>

              <div className="info-item">
                <label className="info-label">Last Name</label>
                <div className="info-value">{user.lastname}</div>
              </div>

              <div className="info-item">
                <label className="info-label">Email Address</label>
                <div className="info-value">{user.email}</div>
              </div>

              <div className="info-item">
                <label className="info-label">Account Type</label>
                <div className="info-value">
                  <span className="badge badge-green">
                    TEACHER
                  </span>
                </div>
              </div>

              <div className="info-item">
                <label className="info-label">User ID</label>
                <div className="info-value info-value-small">{user.id}</div>
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="profile-footer">
            <button className="logout-btn" onClick={handleLogout}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m7 14l5-5-5-5m5 5H9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}