import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/AIEvaluate.css';
import documentService from '../services/documentService';
import authService from '../services/authService';

export default function AIEvaluate() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upload');
  const [dragActive, setDragActive] = useState(false);
  
  // NEW: Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);

  // NEW: Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  // NEW: Load user's documents
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

  // UPDATED: Now actually uploads the file
  const handleFile = async (file) => {
    // Clear previous messages
    setUploadError('');
    setUploadSuccess('');

    if (!file) {
      setUploadError('Please select a file');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type. Only PDF, DOCX, and TXT files are allowed.');
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('File size exceeds 10MB limit.');
      return;
    }

    try {
      setUploading(true);
      console.log('Uploading file:', file.name);

      const response = await documentService.uploadDocument(file);
      console.log('Upload response:', response);

      setUploadSuccess(`Document "${file.name}" uploaded successfully!`);

      // Reload documents list
      await loadDocuments();

      // Clear success message after 5 seconds
      setTimeout(() => {
        setUploadSuccess('');
      }, 5000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleGoogleLink = () => {
    console.log('Google Link clicked');
    // Add your Google Link logic here later
    alert('Google Drive integration coming soon!');
  };

  // NEW: Delete document
  const handleDeleteDocument = async (documentId, filename) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"?`)) {
      return;
    }

    try {
      await documentService.deleteDocument(documentId);
      setUploadSuccess(`Document "${filename}" deleted successfully!`);
      await loadDocuments();

      setTimeout(() => {
        setUploadSuccess('');
      }, 3000);
    } catch (error) {
      setUploadError(error.message || 'Failed to delete document');
    }
  };

  // NEW: Helper functions
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getFileIcon = (fileType) => {
    if (fileType === 'application/pdf') return '📄';
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return '📝';
    if (fileType === 'text/plain') return '📃';
    return '📎';
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="ai-evaluate-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">S</div>
            <span className="logo-text">STDE Platform</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link to="/ai-evaluate" className="nav-item active">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>AI Evaluate</span>
          </Link>

          <button className="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 14l9-5-9-5-9 5 9 5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Classroom</span>
          </button>

          <Link to="/profile" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Profile</span>
          </Link>

          <button className="nav-item" onClick={handleLogout}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Logout</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="header">
          <div className="breadcrumb">
            <span className="breadcrumb-item">Pages</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-item">AI Evaluate</span>
          </div>
          <h1 className="page-title">AI Evaluate</h1>
        </div>

        {/* NEW: Success/Error Messages */}
        {uploadError && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            {uploadError}
            <button className="alert-close" onClick={() => setUploadError('')}>×</button>
          </div>
        )}

        {uploadSuccess && (
          <div className="alert alert-success">
            <span className="alert-icon">✅</span>
            {uploadSuccess}
            <button className="alert-close" onClick={() => setUploadSuccess('')}>×</button>
          </div>
        )}

        {/* Statistics Cards */}
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
              <div className="stat-change positive">+{documents.length} uploaded</div>
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
              <div className="stat-value">0</div>
              <div className="stat-change positive">+0% than last month</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-label">Avg Score</div>
              <div className="stat-value">0</div>
              <div className="stat-change negative">-0% than yesterday</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-label">Total Analysis</div>
              <div className="stat-value">0</div>
              <div className="stat-change positive">+0% than yesterday</div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="upload-section">
          <h2 className="section-title">Upload Testing Documentation</h2>
          
          <div className="upload-tabs">
            <button 
              className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Upload File
            </button>
            <button 
              className={`tab-btn ${activeTab === 'google' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('google');
                handleGoogleLink();
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Google Link
            </button>
          </div>

          <div 
            className={`drop-zone ${dragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="drop-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="drop-text">
              {uploading ? 'Uploading...' : 'Drop your testing documentation here'}
            </p>
            <p className="drop-subtext">Supported formats: PDF, DOCX, TXT (Max 10MB)</p>
            <input 
              type="file" 
              id="file-input" 
              accept=".pdf,.docx,.txt" 
              onChange={handleFileInput}
              disabled={uploading}
              style={{ display: 'none' }}
            />
            <button 
              className="select-file-btn"
              onClick={() => document.getElementById('file-input').click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Select File'}
            </button>
          </div>
        </div>

        {/* My Uploads Section - UPDATED */}
        <div className="my-uploads-section">
          <div className="section-header">
            <h2 className="section-title">My Uploads</h2>
            <button className="view-all-btn">
              View all
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          
          <div className="uploads-list">
            {loadingDocuments ? (
              <p className="no-uploads">Loading documents...</p>
            ) : documents.length === 0 ? (
              <p className="no-uploads">No uploads yet. Start by uploading your first document.</p>
            ) : (
              <div className="documents-grid">
                {documents.map((doc) => (
                  <div key={doc.id} className="document-card">
                    <div className="document-icon-large">
                      {getFileIcon(doc.fileType)}
                    </div>
                    <div className="document-details">
                      <h3 className="document-filename">{doc.filename}</h3>
                      <p className="document-meta">
                        {formatFileSize(doc.fileSize)} • {formatDate(doc.uploadDate)}
                      </p>
                      <span className={`document-badge status-${doc.status.toLowerCase()}`}>
                        {doc.status}
                      </span>
                    </div>
                    <div className="document-actions">
                      <button 
                        className="action-btn"
                        onClick={() => handleDeleteDocument(doc.id, doc.filename)}
                        title="Delete"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}