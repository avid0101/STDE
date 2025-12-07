import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import classroomService from "../services/classroomService";
import documentService from "../services/documentService"; 
import evaluationService from "../services/evaluationService";
import "../css/ClassroomDetails.css"; 

export default function ClassroomDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [classroom, setClassroom] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('submissions');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState(null); 
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    loadClassroomData();
  }, [id]);

  const loadClassroomData = async () => {
    try {
      const all = await classroomService.getAllClassrooms();
      const cls = all.find(c => c.id === id);
      setClassroom(cls);

      const realDocs = await documentService.getDocumentsByClass(id);
      
      const tableData = realDocs.map(doc => ({
        id: doc.id,
        studentName: doc.studentName || "Unknown Uploader", 
        filename: doc.filename,
        driveFileId: doc.driveFileId, // ✅ Add driveFileId for opening in browser
        score: doc.overallScore !== null ? doc.overallScore : "-", 
        status: doc.status,
        date: new Date(doc.uploadDate).toLocaleDateString()
      }));

      setSubmissions(tableData);

    } catch (error) {
      console.error("Error fetching class details", error);
      setSubmissions([]); 
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrive = () => {
    if (classroom && classroom.driveFolderId) {
      window.open(`https://drive.google.com/drive/folders/${classroom.driveFolderId}`, '_blank');
    } else {
      alert("No Google Drive folder linked to this class.");
    }
  };

  const handleViewReport = async (documentId, filename) => {
    setModalLoading(true);
    setReportData(null);
    setShowReportModal(true);

    try {
        const data = await evaluationService.getDetailedEvaluation(documentId);
        setReportData({ ...data, filename });
    } catch (error) {
        console.error("Error viewing report:", error);
        setReportData({ error: true, message: error.message, filename });
    } finally {
        setModalLoading(false);
    }
  };

  const handleOverride = async (documentId, currentScore) => {
    const newScore = prompt(`Enter new Professor Score (0-100) to override current score of ${currentScore}:`);

    if (newScore === null) return; 
    
    const scoreInt = parseInt(newScore);

    if (isNaN(scoreInt) || scoreInt < 0 || scoreInt > 100) {
      alert("Invalid score. Please enter a number between 0 and 100.");
      return;
    }
    
    try {
      const response = await evaluationService.overrideScore(documentId, scoreInt);
      
      alert(`Score successfully updated to ${response.evaluation.overallScore}!`);
      
      loadClassroomData(); 

    } catch (error) {
      console.error("Override failed:", error);
      alert("Error overriding score: " + (error.message || "Unauthorized or invalid input."));
    }
  };

  // ✅ NEW: Handler to open document in Google Drive viewer
  const handleOpenDocument = (driveFileId) => {
    if (driveFileId) {
      window.open(`https://drive.google.com/file/d/${driveFileId}/view`, '_blank');
    } else {
      alert("Document file ID not available.");
    }
  };

  const getStatusStyle = (status) => {
    const statusStyles = {
      'OVERRIDDEN': { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fbbf24' },
      'EVALUATED': { backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #60a5fa' },
      'COMPLETED': { backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #34d399' },
      'UPLOADED': { backgroundColor: '#f3f4f6', color: '#4b5563', border: '1px solid #d1d5db' },
      'PENDING': { backgroundColor: '#f3f4f6', color: '#4b5563', border: '1px solid #d1d5db' }
    };
    return statusStyles[status] || statusStyles['PENDING'];
  };

  if (loading) return <div className="loading">Loading Class Details...</div>;
  if (!classroom) return <div className="error">Classroom not found.</div>;

  return (
    <>
      <Sidebar />
      <div className="teacher-classroom">
        
        {/* HEADER SECTION */}
        <div className="classroom-header-details">
          <button onClick={() => navigate(-1)} className="back-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
          
          <div className="header-content">
            <div className="header-info">
              <h1 className="classroom-title">{classroom.name}</h1>
              <p className="classroom-subtitle">{classroom.section}</p>
              
              <div className="class-code-badge">
                <span className="badge-label">Class Code:</span>
                <span className="badge-code">{classroom.classCode}</span>
              </div>
            </div>

            <button className="drive-btn" onClick={handleOpenDrive}>
              <svg width="20" height="20" viewBox="0 0 87.3 78">
                <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="M43.65 25l13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2l13.75 23.8z" fill="#00ac47"/>
                <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l3.85-6.65c.8-1.4 1.2-2.95 1.2-4.5h-27.5l13.75 23.8z" fill="#ea4335"/>
                <path d="M43.65 25L29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-26.6 46.1c-.8 1.35-1.2 2.9-1.2 4.5h27.5L43.65 25z" fill="#00832d"/>
                <path d="M59.7 53.05h27.5c0-1.55-.4-3.1-1.2-4.5L59.4 2.45c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.05 28.05z" fill="#2684fc"/>
                <path d="M73.4 76.8L59.7 53.05H27.5l13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h18.5c1.6 0 3.15-.45 4.5-1.2z" fill="#ffba00"/>
              </svg>
              Open Class Folder
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'submissions' ? 'active-tab' : ''}`} 
            onClick={() => setActiveTab('submissions')}
          >
            Submissions
          </button>
          <button 
            className={`tab-btn ${activeTab === 'students' ? 'active-tab' : ''}`} 
            onClick={() => setActiveTab('students')}
          >
            Students
          </button>
        </div>

        {/* SUBMISSIONS TABLE */}
        {activeTab === 'submissions' && (
          <div className="table-container">
            {submissions.length === 0 ? (
              <div className="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <p>No submissions found for this class.</p>
              </div>
            ) : (
              <table className="submissions-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Document</th>
                    <th>Date</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th className="actions-header">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => (
                    <tr key={sub.id}>
                      <td className="student-name">{sub.studentName}</td>
                      <td className="document-name">
                        <button 
                          className="document-link"
                          onClick={() => handleOpenDocument(sub.driveFileId)}
                          title="Open document in Google Drive"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10 9 9 9 8 9"/>
                          </svg>
                          {sub.filename}
                        </button>
                      </td>
                      <td className="date">{sub.date}</td>
                      <td>
                        {sub.score !== "-" ? (
                          <span className={`score-badge ${sub.score > 75 ? 'high-score' : 'low-score'}`}>
                            {sub.score}
                          </span>
                        ) : (
                          <span className="no-score">-</span>
                        )}
                      </td>
                      <td>
                        <span className="status-badge" style={getStatusStyle(sub.status)}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button 
                          className="action-btn view-btn" 
                          onClick={() => handleViewReport(sub.id, sub.filename)}
                        >
                          View Report
                        </button>
                        <button 
                          className="action-btn override-btn" 
                          onClick={() => handleOverride(sub.id, sub.score)}
                        >
                          Override
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* STUDENTS TAB */}
        {activeTab === 'students' && (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
            <p>Student Roster functionality coming soon.</p>
          </div>
        )}

      </div>

      {/* MODAL COMPONENT */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Evaluation Report</h2>
                    <button className="modal-close" onClick={() => setShowReportModal(false)}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                </div>
                
                <div className="modal-body">
                    {modalLoading && (
                      <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading detailed report...</p>
                      </div>
                    )}
                    
                    {!modalLoading && reportData && reportData.error && (
                        <div className="error-state">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                          <p>Error: {reportData.message}</p>
                          <p className="error-hint">Make sure the document has been evaluated by the AI.</p>
                        </div>
                    )}

                    {!modalLoading && reportData && !reportData.error && (
                        <div className="report-content">
                            <div className="report-header-section">
                              <h3 className="report-filename">{reportData.filename}</h3>
                              <div className="overall-score-display">
                                <span className="score-label">Overall Score</span>
                                <span className={`score-value ${reportData.overallScore >= 75 ? 'high' : 'low'}`}>
                                  {reportData.overallScore}%
                                </span>
                              </div>
                            </div>
                            
                            {reportData.overallFeedback && (
                              <div className="feedback-section">
                                <h4>Overall Feedback</h4>
                                <p>{reportData.overallFeedback}</p>
                              </div>
                            )}
                            
                            {/* Display individual metric scores */}
                            {(reportData.completenessScore !== null || reportData.clarityScore !== null || 
                              reportData.consistencyScore !== null || reportData.verificationScore !== null) && (
                              <div className="metrics-section">
                                <h4>Evaluation Metrics</h4>
                                <div className="metrics-grid">
                                  {reportData.completenessScore !== null && (
                                    <div className="metric-card">
                                      <div className="metric-header">
                                        <span className="metric-name">Completeness</span>
                                        <span className={`metric-score ${reportData.completenessScore >= 75 ? 'high' : reportData.completenessScore >= 50 ? 'medium' : 'low'}`}>
                                          {reportData.completenessScore}%
                                        </span>
                                      </div>
                                      {reportData.completenessFeedback && (
                                        <p className="metric-feedback">{reportData.completenessFeedback}</p>
                                      )}
                                    </div>
                                  )}
                                  
                                  {reportData.clarityScore !== null && (
                                    <div className="metric-card">
                                      <div className="metric-header">
                                        <span className="metric-name">Clarity</span>
                                        <span className={`metric-score ${reportData.clarityScore >= 75 ? 'high' : reportData.clarityScore >= 50 ? 'medium' : 'low'}`}>
                                          {reportData.clarityScore}%
                                        </span>
                                      </div>
                                      {reportData.clarityFeedback && (
                                        <p className="metric-feedback">{reportData.clarityFeedback}</p>
                                      )}
                                    </div>
                                  )}
                                  
                                  {reportData.consistencyScore !== null && (
                                    <div className="metric-card">
                                      <div className="metric-header">
                                        <span className="metric-name">Consistency</span>
                                        <span className={`metric-score ${reportData.consistencyScore >= 75 ? 'high' : reportData.consistencyScore >= 50 ? 'medium' : 'low'}`}>
                                          {reportData.consistencyScore}%
                                        </span>
                                      </div>
                                      {reportData.consistencyFeedback && (
                                        <p className="metric-feedback">{reportData.consistencyFeedback}</p>
                                      )}
                                    </div>
                                  )}
                                  
                                  {reportData.verificationScore !== null && (
                                    <div className="metric-card">
                                      <div className="metric-header">
                                        <span className="metric-name">Verification</span>
                                        <span className={`metric-score ${reportData.verificationScore >= 75 ? 'high' : reportData.verificationScore >= 50 ? 'medium' : 'low'}`}>
                                          {reportData.verificationScore}%
                                        </span>
                                      </div>
                                      {reportData.verificationFeedback && (
                                        <p className="metric-feedback">{reportData.verificationFeedback}</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            <div className="report-footer">
                              <div className="footer-item">
                                <span className="footer-label">Evaluation ID:</span>
                                <span className="footer-value">{reportData.id}</span>
                              </div>
                              {reportData.createdAt && (
                                <div className="footer-item">
                                  <span className="footer-label">Evaluated:</span>
                                  <span className="footer-value">{new Date(reportData.createdAt).toLocaleString()}</span>
                                </div>
                              )}
                              {reportData.documentId && (
                                <div className="footer-item">
                                  <span className="footer-label">Document ID:</span>
                                  <span className="footer-value">{reportData.documentId}</span>
                                </div>
                              )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </>
  );
}