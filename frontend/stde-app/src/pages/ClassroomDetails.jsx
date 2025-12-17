import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useToast } from '../components/ToastContext';
import classroomService from "../services/classroomService";
import documentService from "../services/documentService";
import evaluationService from "../services/evaluationService";
import authService from "../services/authService";
import { APP_ID, GOOGLE_API_KEY } from '../services/configuration';
import "../css/ClassroomDetails.css";

export default function ClassroomDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [classroom, setClassroom] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('submissions');

  // Usage Stats State (Student Only)
  const [usageStats, setUsageStats] = useState(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const user = authService.getCurrentUser();
  const isTeacher = user?.userType === 'TEACHER';
  const toast = useToast();

  useEffect(() => {
    loadClassroomData();
    if (!isTeacher) {
      loadGoogleScript();
      loadUsageStats();
    }
  }, [id]);

  useEffect(() => {
    if (activeTab === 'students' && students.length === 0 && isTeacher) {
      loadStudents();
    }
  }, [activeTab]);

  const loadUsageStats = async () => {
    try {
      const stats = await evaluationService.getUsageStats();
      setUsageStats(stats);
    } catch (error) {
      console.error("Failed to load usage stats", error);
    }
  };

  const loadGoogleScript = () => {
    if (!window.gapi) {
      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/api.js";
      script.onload = () => {
        window.gapi.load('picker', () => console.log("Picker loaded"));
      };
      document.body.appendChild(script);
    }
  };

  const loadClassroomData = async () => {
    try {
      const all = await classroomService.getAllClassrooms();
      let cls;
      if (isTeacher) {
        cls = all.find(c => c.id === id);
      } else {
        const studentClasses = await classroomService.getStudentClassrooms();
        cls = studentClasses.find(c => c.id === id);
      }
      setClassroom(cls);

      const realDocs = await documentService.getDocumentsByClass(id);
      const tableData = realDocs.map(doc => ({
        id: doc.id,
        studentName: doc.studentName || "Unknown Uploader",
        filename: doc.filename,
        driveFileId: doc.driveFileId,
        score: doc.overallScore !== null ? doc.overallScore : "-",
        status: doc.status,
        isSubmitted: doc.isSubmitted,
        date: new Date(doc.uploadDate).toLocaleDateString() + ' ' + new Date(doc.uploadDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
      setSubmissions(tableData);
    } catch (error) {
      console.error("Error fetching details", error);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  // ... (Keep handleFileUpload, handleGoogleImport, pickerCallback from previous step)
  // [OMITTED FOR BREVITY - PLEASE KEEP THE UPLOAD LOGIC]
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      await documentService.uploadDocument(file, id);
      toast.success('Document Uploaded Successfully!');
      setShowUploadModal(false);
      loadClassroomData();
    } catch (error) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleGoogleImport = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/auth/token', {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      const data = await response.json();
      if (window.google && window.google.picker) {
        new window.google.picker.PickerBuilder()
          .addView(window.google.picker.ViewId.DOCS)
          .setOAuthToken(data.token)
          .setDeveloperKey(GOOGLE_API_KEY)
          .setAppId(APP_ID)
          .setCallback(pickerCallback)
          .build().setVisible(true);
      }
    } catch (error) { toast.error('Could not open Google Drive'); }
  };

  const pickerCallback = async (data) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const doc = data.docs[0];
      setUploading(true);
      try {
        await documentService.uploadDriveFile(doc.id, id);
        toast.success(`Imported "${doc.name}" successfully!`);
        setShowUploadModal(false);
        loadClassroomData();
      } catch (error) { toast.error('Failed to import from Drive'); } finally { setUploading(false); }
    }
  };

  const loadStudents = async () => {
    try {
      const data = await classroomService.getClassStudents(id);
      setStudents(data);
    } catch (error) { console.error("Error loading students:", error); }
  };

  const handleAnalyze = async (documentId) => {
    // Check usage stats before calling API (Optimistic UI check)
    if (usageStats && usageStats.remaining <= 0) {
      toast.warning(`Quota exceeded! Please wait ${Math.ceil(usageStats.resetInSeconds / 60)} minutes.`);
      return;
    }

    if (!window.confirm("Run AI Analysis? This uses 1 quota token.")) return;
    setProcessingId(documentId);
    try {
      await evaluationService.evaluateDocument(documentId);
      toast.success('Analysis complete!');
      loadClassroomData();
      loadUsageStats(); // Refresh stats
    } catch (error) {
      toast.error('Analysis failed: ' + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  // ... (Keep other handlers: handleSubmit, handleViewReport, handleOverride, handleOpenDocument, getStatusStyle, handleOpenDrive)
  const handleSubmit = async (documentId) => {
    if (!window.confirm("Submit this document? You cannot change it afterwards.")) return;
    setProcessingId(documentId);
    try { await documentService.submitDocument(documentId); toast.success('Document submitted successfully!'); loadClassroomData(); } catch (error) { toast.error(error.message); } finally { setProcessingId(null); }
  };
  const handleViewReport = async (documentId, filename) => {
    setModalLoading(true); setReportData(null); setShowReportModal(true);
    try { const data = await evaluationService.getDetailedEvaluation(documentId); setReportData({ ...data, filename }); } catch (error) { setReportData({ error: true, message: error.message, filename }); } finally { setModalLoading(false); }
  };
  const handleOverride = async (documentId, currentScore) => {
    const newScore = prompt("Enter new score (0-100):"); if (newScore === null) return;
    try { await evaluationService.overrideScore(documentId, parseInt(newScore)); toast.success('Score updated successfully!'); loadClassroomData(); } catch (e) { toast.error(e.message); }
  };
  const handleOpenDocument = (fid) => window.open(`https://drive.google.com/file/d/${fid}/view`, '_blank');
  const getStatusStyle = (s, sub) => { if (sub) return { backgroundColor: '#d1fae5', color: '#065f46' }; if (s === 'COMPLETED') return { backgroundColor: '#dbeafe', color: '#1e40af' }; return { backgroundColor: '#f3f4f6', color: '#4b5563' }; };
  const handleOpenDrive = () => window.open(`https://drive.google.com/drive/folders/${classroom.driveFolderId}`, '_blank');

  if (loading) return <div className="loading">Loading...</div>;
  if (!classroom) return <div className="error">Classroom not found.</div>;

  return (
    <>
      <Sidebar />
      <div className="teacher-classroom">

        <div className="classroom-header-details">
          <button onClick={() => navigate(-1)} className="back-btn">Back</button>

          <div className="header-content">
            <div className="header-info">
              <h1 className="classroom-title">{classroom.name}</h1>
              <p className="classroom-subtitle">{classroom.section}</p>
              <div className="class-code-badge">
                <span className="badge-label">Class Code:</span>
                <span className="badge-code">{classroom.classCode}</span>
              </div>
            </div>

            {isTeacher ? (
              <button className="drive-btn" onClick={handleOpenDrive}>Open Class Folder</button>
            ) : (
              <button
                className="drive-btn"
                onClick={() => setShowUploadModal(true)}
                style={{ backgroundColor: '#2563eb', color: 'white', borderColor: '#2563eb' }}
              >
                Upload Document
              </button>
            )}
          </div>
        </div>

        {/* Usage Banner for Students */}
        {!isTeacher && usageStats && (
          <div style={{
            background: 'linear-gradient(90deg, #f8fafc, #f1f5f9)',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '1rem 1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>ANALYSIS QUOTA</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <div style={{
                  height: '8px', width: '150px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(usageStats.used / usageStats.limit) * 100}%`,
                    background: usageStats.used >= usageStats.limit ? '#ef4444' : '#3b82f6',
                    transition: 'width 0.3s'
                  }}></div>
                </div>
                <span style={{ fontWeight: 'bold', color: '#1e293b' }}>
                  {usageStats.remaining} / {usageStats.limit} left
                </span>
              </div>
            </div>
            {usageStats.resetInSeconds > 0 && usageStats.used > 0 && (
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Resets in <span style={{ fontWeight: '600' }}>{Math.ceil(usageStats.resetInSeconds / 60)} mins</span>
              </div>
            )}
          </div>
        )}

        {/* Tabs & Table (Keep exactly the same) */}
        <div className="tabs-container">
          <button className={`tab-btn ${activeTab === 'submissions' ? 'active-tab' : ''}`} onClick={() => setActiveTab('submissions')}>
            {isTeacher ? "Submissions" : "My Work"}
          </button>
          {isTeacher && <button className={`tab-btn ${activeTab === 'students' ? 'active-tab' : ''}`} onClick={() => setActiveTab('students')}>Students</button>}
        </div>

        {activeTab === 'submissions' && (
          <div className="table-container">
            {submissions.length === 0 ? <div className="empty-state"><p>No documents found.</p></div> : (
              <table className="submissions-table">
                <thead><tr>{isTeacher && <th>Student</th>}<th>Document</th><th>Date</th><th>Score</th><th>Status</th><th className="actions-header">Actions</th></tr></thead>
                <tbody>
                  {submissions.map((sub) => (
                    <tr key={sub.id}>
                      {isTeacher && <td className="student-name">{sub.studentName}</td>}
                      <td><button className="document-link" onClick={() => handleOpenDocument(sub.driveFileId)}>{sub.filename}</button></td>
                      <td className="date">{sub.date}</td>
                      <td>{sub.score !== "-" ? <span className={`score-badge ${sub.score > 75 ? 'high-score' : 'low-score'}`}>{sub.score}</span> : <span className="no-score">-</span>}</td>
                      <td><span className="status-badge" style={getStatusStyle(sub.status, sub.isSubmitted)}>{sub.isSubmitted ? "SUBMITTED" : sub.status === 'COMPLETED' ? "EVALUATED" : "DRAFT"}</span></td>
                      <td className="actions-cell">
                        {isTeacher ? (
                          <>
                            <button className="action-btn view-btn" onClick={() => handleViewReport(sub.id, sub.filename)}>View</button>
                            <button className="action-btn override-btn" onClick={() => handleOverride(sub.id, sub.score)}>Override</button>
                          </>
                        ) : (
                          <>
                            {!sub.isSubmitted && (
                              <button
                                className="action-btn"
                                onClick={() => handleAnalyze(sub.id)}
                                // Disable if quota full or processing
                                disabled={processingId === sub.id || (usageStats && usageStats.remaining <= 0)}
                                style={{
                                  backgroundColor: (usageStats && usageStats.remaining <= 0) ? '#94a3b8' : '#3b82f6',
                                  color: 'white',
                                  border: 'none',
                                  marginRight: '8px',
                                  cursor: (usageStats && usageStats.remaining <= 0) ? 'not-allowed' : 'pointer'
                                }}
                              >
                                {processingId === sub.id ? '...' : 'Analyze'}
                              </button>
                            )}
                            {sub.status === 'COMPLETED' && <button className="action-btn" onClick={() => handleViewReport(sub.id, sub.filename)} style={{ marginRight: '8px' }}>View</button>}
                            {sub.status === 'COMPLETED' && !sub.isSubmitted && <button className="action-btn" onClick={() => handleSubmit(sub.id)} disabled={processingId === sub.id} style={{ backgroundColor: '#10b981', color: 'white', border: 'none' }}>Turn In</button>}
                            {sub.isSubmitted && <span style={{ color: '#059669', fontSize: '0.85rem', fontWeight: '600' }}>Turned In</span>}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ... (Students Tab Content) ... */}
        {activeTab === 'students' && isTeacher && (
          <div className="table-container">
            {students.length === 0 ? <div className="empty-state"><p>No students.</p></div> : (
              <table className="submissions-table">
                <thead><tr><th>Student Name</th><th>Email</th><th>Action</th></tr></thead>
                <tbody>{students.map((s) => (<tr key={s.id}><td className="student-name">{s.name}</td><td>{s.email}</td><td><button className="action-btn" disabled>Remove</button></td></tr>))}</tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal (Same as before) */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header"><h2>Upload Document</h2><button className="modal-close" onClick={() => setShowUploadModal(false)}>×</button></div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
              {uploading ? <p>Uploading...</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <label className="select-file-btn" style={{ cursor: 'pointer', display: 'block' }}>Choose Local File<input type="file" accept=".pdf,.docx,.txt" style={{ display: 'none' }} onChange={handleFileUpload} /></label>
                  <div style={{ margin: '0.5rem 0', color: '#9ca3af' }}>OR</div>
                  <button className="select-file-btn" style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', color: '#374151' }} onClick={handleGoogleImport}>Import from Drive</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal (Keep existing) */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1000px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header"><h2>Evaluation Report</h2><button className="modal-close" onClick={() => setShowReportModal(false)}>×</button></div>
            <div className="modal-body" style={{ overflowY: 'auto', padding: '2rem', flex: 1, minHeight: 0, maxHeight: 'calc(90vh - 80px)' }}>
              {modalLoading ? <div className="loading-state"><div className="spinner"></div><p>Loading...</p></div> :
                reportData && reportData.error ? <div className="error-state"><p>{reportData.message}</p></div> :
                  (
                    <div className="report-content">
                      <h3>{reportData?.filename}</h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                        <ScoreBadge label="Overall" score={reportData.overallScore} isPrimary={true} />
                        <ScoreBadge label="Completeness" score={reportData.completenessScore} />
                        <ScoreBadge label="Clarity" score={reportData.clarityScore} />
                        <ScoreBadge label="Consistency" score={reportData.consistencyScore} />
                        <ScoreBadge label="Verification" score={reportData.verificationScore} />
                      </div>
                      <div style={{ backgroundColor: '#799292ff', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}><h4>Overall Assessment</h4><p >{reportData.overallFeedback}</p></div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <FeedbackCard title="Completeness" score={reportData.completenessScore} feedback={reportData.completenessFeedback} color="#8b5cf6" />
                        <FeedbackCard title="Clarity" score={reportData.clarityScore} feedback={reportData.clarityFeedback} color="#06b6d4" />
                        <FeedbackCard title="Consistency" score={reportData.consistencyScore} feedback={reportData.consistencyFeedback} color="#10b981" />
                        <FeedbackCard title="Verification" score={reportData.verificationScore} feedback={reportData.verificationFeedback} color="#f59e0b" />
                      </div>
                    </div>
                  )
              }
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Helpers
const ScoreBadge = ({ label, score, isPrimary }) => {
  const getScoreColor = (score) => { if (score >= 85) return '#10b981'; if (score >= 70) return '#f59e0b'; return '#ef4444'; };
  return (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: isPrimary ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : '#ffffff', padding: '1.25rem', borderRadius: '10px', border: isPrimary ? 'none' : '2px solid #e2e8f0', minWidth: '100px', flex: 1 }}> <span style={{ fontSize: '24px', fontWeight: 'bold', color: isPrimary ? '#ffffff' : getScoreColor(score) }}>{score}</span> <span style={{ fontSize: '0.7rem', color: isPrimary ? '#dbeafe' : '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>{label}</span> </div>);
};
const FeedbackCard = ({ title, score, feedback, color }) => (<div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem', position: 'relative', overflow: 'hidden' }}> <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: color }}></div> <div style={{ paddingLeft: '0.75rem' }}> <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}> <h4 style={{ margin: 0 }}>{title}</h4> <span style={{ fontWeight: 'bold', color: color }}>{score}%</span> </div> <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>{feedback}</p> </div> </div>);