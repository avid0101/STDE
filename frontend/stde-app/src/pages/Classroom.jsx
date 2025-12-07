import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import classroomService from '../services/classroomService';
import '../css/Classroom.css';

export default function Classroom() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Join Modal State
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const data = await classroomService.getStudentClassrooms();
      
      const classesWithColor = data.map(cls => ({
        ...cls,
        color: getConsistentColor(cls.name + cls.section)
      }));
      setClasses(classesWithColor);
    } catch (error) {
      console.error("Error loading classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async (e) => {
    e.preventDefault();
    setJoinError('');
    setJoining(true);

    try {
      await classroomService.joinClassroom(classCode);
      setShowJoinModal(false);
      setClassCode('');
      loadClasses(); // Refresh list to see new class immediately
      alert("Successfully joined the class!");
    } catch (error) {
      setJoinError(error);
    } finally {
      setJoining(false);
    }
  };

  // Helper to generate consistent colors based on class info
  const getConsistentColor = (str) => {
    const colors = ['#2563eb', '#a21caf', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Navigate to class details
  const handleClassClick = (classId) => {
    navigate(`/classroom/${classId}`);
  };

  return (
    <div className="ai-evaluate-container">
      <Sidebar />
      <div className="main-content">
        <div className="header">
          <div className="breadcrumb">
            <span className="breadcrumb-item">Pages</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-item">Classroom</span>
          </div>
          <h1 className="page-title">Classroom</h1>
        </div>

        <div className="classroom-header">
          <button className="join-class-btn" onClick={() => setShowJoinModal(true)}>
            + Join Classroom
          </button>
        </div>

        <div className="section-title" style={{ marginTop: 12 }}>My Classes</div>

        {loading ? (
          <p>Loading classes...</p>
        ) : classes.length === 0 ? (
          <div className="empty-state">
            <p>You haven't joined any classes yet.</p>
          </div>
        ) : (
          <div className="class-cards-grid">
            {classes.map(cls => (
              <div 
                key={cls.id} 
                className="class-card" 
                onClick={() => handleClassClick(cls.id)}
                style={{ cursor: 'pointer' }}
              >
                <div
                  className="class-card-banner"
                  style={{ background: cls.color }}
                >
                  <div className="class-card-initials">
                    {cls.name.substring(0, 2).toUpperCase()}
                  </div>
                </div>
                <div className="class-card-details">
                  <div className="class-card-title">{cls.name}</div>
                  <div className="class-card-instructor">{cls.section}</div>
                  <div className="class-card-code">Code: {cls.classCode}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Join Class Modal */}
        {showJoinModal && (
          <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
              <div className="modal-header">
                <h2>Join a Classroom</h2>
                <button className="modal-close" onClick={() => setShowJoinModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleJoinClass}>
                  <div className="form-group">
                    <label>Class Code</label>
                    <input 
                      type="text" 
                      placeholder="Enter code provided by teacher"
                      value={classCode}
                      onChange={(e) => setClassCode(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        marginBottom: '1rem'
                      }}
                    />
                  </div>
                  {joinError && <div style={{ color: 'red', marginBottom: '1rem', fontSize: '0.9rem' }}>{joinError}</div>}
                  <button 
                    type="submit" 
                    className="join-class-btn" 
                    style={{ width: '100%', borderRadius: '6px' }}
                    disabled={joining}
                  >
                    {joining ? 'Joining...' : 'Join'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}