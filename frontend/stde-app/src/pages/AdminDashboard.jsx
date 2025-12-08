import { useState, useEffect } from 'react';
import authService from '../services/authService';
import '../css/StudentDashboard.css'; 

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUsers();
    // For documentation purposes, this component serves both the Dashboard and User Management pages.
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.getAllUsers();
      setUsers(data);
    } catch (err) {
      setError("Failed to fetch users: " + err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (userId, field, value) => {
    const userToUpdate = users.find(u => u.id === userId);
    
    // Optimistic UI update
    setUsers(prevUsers => prevUsers.map(u => 
        u.id === userId ? { ...u, [field]: value } : u
    ));
    
    try {
      const newUserType = field === 'userType' ? value : userToUpdate.userType;
      const newIsActive = field === 'isActive' ? value : userToUpdate.isActive;
      
      await authService.updateUserRoleAndStatus(
        userId, 
        newUserType, 
        newIsActive
      );
      
      console.log(`User ${userId} updated successfully.`);

    } catch (err) {
      alert("Update failed: " + err);
      loadUsers(); // Reload to revert failed change and show server's state
    }
  };

  const getStatusStyle = (isActive) => ({
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '0.875rem',
    backgroundColor: isActive ? '#d1fae5' : '#fee2e2',
    color: isActive ? '#065f46' : '#991b1b',
  });

  return (
    // Replaced 'ai-evaluate-container' with a simple full-page container
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem' }}> 
      
      {/* Removed <Sidebar /> */}
      
      {/* Replaced 'main-content' with a full-width container */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="header">
          <div className="breadcrumb">
            <span className="breadcrumb-item">System</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-item">Admin Dashboard</span>
          </div>
          <h1 className="page-title">System Administration & User Management</h1>
        </div>

        {/* This section fulfills the 'Users' view (Section 8.1.2) */}
        <div className="my-uploads-section" style={{marginLeft: 0, padding: '2rem'}}>
            <div className="section-header">
              <h2 className="section-title">User Management ({users.length} Total Users)</h2>
            </div>
            
            {error && <div className="alert alert-error">{error}</div>}
            
            {loading ? <p style={{padding:'1rem', color:'#666'}}>Loading users...</p> : (
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                  <tr>
                    <th style={{textAlign:'left', padding:'1rem', color:'#64748b', borderBottom: '2px solid #e2e8f0'}}>Name</th>
                    <th style={{textAlign:'left', padding:'1rem', color:'#64748b', borderBottom: '2px solid #e2e8f0'}}>Email</th>
                    <th style={{textAlign:'left', padding:'1rem', color:'#64748b', borderBottom: '2px solid #e2e8f0'}}>Role</th>
                    <th style={{textAlign:'left', padding:'1rem', color:'#64748b', borderBottom: '2px solid #e2e8f0'}}>Status</th>
                    <th style={{textAlign:'left', padding:'1rem', color:'#64748b', borderBottom: '2px solid #e2e8f0'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} style={{borderBottom: '1px solid #e2e8f0'}}>
                      <td style={{padding:'1rem', fontWeight:'600', color: '#1e293b'}}>{user.firstname} {user.lastname}</td>
                      <td style={{padding:'1rem', color: '#334155'}}>{user.email}</td>
                      
                      {/* Role Selector (Reassign roles) */}
                      <td style={{padding:'1rem'}}>
                        <select
                          value={user.userType}
                          onChange={(e) => handleUpdate(user.id, 'userType', e.target.value)}
                          style={{padding: '0.4rem', borderRadius: '4px', border: '1px solid #d1d5db', backgroundColor: '#fff'}}
                        >
                          <option value="STUDENT">STUDENT</option>
                          <option value="TEACHER">TEACHER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                      
                      {/* Status Display (Active/Deactivate) */}
                      <td style={{padding:'1rem'}}>
                        <span style={getStatusStyle(user.isActive)}>
                           {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>

                      {/* Toggle Button (Approve or Deactivate accounts) */}
                      <td style={{padding:'1rem'}}>
                         <button
                           onClick={() => handleUpdate(user.id, 'isActive', !user.isActive)}
                           style={{
                               padding:'0.4rem 0.8rem', 
                               borderRadius:'6px', 
                               border:'1px solid #d1d5db', 
                               background:'white', 
                               color: user.isActive ? '#dc2626' : '#059669',
                               cursor:'pointer', 
                               fontSize:'0.85rem',
                               fontWeight: '500'
                           }}
                         >
                           {user.isActive ? 'Deactivate' : 'Activate'}
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>
    </div>
  );
}