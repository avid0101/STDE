import { useState, useEffect } from 'react';
import authService from '../services/authService';
import api from '../services/api'; // Direct API access for new endpoints
import '../css/StudentDashboard.css'; 

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'logs', 'health'
  
  // Data States
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [health, setHealth] = useState(null);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        // Use the new AdminController endpoint path or existing service
        const data = await api.get('/admin/users');
        setUsers(data.data);
      } else if (activeTab === 'logs') {
        const data = await api.get('/admin/logs');
        setLogs(data.data);
      } else if (activeTab === 'health') {
        const data = await api.get('/admin/health');
        setHealth(data.data);
      }
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId, field, value) => {
    try {
      await api.patch(`/admin/users/${userId}`, { [field]: value });
      loadData(); // Refresh list
    } catch (e) {
      alert("Update failed");
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem' }}> 
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div className="header" style={{marginBottom: '2rem'}}>
          <h1 className="page-title" style={{color: '#1f2937'}}>Admin Console</h1>
          <div style={{display:'flex', gap:'1rem', marginTop:'1rem'}}>
            <TabButton label="User Management" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
            <TabButton label="Activity Logs" active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
            <TabButton label="System Health" active={activeTab === 'health'} onClick={() => setActiveTab('health')} />
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="my-uploads-section" style={{marginLeft: 0, padding: '2rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
            
            {/* USERS TAB */}
            {activeTab === 'users' && (
              <>
                <h2 className="section-title" style={{color: '#1f2937'}}>Registered Users</h2>
                {loading ? <p style={{color: '#4b5563'}}>Loading...</p> : (
                  <table style={{width: '100%', borderCollapse: 'collapse'}}>
                    <thead>
                      <tr style={{textAlign:'left', backgroundColor: '#f9fafb'}}>
                        <th style={{padding:'12px', color:'#374151', fontWeight: '600'}}>Name</th>
                        <th style={{padding:'12px', color:'#374151', fontWeight: '600'}}>Email</th>
                        <th style={{padding:'12px', color:'#374151', fontWeight: '600'}}>Role</th>
                        <th style={{padding:'12px', color:'#374151', fontWeight: '600'}}>Status</th>
                        <th style={{padding:'12px', color:'#374151', fontWeight: '600'}}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} style={{borderTop:'1px solid #e5e7eb'}}>
                          <td style={{padding:'12px', color:'#1f2937'}}>{u.firstname} {u.lastname}</td>
                          <td style={{padding:'12px', color:'#4b5563'}}>{u.email}</td>
                          <td style={{padding:'12px'}}>
                             <select 
                               value={u.userType}
                               onChange={(e) => handleUpdateUser(u.id, 'userType', e.target.value)}
                               style={{padding:'6px 10px', borderRadius:'6px', border:'1px solid #d1d5db', color:'#1f2937', backgroundColor:'white'}}
                             >
                               <option value="STUDENT">Student</option>
                               <option value="TEACHER">Teacher</option>
                               <option value="ADMIN">Admin</option>
                             </select>
                          </td>
                          <td style={{padding:'12px'}}>
                            <span style={{
                              padding:'4px 12px', borderRadius:'6px', fontSize:'0.875rem', fontWeight: '500',
                              background: u.isActive ? '#dcfce7' : '#fee2e2',
                              color: u.isActive ? '#166534' : '#991b1b'
                            }}>
                              {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{padding:'12px'}}>
                            <button 
                              onClick={() => handleUpdateUser(u.id, 'isActive', !u.isActive)}
                              style={{cursor:'pointer', color:'#2563eb', border:'none', background:'none', fontWeight:'500', textDecoration:'underline'}}
                            >
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}

            {/* LOGS TAB */}
            {activeTab === 'logs' && (
              <>
                <h2 className="section-title" style={{color: '#1f2937'}}>System Activity Logs</h2>
                {loading ? <p style={{color: '#4b5563'}}>Loading...</p> : (
                  <table style={{width: '100%', borderCollapse: 'collapse'}}>
                    <thead>
                      <tr style={{textAlign:'left', backgroundColor: '#f9fafb'}}>
                        <th style={{padding:'12px', color:'#374151', fontWeight: '600'}}>Time</th>
                        <th style={{padding:'12px', color:'#374151', fontWeight: '600'}}>Action</th>
                        <th style={{padding:'12px', color:'#374151', fontWeight: '600'}}>User</th>
                        <th style={{padding:'12px', color:'#374151', fontWeight: '600'}}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => (
                        <tr key={log.id} style={{borderTop:'1px solid #e5e7eb'}}>
                          <td style={{padding:'12px', fontSize:'0.875rem', color:'#6b7280'}}>
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td style={{padding:'12px'}}>
                            <span style={{fontWeight:'600', fontSize:'0.875rem', color:'#1f2937'}}>{log.action}</span>
                          </td>
                          <td style={{padding:'12px', color:'#4b5563'}}>{log.userEmail}</td>
                          <td style={{padding:'12px', color:'#6b7280'}}>{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}

            {/* HEALTH TAB */}
            {activeTab === 'health' && (
              <>
                <h2 className="section-title" style={{color: '#1f2937'}}>System Health Status</h2>
                {loading || !health ? <p style={{color: '#4b5563'}}>Checking systems...</p> : (
                  <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1.5rem'}}>
                    <HealthCard title="Database" status={health.database} />
                    <HealthCard title="OpenAI GPT-4o" status={health.openai} />
                    <HealthCard title="Google API" status={health.googleApi} />
                  </div>
                )}
              </>
            )}

        </div>
      </div>
    </div>
  );
}

// Helpers
const TabButton = ({ label, active, onClick }) => (
  <button 
    onClick={onClick}
    style={{
      padding: '0.75rem 1.5rem',
      borderRadius: '8px',
      border: active ? 'none' : '1px solid #e5e7eb',
      background: active ? '#2563eb' : 'white',
      color: active ? 'white' : '#374151',
      cursor: 'pointer',
      fontWeight: '600',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      transition: 'all 0.2s ease'
    }}
  >
    {label}
  </button>
);

const HealthCard = ({ title, status }) => {
  const isUp = status && status.startsWith("UP");
  return (
    <div style={{padding:'1.5rem', borderRadius:'12px', border:'1px solid #e5e7eb', background:'white', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'}}>
      <h3 style={{margin:'0 0 0.5rem 0', fontSize:'1rem', color:'#6b7280', fontWeight:'600'}}>{title}</h3>
      <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
        <div style={{width:'12px', height:'12px', borderRadius:'50%', background: isUp ? '#22c55e' : '#ef4444'}}></div>
        <span style={{fontWeight:'700', fontSize:'1.25rem', color: isUp ? '#15803d' : '#b91c1c'}}>{status}</span>
      </div>
    </div>
  );
};