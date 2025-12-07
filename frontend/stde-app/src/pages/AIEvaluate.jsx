import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_ID, GOOGLE_API_KEY } from '../services/configuration';

import Sidebar from '../components/Sidebar';
import '../css/AIEvaluate.css';
import documentService from '../services/documentService';
import evaluationService from '../services/evaluationService';
import classroomService from '../services/classroomService';
import authService from '../services/authService';

export default function AIEvaluate() {
  const navigate = useNavigate();
  const resultsRef = useRef(null);

  const [activeTab, setActiveTab] = useState('upload');
  const [dragActive, setDragActive] = useState(false);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);

  // Classroom State
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');

  // Evaluation state
  const [currentResult, setCurrentResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorObj, setErrorObj] = useState(null);
  const [analyzingId, setAnalyzingId] = useState(null);

  useEffect(() => {
    loadDocuments();
    fetchHistory();
    loadClasses();
    loadGoogleScript();
  }, []);

  const loadGoogleScript = () => {
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.onload = () => {
      window.gapi.load('picker', () => {
        console.log("Google Picker API loaded");
      });
    };
    document.body.appendChild(script);
  };

  const handleGoogleLink = async () => {
    setUploadError('');
    try {
      const response = await fetch('http://localhost:8080/api/auth/token', {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` } 
      });
      
      if (!response.ok) throw new Error("Failed to authenticate with Google");
      const data = await response.json();
      const userToken = data.token;

      if (window.google && window.google.picker) {
        const picker = new window.google.picker.PickerBuilder()
          .addView(window.google.picker.ViewId.DOCS)
          .setOAuthToken(userToken)
          .setDeveloperKey(GOOGLE_API_KEY)
          .setAppId(APP_ID)
          .setCallback(pickerCallback)
          .build();
        picker.setVisible(true);
      }
    } catch (error) {
      console.error(error);
      setUploadError("Could not open Google Drive. Please try re-logging in.");
    }
  };

  const pickerCallback = async (data) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const doc = data.docs[0];
      const fileId = doc.id;
      const fileName = doc.name;

      try {
        setUploading(true);
        setUploadSuccess(`Importing "${fileName}" from Drive...`);
        await documentService.uploadDriveFile(fileId, selectedClassId);
        setUploadSuccess(`Successfully imported "${fileName}"!`);
        loadDocuments();
      } catch (error) {
        setUploadError("Failed to import file from Drive.");
      } finally {
        setUploading(false);
      }
    }
  };

  const loadClasses = async () => {
    try {
      const data = await classroomService.getAllClassrooms();
      setClasses(data);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadDocuments = async () => {
    try {
      setLoadingDocuments(true);
      const response = await documentService.getUserDocuments();
      setDocuments(response.documents || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const data = await evaluationService.getUserEvaluations();
      setHistory(data);
    } catch (err) {
      console.error("Failed to load history", err);
    }
  };

  const handleRunEvaluation = async (docId) => {
    setLoading(true);
    setAnalyzingId(docId);
    setErrorObj(null);
    setCurrentResult(null);

    try {
      const data = await evaluationService.evaluateDocument(docId);
      setCurrentResult(data);
      fetchHistory();
      
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err) {
      const rawMsg = err.message || "Unknown error";
      if (rawMsg.includes("TYPE:")) {
        const [type, msg] = rawMsg.replace("TYPE:", "").split("|");
        setErrorObj({ type, message: msg });
      } else {
        setErrorObj({ type: 'UNKNOWN', message: rawMsg });
      }
    } finally {
      setLoading(false);
      setAnalyzingId(null);
    }
  };

  const handleGetEvaluation = async (documentId) => {
    setLoading(true);
    setErrorObj(null);
    setCurrentResult(null);
    try {
      const data = await evaluationService.getEvaluation(documentId);
      setCurrentResult(data);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setErrorObj({ type: 'FETCH_ERROR', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const getErrorStyle = (type) => {
    switch (type) {
      case 'RATE_LIMIT': return { bg: '#fff7ed', border: '#f97316', color: '#c2410c', icon: 'Rate Limit' };
      case 'DUPLICATE': return { bg: '#eff6ff', border: '#3b82f6', color: '#1d4ed8', icon: 'Info' };
      case 'SERVER_ERROR': return { bg: '#fef2f2', border: '#ef4444', color: '#b91c1c', icon: 'Server Error' };
      default: return { bg: '#fef2f2', border: '#ef4444', color: '#991b1b', icon: 'Warning' };
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    setUploadError('');
    setUploadSuccess('');

    if (!file) {
      setUploadError('Please select a file');
      return;
    }
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type. Only PDF, DOCX, and TXT files are allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit.');
      return;
    }

    try {
      setUploading(true);
      await documentService.uploadDocument(file, selectedClassId);
      setUploadSuccess(`Document "${file.name}" uploaded successfully!`);
      if (selectedClassId) {
        const cls = classes.find(c => c.id === selectedClassId);
        if (cls) setUploadSuccess(`Document uploaded to "${cls.name}" folder in Drive!`);
      }
      await loadDocuments();
      setTimeout(() => setUploadSuccess(''), 5000);
    } catch (error) {
      setUploadError(error.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId, filename) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"?`)) return;
    try {
      await documentService.deleteDocument(documentId);
      setUploadSuccess(`Document "${filename}" deleted successfully!`);
      await loadDocuments();
      setTimeout(() => setUploadSuccess(''), 3000);
    } catch (error) {
      setUploadError(error.message || 'Failed to delete document');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getFileIcon = (fileType) => {
    if (fileType === 'application/pdf') return 'PDF';
    if (fileType?.includes('word')) return 'DOCX';
    if (fileType === 'text/plain') return 'TXT';
    return 'FILE';
  };

  return (
    <div className="ai-evaluate-container">
      <Sidebar />

      <div className="main-content">
        <div className="header">
          <div className="breadcrumb">
            <span className="breadcrumb-item">Pages</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-item">AI Evaluate</span>
          </div>
          <h1 className="page-title">AI Evaluate</h1>
        </div>

        {uploadError && (
          <div className="alert alert-error">
            <span className="alert-icon">Warning:</span> {uploadError}
            <button className="alert-close" onClick={() => setUploadError('')}>×</button>
          </div>
        )}
        {uploadSuccess && (
          <div className="alert alert-success">
            <span className="alert-icon">Success:</span> {uploadSuccess}
            <button className="alert-close" onClick={() => setUploadSuccess('')}>×</button>
          </div>
        )}

        <div className="stats-grid">
           <div className="stat-card">
            <div className="stat-icon black">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-label">Documents</div>
              <div className="stat-value">{documents.length}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon pink">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                 <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-label">Evaluations</div>
              <div className="stat-value">{history.length}</div>
            </div>
          </div>
        </div>

        <div className="upload-section">
          <h2 className="section-title">Upload Testing Documentation</h2>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151', fontSize: '0.9rem' }}>
              Select Destination Class (Folder)
            </label>
            <select 
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
            >
              <option value="">-- No Class (Upload to My Drive Root) --</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name} - {cls.section}</option>
              ))}
            </select>
          </div>

          <div className="upload-tabs">
            <button 
              className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`} 
              onClick={() => setActiveTab('upload')}
              style={{ fontWeight: '600' }}
            >
              Upload Local File
            </button>
            <button 
              className={`tab-btn ${activeTab === 'google' ? 'active' : ''}`} 
              onClick={() => { setActiveTab('google'); handleGoogleLink(); }}
              style={{ fontWeight: '600' }}
            >
              Select from Google Drive
            </button>
          </div>

          <div 
            className={`drop-zone ${dragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          >
            <div className="drop-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="drop-text">{uploading ? 'Processing...' : 'Drop files here or click select'}</p>
            <input type="file" id="file-input" accept=".pdf,.docx,.txt" onChange={handleFileInput} disabled={uploading} style={{ display: 'none' }} />
            <button className="select-file-btn" onClick={() => document.getElementById('file-input').click()} disabled={uploading}>
              {uploading ? 'Please wait...' : 'Select File'}
            </button>
          </div>
        </div>

        <div ref={resultsRef}>
          {errorObj && (
             <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: getErrorStyle(errorObj.type).bg, border: `1px solid ${getErrorStyle(errorObj.type).border}`, color: getErrorStyle(errorObj.type).color, borderRadius: '6px' }}>
              <strong>{getErrorStyle(errorObj.type).icon}:</strong> {errorObj.message}
            </div>
          )}

          {currentResult && (
            <div className="upload-section" style={{ border: '2px solid #3b82f6', background: 'linear-gradient(to bottom, #ffffff, #f8fafc)' }}>
              <h2 className="section-title">Analysis Result</h2>
              
              {/* Score Cards */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                <ScoreBadge label="Overall" score={currentResult.overallScore} isPrimary={true} />
                <ScoreBadge label="Completeness" score={currentResult.completenessScore} />
                <ScoreBadge label="Clarity" score={currentResult.clarityScore} />
                <ScoreBadge label="Consistency" score={currentResult.consistencyScore} />
                <ScoreBadge label="Verification" score={currentResult.verificationScore} />
              </div>

              {/* Overall Feedback */}
              <div style={{ 
                backgroundColor: '#eff6ff', 
                border: '1px solid #bfdbfe', 
                borderRadius: '8px', 
                padding: '1rem', 
                marginBottom: '1.5rem' 
              }}>
                <h3 style={{ 
                  fontSize: '0.95rem', 
                  fontWeight: '600', 
                  color: '#1e40af', 
                  marginBottom: '0.5rem' 
                }}>
                  Overall Assessment
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#1e3a8a', lineHeight: '1.6', margin: 0 }}>
                  {currentResult.overallFeedback}
                </p>
              </div>

              {/* Detailed Feedback Sections */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FeedbackCard 
                  title="Completeness" 
                  score={currentResult.completenessScore}
                  feedback={currentResult.completenessFeedback}
                  color="#8b5cf6"
                />
                <FeedbackCard 
                  title="Clarity" 
                  score={currentResult.clarityScore}
                  feedback={currentResult.clarityFeedback}
                  color="#06b6d4"
                />
                <FeedbackCard 
                  title="Consistency" 
                  score={currentResult.consistencyScore}
                  feedback={currentResult.consistencyFeedback}
                  color="#10b981"
                />
                <FeedbackCard 
                  title="Verification" 
                  score={currentResult.verificationScore}
                  feedback={currentResult.verificationFeedback}
                  color="#f59e0b"
                />
              </div>

              {/* Metadata */}
              <div style={{ 
                marginTop: '1.5rem', 
                padding: '1rem', 
                backgroundColor: '#f1f5f9', 
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.85rem',
                color: '#64748b'
              }}>
                <div>
                  <strong>Document:</strong> {currentResult.filename}
                </div>
                <div>
                  <strong>Analyzed:</strong> {new Date(currentResult.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          
          {/* My Uploads */}
          <div className="my-uploads-section" style={{ marginBottom: 0 }}>
            <div className="section-header">
              <h2 className="section-title">My Uploads</h2>
            </div>
            <div className="uploads-list">
              {loadingDocuments ? <p className="no-uploads">Loading...</p> : documents.length === 0 ? <p className="no-uploads">No uploads yet.</p> : (
                <div className="documents-grid" style={{ gridTemplateColumns: '1fr' }}>
                  {documents.map((doc) => (
                    <div key={doc.id} className="document-card">
                      <div className="document-icon-large" style={{ 
                        backgroundColor: '#e0e7ff', 
                        color: '#4f46e5',
                        fontWeight: '600',
                        fontSize: '0.75rem',
                        padding: '8px',
                        borderRadius: '6px'
                      }}>
                        {getFileIcon(doc.fileType)}
                      </div>
                      <div className="document-details">
                        <h3 className="document-filename">{doc.filename}</h3>
                        <p className="document-meta">{formatFileSize(doc.fileSize)} • {formatDate(doc.uploadDate)}</p>
                        
                        <span className={`document-badge status-${doc.status?.toLowerCase() || 'uploaded'}`} style={{ marginTop: '5px', display: 'inline-block' }}>
                          {doc.status}
                        </span>
                      </div>

                      <div className="document-actions" style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                        
                        <button 
                          className="action-btn"
                          onClick={() => handleRunEvaluation(doc.id)}
                          disabled={loading}
                          title="Run AI Analysis"
                          style={{ 
                            color: 'white', 
                            backgroundColor: '#3b82f6', 
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            minWidth: '85px',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          {analyzingId === doc.id ? (
                             <>
                               <span className="spinner-small" style={{border: '2px solid white', borderTop: '2px solid transparent'}}></span> 
                               Analyzing...
                             </>
                          ) : (
                             <>Analyze</>
                          )}
                        </button>

                        <button 
                          className="action-btn" 
                          onClick={() => handleDeleteDocument(doc.id, doc.filename)} 
                          title="Delete"
                          style={{ 
                            color: 'white', 
                            backgroundColor: '#ef4444', 
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            minWidth: '85px',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* History */}
          <div className="my-uploads-section" style={{ marginBottom: 0 }}>
            <div className="section-header">
              <h2 className="section-title">History</h2>
              <button onClick={fetchHistory} className="view-all-btn">Refresh</button>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {history.map((evalItem) => (
                <div key={evalItem.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>{evalItem.filename || 'Unknown File'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Score: <strong>{evalItem.overallScore}</strong> • {new Date(evalItem.createdAt).toLocaleDateString()}</div>
                  </div>
                  <button 
                    onClick={() => handleGetEvaluation(evalItem.documentId)} 
                    style={{ 
                      padding: '0.5rem 1rem', 
                      backgroundColor: '#3b82f6', 
                      color: 'white',
                      border: 'none', 
                      borderRadius: '6px', 
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer' 
                    }}
                  >
                    View Result
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

const ScoreBadge = ({ label, score, isPrimary }) => {
  const getScoreColor = (score) => {
    if (score >= 85) return '#10b981';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      background: isPrimary ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : '#ffffff',
      padding: isPrimary ? '1.25rem 1.5rem' : '1rem 1.25rem',
      borderRadius: '10px', 
      border: isPrimary ? 'none' : '2px solid #e2e8f0',
      minWidth: isPrimary ? '120px' : '100px',
      boxShadow: isPrimary ? '0 4px 6px -1px rgba(59, 130, 246, 0.3)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    }}>
      <span style={{
        fontSize: isPrimary ? '32px' : '24px', 
        fontWeight: 'bold', 
        color: isPrimary ? '#ffffff' : getScoreColor(score),
        marginBottom: '4px'
      }}>
        {score}
      </span>
      <span style={{
        fontSize: isPrimary ? '0.75rem' : '0.7rem', 
        color: isPrimary ? '#dbeafe' : '#64748b', 
        textTransform: 'uppercase',
        fontWeight: '600',
        letterSpacing: '0.5px'
      }}>
        {label}
      </span>
    </div>
  );
};

const FeedbackCard = ({ title, score, feedback, color }) => (
  <div style={{ 
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '1rem',
    position: 'relative',
    overflow: 'hidden'
  }}>
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '4px',
      height: '100%',
      backgroundColor: color
    }}></div>
    <div style={{ paddingLeft: '0.5rem' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '0.75rem'
      }}>
        <h4 style={{ 
          fontSize: '0.9rem', 
          fontWeight: '600', 
          color: '#1e293b',
          margin: 0
        }}>
          {title}
        </h4>
        <span style={{
          fontSize: '1.1rem',
          fontWeight: 'bold',
          color: color,
          backgroundColor: `${color}15`,
          padding: '2px 10px',
          borderRadius: '12px'
        }}>
          {score}
        </span>
      </div>
      <p style={{ 
        fontSize: '0.85rem', 
        color: '#475569', 
        lineHeight: '1.5',
        margin: 0
      }}>
        {feedback}
      </p>
    </div>
  </div>
);