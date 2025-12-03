import authService from './authService';

const API_URL = 'http://localhost:8080/api/documents';

const documentService = {
  // Upload a document
  uploadDocument: async (file) => {
    const token = authService.getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to upload document');
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