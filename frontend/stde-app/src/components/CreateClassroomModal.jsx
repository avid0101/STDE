import { useState } from 'react';
import '../css/CreateClassroomModal.css'; // Make sure to create this CSS file

export default function CreateClassroomModal({ isOpen, onClose, onCreate }) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    section: '',
    schedule: ''
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate required fields
    if (!formData.name || !formData.code) return;
    
    // Pass data back to parent
    onCreate(formData);
    
    // Reset form
    setFormData({ name: '', code: '', section: '', schedule: '' });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <h2>Create New Classroom</h2>
          <button className="close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            
            {/* Classroom Name */}
            <div className="form-group">
              <label htmlFor="name">Classroom Name <span className="required">*</span></label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="e.g., Software Testing 101"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Classroom Code */}
            <div className="form-group">
              <label htmlFor="code">Classroom Code <span className="required">*</span></label>
              <input
                type="text"
                id="code"
                name="code"
                placeholder="e.g., CS401-2025"
                value={formData.code}
                onChange={handleChange}
                required
              />
              <p className="helper-text">Students will use this code to join your classroom</p>
            </div>

            {/* Section */}
            <div className="form-group">
              <label htmlFor="section">Section</label>
              <input
                type="text"
                id="section"
                name="section"
                placeholder="e.g., Section A"
                value={formData.section}
                onChange={handleChange}
              />
            </div>

            {/* Schedule */}
            <div className="form-group">
              <label htmlFor="schedule">Schedule</label>
              <input
                type="text"
                id="schedule"
                name="schedule"
                placeholder="e.g., MWF 10:00 AM - 11:30 AM"
                value={formData.schedule}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="modal-footer">
            <button type="submit" className="btn-primary">Create Classroom</button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}