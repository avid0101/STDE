import api from './api';

const documentService = {
  // Upload and evaluate document
  evaluateDocument: async (file, options = {}) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Add additional options if needed
      if (options.documentType) {
        formData.append('documentType', options.documentType);
      }

      const response = await api.post('/documents/evaluate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Document evaluation failed';
    }
  },

  // Get evaluation history
  getEvaluationHistory: async () => {
    try {
      const response = await api.get('/documents/history');
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch history';
    }
  },

  // Get specific evaluation by ID
  getEvaluationById: async (id) => {
    try {
      const response = await api.get(`/documents/evaluation/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch evaluation';
    }
  },

  // Delete evaluation
  deleteEvaluation: async (id) => {
    try {
      const response = await api.delete(`/documents/evaluation/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to delete evaluation';
    }
  },
};

export default documentService;