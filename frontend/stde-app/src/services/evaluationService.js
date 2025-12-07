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

  // Get detailed report by document ID (USED BY 'VIEW' BUTTON)
  getDetailedEvaluation: async (documentId) => {
    const token = authService.getToken();
    if (!token) throw new Error('No authentication token found');

    // This calls the secured endpoint we set up: GET /api/evaluations/document/{documentId}
    const response = await fetch(`${API_URL}/document/${documentId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || response.statusText);
    }
    return data;
  },

  // Professor Override Score (USED BY 'OVERRIDE' BUTTON)
  overrideScore: async (documentId, newScore) => {
    const token = authService.getToken();
    if (!token) throw new Error('No authentication token found');

    // This calls the secured endpoint we set up: PUT /api/evaluations/override/{documentId}
    const response = await fetch(`${API_URL}/override/${documentId}`, {
        method: 'PUT',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' // Sending JSON body
        },
        body: JSON.stringify({ overallScore: newScore })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to override score');
    }
    return data;
  },

  // Get existing evaluation results (GET)
  getEvaluation: async (documentId) => {
    const token = authService.getToken();
    if (!token) throw new Error('No authentication token found');

    // Note: The getDetailedEvaluation method above is the preferred method for the dashboard.
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