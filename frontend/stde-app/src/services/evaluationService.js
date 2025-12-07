import authService from './authService';

const API_URL = 'http://localhost:8080/api/evaluations';

const evaluationService = {
  evaluateDocument: async (documentId) => {
    const token = authService.getToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_URL}/evaluate/${documentId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to evaluate document');
    }
    return data;
  },

  // Get Usage Stats
  getUsageStats: async () => {
    const token = authService.getToken();
    if (!token) return null;

    const response = await fetch(`${API_URL}/usage`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) return null;
    return response.json();
  },

  getDetailedEvaluation: async (documentId) => {
    const token = authService.getToken();
    if (!token) throw new Error('No authentication token found');
    const response = await fetch(`${API_URL}/document/${documentId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || response.statusText);
    return data;
  },

  overrideScore: async (documentId, newScore) => {
    const token = authService.getToken();
    if (!token) throw new Error('No authentication token found');
    const response = await fetch(`${API_URL}/override/${documentId}`, {
        method: 'PUT',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ overallScore: newScore })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.message);
    return data;
  },

  getUserEvaluations: async () => {
    const token = authService.getToken();
    if (!token) throw new Error('No authentication token found');
    const response = await fetch(`${API_URL}/user`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  }
};

export default evaluationService;