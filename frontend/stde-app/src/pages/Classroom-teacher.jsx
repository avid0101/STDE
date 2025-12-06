import React from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../css/Classroom-teacher.css'; 

const ClassroomTeacher = () => {
  return (
    <div className="app-container">
      <Sidebar />
      
      <main className="main-content">
        {/* --- Header Section --- */}
        <div className="header">
          <div className="header-top-row">
            <div>
              <Link to="/classroom" className="breadcrumb">
                <span>←</span> Back to Classrooms
              </Link>
              <h1 className="page-title">Software Testing 101</h1>
              <p className="class-subtitle">CS401-2025 • Section A • 45 students</p>
            </div>
            <button className="create-assign-btn">+ Create Assignment</button>
          </div>
        </div>

        {/* --- Stats Cards --- */}
        <div className="stats-row">
          <div className="stat-card">
            <div>
              <span className="stat-label">Total Groups</span>
              <h3 className="stat-value">3</h3>
            </div>
            <div className="stat-icon icon-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
          </div>
          
          <div className="stat-card">
            <div>
              <span className="stat-label">Pending Reviews</span>
              <h3 className="stat-value">2</h3>
            </div>
            <div className="stat-icon icon-orange">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
          </div>

          <div className="stat-card">
            <div>
              <span className="stat-label">Graded</span>
              <h3 className="stat-value">1</h3>
            </div>
            <div className="stat-icon icon-green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
          </div>
        </div>

        {/* --- Student Groups Section --- */}
        <div className="section-container">
          <h3 className="section-title">Student Groups</h3>
          
          <div className="group-list">
            {/* Group Item 1 */}
            <div className="group-card">
              <div className="group-info">
                <div className="group-header">
                  <span className="group-name">Team Alpha</span>
                  <span className="badge-blue">4 members</span>
                </div>
                <div className="group-meta">
                  Leader: John Doe
                </div>
                <div className="group-stats">
                  3 submissions • Latest score: <span className="score-green">92/100</span>
                </div>
              </div>
            </div>

            {/* Group Item 2 */}
            <div className="group-card">
              <div className="group-info">
                <div className="group-header">
                  <span className="group-name">Team Beta</span>
                  <span className="badge-blue">4 members</span>
                </div>
                <div className="group-meta">
                  Leader: Alice Brown
                </div>
                <div className="group-stats">
                  2 submissions • Latest score: <span className="score-green">85/100</span>
                </div>
              </div>
            </div>

            {/* Group Item 3 */}
            <div className="group-card">
              <div className="group-info">
                <div className="group-header">
                  <span className="group-name">Team Gamma</span>
                  <span className="badge-blue">4 members</span>
                </div>
                <div className="group-meta">
                  Leader: Emma White
                </div>
                <div className="group-stats">
                  3 submissions
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- Recent Submissions Table --- */}
        <div className="section-container">
          <h3 className="section-title">Recent Submissions</h3>
          
          <div className="table-card">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Group</th>
                  <th>Version</th>
                  <th>File</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Team Alpha</td>
                  <td><span className="ver-badge">v3</span></td>
                  <td>TestPlan_Phase1_v3.pdf</td>
                  <td className="text-muted">2024-01-25 9:15 AM</td>
                  <td><span className="status-badge pending">Pending</span></td>
                  <td>-</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-ai">✨ AI Evaluation</button>
                      <button className="btn-grade">✎ Grade</button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>Team Beta</td>
                  <td><span className="ver-badge">v2</span></td>
                  <td>TestPlan_Phase1_v2.pdf</td>
                  <td className="text-muted">2024-01-24 2:30 PM</td>
                  <td><span className="status-badge pending">Pending</span></td>
                  <td>-</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-ai">✨ AI Evaluation</button>
                      <button className="btn-grade">✎ Grade</button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>Team Alpha</td>
                  <td><span className="ver-badge">v2</span></td>
                  <td>TestPlan_Phase1_v2.pdf</td>
                  <td className="text-muted">2024-01-20 3:45 PM</td>
                  <td><span className="status-badge graded">Graded</span></td>
                  <td>92/100</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
};

export default ClassroomTeacher;