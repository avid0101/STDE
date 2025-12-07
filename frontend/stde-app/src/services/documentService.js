import authService from './authService';

const API_URL = 'http://localhost:8080/api/documents';

const documentService = {
  // 1. Upload from Local Computer (Multipart File)
  uploadDocument: async (file, classId = null) => {
    const token = authService.getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const formData = new FormData();
    formData.append('file', file);

    // Only append if a class was selected
    if (classId) {
      formData.append('classId', classId);
    }

    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // No Content-Type header needed for FormData; browser sets it automatically
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to upload document');
    }

    return data;
  },

  // 2. NEW: Import from Google Drive (Sends IDs only)
  uploadDriveFile: async (fileId, classId = null) => {
    const token = authService.getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/upload-drive`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' // Important: We are sending JSON now
      },
      body: JSON.stringify({ 
        fileId: fileId,
        classId: classId 
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to import Drive document');
    }

    return data;
  },

  // Get all user documents
  getUserDocuments: async () => {
    const token = authService.getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch documents');
    }

    return data;
  },

  // Get specific document
  getDocument: async (documentId) => {
    const token = authService.getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/${documentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch document');
    }

    return data;
  },

  // Delete document
  deleteDocument: async (documentId) => {
    const token = authService.getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/${documentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete document');
    }

    return data;
  }
};

export default documentService;