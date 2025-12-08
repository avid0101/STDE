import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import classroomService from "../services/classroomService";
import "../css/TeacherClassroom.css";

export default function TeacherClassroom() {
  const navigate = useNavigate();
  
  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    section: "",
    folderId: "" 
  });

  const [classrooms, setClassrooms] = useState([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClassrooms();
  }, []);

  const getConsistentColor = (str) => {
    const colors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#db2777', '#0891b2'];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const loadClassrooms = async () => {
    try {
      const data = await classroomService.getAllClassrooms();
      const processedData = data.map(cls => ({
        ...cls,
        color: getConsistentColor(cls.name + cls.section),
      }));
      setClassrooms(processedData);
    } catch (error) {
      console.error("Failed to load classes", error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({ name: "", code: "", section: "", folderId: "" });
    setIsEditing(false);
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (e, cls) => {
    e.stopPropagation(); 
    setFormData({ 
      name: cls.name, 
      code: cls.classCode, 
      section: cls.section,
      folderId: cls.driveFolderId || "" 
    });
    setIsEditing(true);
    setEditingId(cls.id);
    setShowModal(true);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); 
    if (!window.confirm("Are you sure you want to delete this class? This will also delete the Google Drive folder.")) return;

    try {
      await classroomService.deleteClassroom(id);
      loadClassrooms(); 
    } catch (err) {
      alert("Error deleting class: " + err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        section: formData.section,
        classCode: formData.code,
        driveFolderId: formData.folderId 
      };

      if (isEditing) {
        await classroomService.updateClassroom(editingId, payload);
        alert("Class updated successfully!");
      } else {
        await classroomService.createClassroom(payload);
        alert("Class created successfully!");
      }

      setShowModal(false);
      loadClassrooms();
    } catch (err) {
      alert(`Error ${isEditing ? 'updating' : 'creating'} class: ` + err);
    }
  };

  const handleClassroomClick = (id) => {
    navigate(`/classroom/${id}`);
  };

  return (
    <>
      <Sidebar />
      <div className="teacher-classroom">
        <div className="classroom-header">
          <div>
            <h1 className="classroom-title">My Classrooms</h1>
            <p className="classroom-subtitle">Manage your courses and student submissions</p>
          </div>
          <button className="create-btn" onClick={openCreateModal}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Create Classroom
          </button>
        </div>

        <div className="classroom-grid">
          {classrooms.map((classroom) => (
            <div 
              key={classroom.id} 
              className="classroom-card"
              onClick={() => handleClassroomClick(classroom.id)}
            >
              <div className="classroom-card-header" style={{ backgroundColor: classroom.color }}>
                <div className="classroom-pattern"></div>
                
                <div className="card-actions" style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px' }}>
                  <button 
                    onClick={(e) => openEditModal(e, classroom)}
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer', color: 'white' }}
                    title="Edit Class"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button 
                    onClick={(e) => handleDelete(e, classroom.id)}
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer', color: '#fca5a5' }}
                    title="Delete Class"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="classroom-card-body">
                <h3 className="classroom-name">{classroom.name}</h3>
                <p className="classroom-code">{classroom.classCode} • {classroom.section}</p>
                <div className="classroom-stats">
                  <div className="stat-item">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{classroom.studentCount || 0} students</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{isEditing ? "Edit Classroom" : "Create New Classroom"}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Classroom Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Software Testing 101"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Course Code</label>
                  <input
                    type="text"
                    placeholder="e.g., CS401-2025"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Section</label>
                  <input
                    type="text"
                    placeholder="e.g., Section A"
                    value={formData.section}
                    onChange={(e) => setFormData({...formData, section: e.target.value})}
                    required
                  />
                </div>

                {!isEditing && (
                  <div className="form-group">
                    <label>Google Drive Folder ID (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="Leave empty to auto-create folder"
                      value={formData.folderId}
                      onChange={(e) => setFormData({...formData, folderId: e.target.value})}
                      style={{fontFamily: 'monospace'}}
                    />
                    <small style={{display: 'block', marginTop: '4px', color: '#64748b', fontSize: '0.8rem'}}>
                      Paste the ID from the URL of your existing Drive folder to link it.
                    </small>
                  </div>
                )}

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-create">
                    {isEditing ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}