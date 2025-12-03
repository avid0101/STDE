import React, { useState, useEffect } from 'react';
import evaluationService from '../services/evaluationService';

const TestEvaluation = () => {
  const [documentId, setDocumentId] = useState('');
  const [currentResult, setCurrentResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorObj, setErrorObj] = useState(null); // Changed to object

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await evaluationService.getUserEvaluations();
      setHistory(data);
    } catch (err) {
      console.error("Failed to load history", err);
    }
  };

  const handleRunEvaluation = async () => {
    setLoading(true);
    setErrorObj(null);
    setCurrentResult(null);
    try {
      const data = await evaluationService.evaluateDocument(documentId);
      setCurrentResult(data);
      fetchHistory();
    } catch (err) {
      // Parse Backend Error Format: "TYPE:ERROR_CODE|Human Message"
      const rawMsg = err.message || "Unknown error";
      if (rawMsg.includes("TYPE:")) {
        const [type, msg] = rawMsg.replace("TYPE:", "").split("|");
        setErrorObj({ type, message: msg });
      } else {
        setErrorObj({ type: 'UNKNOWN', message: rawMsg });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGetEvaluation = async (idToFetch) => {
    setLoading(true);
    setErrorObj(null);
    setCurrentResult(null);
    try {
      const id = idToFetch || documentId;
      const data = await evaluationService.getEvaluation(id);
      setCurrentResult(data);
    } catch (err) {
      setErrorObj({ type: 'FETCH_ERROR', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Helper to get color/icon based on error type
  const getErrorStyle = (type) => {
    switch (type) {
      case 'RATE_LIMIT': return { bg: '#fff7ed', border: '#f97316', color: '#c2410c', icon: '⏳' };
      case 'DUPLICATE': return { bg: '#eff6ff', border: '#3b82f6', color: '#1d4ed8', icon: 'ℹ️' };
      case 'SERVER_ERROR': return { bg: '#fef2f2', border: '#ef4444', color: '#b91c1c', icon: '💥' };
      default: return { bg: '#fef2f2', border: '#ef4444', color: '#991b1b', icon: '⚠️' };
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>Backend Verification: AI & History</h1>
          <p style={styles.subtitle}>Modules 7, 8, & 9 Integration Test</p>
        </header>

        <div style={styles.grid}>
          {/* LEFT COLUMN: Actions */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>🚀 Run New Evaluation</h2>
            <div style={styles.formGroup}>
              <label style={styles.label}>Document UUID</label>
              <input
                type="text"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                placeholder="e.g. 550e8400-e29b..."
                style={styles.input}
              />
            </div>
            
            <div style={styles.buttonGroup}>
              <button 
                onClick={handleRunEvaluation} 
                disabled={loading || !documentId}
                style={{...styles.button, ...styles.primaryBtn, opacity: loading ? 0.7 : 1}}
              >
                {loading ? 'Processing...' : 'Run Analysis (POST)'}
              </button>

              <button 
                onClick={() => handleGetEvaluation()} 
                disabled={loading || !documentId}
                style={{...styles.button, ...styles.secondaryBtn}}
              >
                Get Result (GET)
              </button>
            </div>

            {/* ERROR DISPLAY COMPONENT */}
            {errorObj && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: getErrorStyle(errorObj.type).bg,
                border: `1px solid ${getErrorStyle(errorObj.type).border}`,
                color: getErrorStyle(errorObj.type).color,
                borderRadius: '6px',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{fontSize: '1.2rem'}}>{getErrorStyle(errorObj.type).icon}</span>
                <div>
                  <strong style={{display: 'block', fontSize: '0.8rem', opacity: 0.8}}>
                    {errorObj.type.replace('_', ' ')} ERROR
                  </strong>
                  {errorObj.message}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: History */}
          <div style={styles.card}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
              <h2 style={styles.cardTitle}>📜 History (Module 9)</h2>
              <button onClick={fetchHistory} style={styles.iconBtn}>🔄 Refresh</button>
            </div>
            
            <div style={styles.historyList}>
              {history.length === 0 ? (
                <p style={{color: '#666', fontStyle: 'italic'}}>No evaluations found.</p>
              ) : (
                history.map((evalItem) => (
                  <div key={evalItem.id} style={styles.historyItem}>
                    <div>
                      <div style={styles.historyName}>{evalItem.filename || 'Unknown File'}</div>
                      <div style={styles.historyDate}>
                        Score: <strong>{evalItem.overallScore}</strong> • {new Date(evalItem.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleGetEvaluation(evalItem.documentId)}
                      style={styles.viewBtn}
                    >
                      View JSON
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM: Results Display */}
        {currentResult && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>🔍 API Response Data</h2>
            <div style={styles.jsonContainer}>
              <div style={styles.scoreSummary}>
                <ScoreBadge label="Overall" score={currentResult.overallScore} />
                <ScoreBadge label="Completeness" score={currentResult.completenessScore} />
                <ScoreBadge label="Clarity" score={currentResult.clarityScore} />
                <ScoreBadge label="Consistency" score={currentResult.consistencyScore} />
                <ScoreBadge label="Verification" score={currentResult.verificationScore} />
              </div>
              <pre style={styles.jsonBlock}>
                {JSON.stringify(currentResult, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Simple helper component for score bubbles
const ScoreBadge = ({ label, score }) => (
  <div style={{
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    background: '#f8fafc', 
    padding: '10px', 
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    minWidth: '80px'
  }}>
    <span style={{fontSize: '20px', fontWeight: 'bold', color: score > 70 ? '#10b981' : '#f59e0b'}}>{score}</span>
    <span style={{fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px'}}>{label}</span>
  </div>
);

// CSS-in-JS Styles
const styles = {
  // FIX: Added pageWrapper to force scrolling regardless of global body styles
  pageWrapper: {
    width: '100%',
    height: '100vh',
    overflowY: 'auto',
    backgroundColor: '#f1f5f9',
    position: 'fixed', // Ensures it sits on top if needed or takes full viewport
    top: 0,
    left: 0,
    zIndex: 1000, // Make sure it's above other fixed elements
  },
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '2rem',
    fontFamily: '-apple-system, system-ui, sans-serif',
    color: '#334155',
    minHeight: '100%', // Ensure it takes full height of scrollable wrapper
    paddingBottom: '4rem' // Extra space at bottom for scrolling
  },
  header: {
    marginBottom: '2rem',
    textAlign: 'center',
  },
  title: {
    margin: '0',
    color: '#1e293b',
    fontSize: '2rem',
  },
  subtitle: {
    margin: '0.5rem 0 0',
    color: '#64748b',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  },
  card: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    marginBottom: '1.5rem',
  },
  cardTitle: {
    marginTop: '0',
    marginBottom: '1rem',
    fontSize: '1.25rem',
    color: '#0f172a',
    borderBottom: '2px solid #f1f5f9',
    paddingBottom: '0.5rem',
  },
  formGroup: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '500',
    fontSize: '0.875rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '1rem',
    boxSizing: 'border-box',
  },
  buttonGroup: {
    display: 'flex',
    gap: '0.5rem',
  },
  button: {
    flex: 1,
    padding: '0.75rem',
    borderRadius: '6px',
    border: 'none',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  primaryBtn: {
    backgroundColor: '#3b82f6',
    color: 'white',
  },
  secondaryBtn: {
    backgroundColor: '#e2e8f0',
    color: '#475569',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    color: '#3b82f6',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  error: {
    marginTop: '1rem',
    padding: '0.75rem',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '6px',
    fontSize: '0.875rem',
  },
  historyList: {
    maxHeight: '300px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  historyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
  },
  historyName: {
    fontWeight: '600',
    fontSize: '0.9rem',
    color: '#334155',
  },
  historyDate: {
    fontSize: '0.8rem',
    color: '#64748b',
  },
  viewBtn: {
    padding: '0.4rem 0.8rem',
    backgroundColor: 'white',
    border: '1px solid #cbd5e1',
    borderRadius: '4px',
    fontSize: '0.75rem',
    cursor: 'pointer',
    color: '#475569',
  },
  jsonContainer: {
    marginTop: '1rem',
  },
  scoreSummary: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    marginBottom: '1.5rem',
    paddingBottom: '1.5rem',
    borderBottom: '1px dashed #cbd5e1',
  },
  jsonBlock: {
    backgroundColor: '#1e293b',
    color: '#e2e8f0',
    padding: '1rem',
    borderRadius: '8px',
    overflowX: 'auto',
    fontSize: '0.85rem',
    fontFamily: 'monospace',
  }
};

export default TestEvaluation;