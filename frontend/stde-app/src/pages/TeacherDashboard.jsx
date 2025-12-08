import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import authService from '../services/authService';
import api from '../services/api'; 
import '../css/StudentDashboard.css'; 

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(authService.getCurrentUser());
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalSubmissions: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/dashboard/teacher');
      setStats(response.data);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Helper to open the document
  const handleOpenDocument = (driveFileId) => {
    if (driveFileId) {
      window.open(`https://drive.google.com/file/d/${driveFileId}/view`, '_blank');
    } else {
      alert("File not accessible.");
    }
  };

  return (
    <div className="ai-evaluate-container">
      <Sidebar />
      <div className="main-content">
        <div className="header">
          <div className="breadcrumb">
            <span className="breadcrumb-item">Pages</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-item">Dashboard</span>
          </div>
          <h1 className="page-title">{getGreeting()}, {user?.lastname}!</h1>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
           <div className="stat-card">
            <div className="stat-icon blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-label">Total Classrooms</div>
              <div className="stat-value">{stats.totalClasses}</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                 <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-label">Total Students</div>
              <div className="stat-value">{stats.totalStudents}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon pink">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                 <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-label">Total Submissions</div>
              <div className="stat-value">{stats.totalSubmissions}</div>
            </div>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="my-uploads-section">
            <div className="section-header">
              <h2 className="section-title">Recent Student Submissions</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
              {loading ? <p style={{padding:'1rem', color:'#666'}}>Loading activity...</p> : 
               stats.recentActivity.length === 0 ? <p style={{padding:'1rem', color:'#666'}}>No submissions yet.</p> :
               (
                 <table className="submissions-table" style={{width: '100%', borderCollapse: 'collapse'}}>
                   <thead>
                     <tr>
                       <th style={{textAlign:'left', padding:'1rem', color:'#64748b', borderBottom: '2px solid #e2e8f0'}}>Student</th>
                       <th style={{textAlign:'left', padding:'1rem', color:'#64748b', borderBottom: '2px solid #e2e8f0'}}>Document</th>
                       <th style={{textAlign:'left', padding:'1rem', color:'#64748b', borderBottom: '2px solid #e2e8f0'}}>Date</th>
                       <th style={{textAlign:'right', padding:'1rem', color:'#64748b', borderBottom: '2px solid #e2e8f0'}}>Action</th>
                     </tr>
                   </thead>
                   <tbody>
                     {stats.recentActivity.map((doc) => (
                       <tr key={doc.id} style={{borderBottom: '1px solid #e2e8f0'}}>
                         {/* ✅ FIXED: Added specific color to override white text */}
                         <td style={{padding:'1rem', fontWeight:'600', color: '#1e293b'}}>{doc.studentName}</td>
                         
                         {/* ✅ FIXED: Made clickable */}
                         <td style={{padding:'1rem'}}>
                            <button 
                                onClick={() => handleOpenDocument(doc.driveFileId)}
                                style={{
                                    background: 'none', 
                                    border: 'none', 
                                    color: '#2563eb', 
                                    cursor: 'pointer', 
                                    textDecoration: 'none', 
                                    fontWeight: '500',
                                    padding: 0,
                                    fontSize: 'inherit'
                                }}
                                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                            >
                                {doc.filename}
                            </button>
                         </td>
                         
                         <td style={{padding:'1rem', color:'#64748b'}}>{new Date(doc.uploadDate).toLocaleDateString()}</td>
                         
                         <td style={{padding:'1rem', textAlign:'right'}}>
                           {/* ✅ FIXED: Added specific color to button text */}
                           <button 
                             onClick={() => navigate(`/classroom/${doc.classroomId}`)}
                             style={{
                                 padding:'0.4rem 0.8rem', 
                                 borderRadius:'6px', 
                                 border:'1px solid #e2e8f0', 
                                 background:'white', 
                                 color: '#334155', // Dark text color
                                 cursor:'pointer', 
                                 fontSize:'0.85rem',
                                 fontWeight: '500'
                             }}
                           >
                             View Class
                           </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               )
              }
            </div>
        </div>
      </div>
    </div>
  );
}