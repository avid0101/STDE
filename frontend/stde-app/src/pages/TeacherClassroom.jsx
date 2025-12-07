import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import classroomService from "../services/classroomService";
import "../css/TeacherClassroom.css";

console.log("TeacherClassroom loaded");

export default function TeacherClassroom() {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassroom, setNewClassroom] = useState({
    name: "",
    code: "",
    section: ""
  });

  const [classrooms, setClassrooms] = useState([]); 
  const [loading, setLoading] = useState(true);

  // Load classes on mount
  useEffect(() => {
    loadClassrooms();
  }, []);

  const loadClassrooms = async () => {
    try {
      const data = await classroomService.getAllClassrooms();
      
      // Process data to add UI-specific properties (Color, Stats) 
      // since these aren't stored in the DB yet
      const processedData = data.map(cls => ({
        ...cls,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`, // Random color generator
        students: 0, // Placeholder
        active: 0    // Placeholder
      }));

      setClassrooms(processedData);
    } catch (error) {
      console.error("Failed to load classes", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    try {
      // Call the API with the MANUAL Class Code
      const createdClass = await classroomService.createClassroom({
        name: newClassroom.name,
        section: newClassroom.section,
        classCode: newClassroom.code // <--- Sending the manual code
      });

      // Add UI properties to the new class so it displays immediately
      const classWithUI = {
        ...createdClass,
        students: 0,
        active: 0,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`
      };

      // Update UI with real data
      setClassrooms([...classrooms, classWithUI]); 
      setShowCreateModal(false);
      setNewClassroom({ name: "", code: "", section: ""});
      alert(`Class created! Drive Folder ID: ${createdClass.driveFolderId}`);
    } catch (err) {
      alert("Error creating class: " + err);
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
          <button 
            className="create-btn"
            onClick={() => setShowCreateModal(true)}
          >
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
              <div 
                className="classroom-card-header"
                style={{ backgroundColor: classroom.color }}
              >
                <div className="classroom-pattern"></div>
              </div>
              <div className="classroom-card-body">
                <h3 className="classroom-name">{classroom.name}</h3>
                {/* Updated to use 'classCode' from backend entity */}
                <p className="classroom-code">{classroom.classCode} • {classroom.section}</p>
                <div className="classroom-stats">
                  <div className="stat-item">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{classroom.students} students</span>
                  </div>
                  <div className="stat-item">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{classroom.active} active</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create New Classroom</h2>
                <button 
                  className="modal-close"
                  onClick={() => setShowCreateModal(false)}
                >
                  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <form onSubmit={handleCreateClassroom}>
                <div className="form-group">
                  <label>Classroom Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Software Testing 101"
                    value={newClassroom.name}
                    onChange={(e) => setNewClassroom({...newClassroom, name: e.target.value})}
                    required
                  />
                </div>
                
                {/* Manual Class Code Input */}
                <div className="form-group">
                  <label>Course Code</label>
                  <input
                    type="text"
                    placeholder="e.g., CS401-2025"
                    value={newClassroom.code}
                    onChange={(e) => setNewClassroom({...newClassroom, code: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Section</label>
                  <input
                    type="text"
                    placeholder="e.g., Section A"
                    value={newClassroom.section}
                    onChange={(e) => setNewClassroom({...newClassroom, section: e.target.value})}
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-create">
                    Create Classroom
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