import authService from './authService';

const API_URL = 'http://localhost:8080/api/evaluations';

const evaluationService = {
  // Trigger a new AI evaluation (POST)
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

  // Get existing evaluation results (GET)
  getEvaluation: async (documentId) => {
    const token = authService.getToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_URL}/document/${documentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch evaluation');
    }
    return data;
  },

  // Get all evaluations for the user (GET) - For History Module later
  getUserEvaluations: async () => {
    const token = authService.getToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_URL}/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch user evaluations');
    }
    return data;
  }
};

export default evaluationService;