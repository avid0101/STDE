import authService from './authService';

const API_URL = 'http://localhost:8080/api/documents';

const documentService = {
  // ... existing methods (uploadDocument, uploadDriveFile, getDocumentsByClass, getUserDocuments, getDocument, deleteDocument) ...
  // [KEEP ALL EXISTING METHODS]

  uploadDocument: async (file, classId = null) => {
    const token = authService.getToken();
    if (!token) throw new Error('No authentication token found');
    const formData = new FormData();
    formData.append('file', file);
    if (classId) formData.append('classId', classId);
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to upload document');
    return data;
  },

  uploadDriveFile: async (fileId, classId = null) => {
    const token = authService.getToken();
    if (!token) throw new Error('No authentication token found');
    const response = await fetch(`${API_URL}/upload-drive`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId: fileId, classId: classId })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to import Drive document');
    return data;
  },

  getDocumentsByClass: async (classId) => {
    const token = authService.getToken();
    if (!token) throw new Error('No authentication token found');
    const response = await fetch(`${API_URL}/classroom/${classId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch class documents');
    return data;
  },

  getUserDocuments: async () => {
    const token = authService.getToken();
    if (!token) throw new Error('No authentication token found');
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch documents');
    return data;
  },

  getDocument: async (documentId) => {
    const token = authService.getToken();
    if (!token) throw new Error('No authentication token found');
    const response = await fetch(`${API_URL}/${documentId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch document');
    return data;
  },

  deleteDocument: async (documentId) => {
    const token = authService.getToken();
    if (!token) throw new Error('No authentication token found');
    const response = await fetch(`${API_URL}/${documentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    if (response.status === 204) return { success: true };
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to delete document');
    return data;
  },

  submitDocument: async (documentId) => {
    const token = authService.getToken();
    if (!token) throw new Error('No authentication token found');
    const response = await fetch(`${API_URL}/${documentId}/submit`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to submit document');
    return data;
  }
};

export default documentService;