import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import authService from '../services/authService';
import '../css/Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ firstname: "", lastname: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userData = authService.getCurrentUser();
    if (userData) {
      setUser(userData);
      setFormData({ firstname: userData.firstname, lastname: userData.lastname });
    }

    // LISTENER: Waits for the popup to say "Success!"
    const handleMessage = async (event) => {
      // Security Check: Ignore messages from other websites
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'GOOGLE_LINK_SUCCESS') {
        const { token: googleToken, user: googleUser } = event.data;
        
        // 1. Capture the "Professional Name" from the current local session
        const localUser = authService.getCurrentUser();
        const professionalName = {
            firstname: localUser.firstname,
            lastname: localUser.lastname
        };

        try {
          // 2. Switch the browser session to the Google Account (so we have Drive access)
          localStorage.setItem('token', googleToken);

          // 3. IMMEDIATELY update the Google Account's name to match the Professional Name
          // This ensures "GamerKing99" becomes "John Smith" in the database/roster
          const updatedUser = await authService.updateProfile(professionalName);

          // 4. Preserve the Avatar (if local didn't have one, use Google's)
          if (!updatedUser.avatarUrl && googleUser.avatarUrl) {
             updatedUser.avatarUrl = googleUser.avatarUrl;
          }

          // 5. Finalize the Session
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
          
          alert(`Google Drive connected! You are now using ${updatedUser.email} for storage, but appearing as "${updatedUser.firstname} ${updatedUser.lastname}".`);
          
        } catch (error) {
          console.error("Linking failed", error);
          // Revert to local if anything breaks
          localStorage.setItem('token', authService.getToken()); 
          alert("Failed to sync identity with Google account.");
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Cleanup listener when page closes
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnectGoogle = () => {
    // Center the popup on the screen
    const width = 500;
    const height = 600;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    
    // Open the backend endpoint in a popup
    window.open(
      'http://localhost:8080/api/oauth2/login/student', 
      'Connect Google Drive', 
      `width=${width},height=${height},top=${top},left=${left}`
    );
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login/student');
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedUser = await authService.updateProfile(formData);
      setUser(updatedUser);
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      alert("Failed to update profile: " + error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="ai-evaluate-container">
        <Sidebar />
        <div className="main-content"><div className="loading">Loading...</div></div>
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
          <h1 className="page-title">My Profile</h1>
        </div>

        <div className="profile-card">
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
                <p className="user-role">{user.userType}</p>
              </div>
            </div>
            
            {/* CONNECT BUTTON */}
            <button 
                onClick={handleConnectGoogle}
                className="connect-drive-btn"
                style={{
                    padding: '0.6rem 1rem',
                    backgroundColor: '#fff',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    color: '#374151',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '10px',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
            >
                <svg width="18" height="18" viewBox="0 0 87.3 78">
                    <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                    <path d="M43.65 25l13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2l13.75 23.8z" fill="#00ac47"/>
                    <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l3.85-6.65c.8-1.4 1.2-2.95 1.2-4.5h-27.5l13.75 23.8z" fill="#ea4335"/>
                    <path d="M43.65 25L29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-26.6 46.1c-.8 1.35-1.2 2.9-1.2 4.5h27.5L43.65 25z" fill="#00832d"/>
                    <path d="M59.7 53.05h27.5c0-1.55-.4-3.1-1.2-4.5L59.4 2.45c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.05 28.05z" fill="#2684fc"/>
                    <path d="M73.4 76.8L59.7 53.05H27.5l13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h18.5c1.6 0 3.15-.45 4.5-1.2z" fill="#ffba00"/>
                </svg>
                Connect Google Drive
            </button>
          </div>

          <div className="profile-body">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', borderBottom:'2px solid #f3f4f6', paddingBottom:'0.75rem'}}>
              <h3 className="section-title" style={{border:'none', margin:0, padding:0}}>Account Information</h3>
              
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  style={{padding:'0.5rem 1rem', background:'#2563eb', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'500'}}
                >
                  Edit Profile
                </button>
              ) : (
                <div style={{display:'flex', gap:'0.5rem'}}>
                  <button 
                    onClick={() => setIsEditing(false)}
                    style={{padding:'0.5rem 1rem', background:'#e5e7eb', color:'#374151', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'500'}}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    style={{padding:'0.5rem 1rem', background:'#10b981', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'500'}}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
            
            <div className="info-grid">
              <div className="info-item">
                <label className="info-label">First Name</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={formData.firstname}
                    onChange={(e) => setFormData({...formData, firstname: e.target.value})}
                    style={{padding:'0.75rem', borderRadius:'0.5rem', border:'1px solid #d1d5db', fontSize:'1rem'}}
                  />
                ) : (
                  <div className="info-value">{user.firstname}</div>
                )}
              </div>

              <div className="info-item">
                <label className="info-label">Last Name</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={formData.lastname}
                    onChange={(e) => setFormData({...formData, lastname: e.target.value})}
                    style={{padding:'0.75rem', borderRadius:'0.5rem', border:'1px solid #d1d5db', fontSize:'1rem'}}
                  />
                ) : (
                  <div className="info-value">{user.lastname}</div>
                )}
              </div>

              <div className="info-item">
                <label className="info-label">Email Address</label>
                <div className="info-value" style={{backgroundColor: isEditing ? '#f3f4f6' : '#f9fafb', color: isEditing ? '#9ca3af' : 'inherit'}}>
                  {user.email} {isEditing && <span style={{fontSize:'0.75rem'}}>(Cannot be changed)</span>}
                </div>
              </div>

              <div className="info-item">
                <label className="info-label">Account Type</label>
                <div className="info-value">
                  <span className={`badge ${user.userType === 'STUDENT' ? 'badge-blue' : 'badge-green'}`}>
                    {user.userType}
                  </span>
                </div>
              </div>

              <div className="info-item">
                <label className="info-label">User ID</label>
                <div className="info-value info-value-small">{user.id}</div>
              </div>
            </div>
          </div>

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