import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import authService from '../services/authService';
import evaluationService from '../services/evaluationService';
import documentService from '../services/documentService';
import '../css/StudentDashboard.css'; 

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(authService.getCurrentUser());
  const [recentEvaluations, setRecentEvaluations] = useState([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Fetch History & Doc counts in parallel
      const [historyData, docsData] = await Promise.all([
        evaluationService.getUserEvaluations(),
        documentService.getUserDocuments()
      ]);
      
      setRecentEvaluations(historyData.slice(0, 5)); // Show last 5
      setTotalDocs(docsData.count || docsData.documents?.length || 0);
    } catch (error) {
      console.error("Dashboard load failed:", error);
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
          <h1 className="page-title">{getGreeting()}, {user?.firstname}!</h1>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
           <div className="stat-card">
            <div className="stat-icon blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-label">Total Documents</div>
              <div className="stat-value">{totalDocs}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                 <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-label">Evaluations Run</div>
              <div className="stat-value">{recentEvaluations.length}</div>
            </div>
          </div>
        </div>

        {/* Quick Action */}
        <div className="upload-section" style={{textAlign: 'center', padding: '3rem'}}>
          <h3>Ready to work?</h3>
          <p style={{color: '#6b7280', marginBottom: '1.5rem'}}>Go to your classroom to upload and analyze new documents.</p>
          <button 
            className="select-file-btn" 
            onClick={() => navigate('/classroom')}
            style={{display: 'inline-block'}}
          >
            Go to Classrooms
          </button>
        </div>

        {/* Recent Activity */}
        <div className="my-uploads-section">
            <div className="section-header">
              <h2 className="section-title">Recent Evaluations</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {loading ? <p style={{color:'#666', padding:'1rem'}}>Loading activity...</p> : 
               recentEvaluations.length === 0 ? <p style={{color:'#666', padding:'1rem'}}>No recent activity.</p> :
               recentEvaluations.map((evalItem) => (
                <div key={evalItem.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.95rem', color: '#334155' }}>{evalItem.filename || 'Unknown File'}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                      Score: <strong style={{color: evalItem.overallScore > 75 ? '#10b981' : '#f59e0b'}}>{evalItem.overallScore}</strong> • {new Date(evalItem.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
        </div>
      </div>
    </div>
  );
}