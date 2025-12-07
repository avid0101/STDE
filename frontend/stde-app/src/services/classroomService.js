import api from './api';

const classroomService = {
  // Create a new class (Teacher)
  createClassroom: async (classData) => {
    try {
      const response = await api.post('/classrooms', classData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to create classroom';
    }
  },

  // Get all classes
  getAllClassrooms: async () => {
    try {
      const response = await api.get('/classrooms');
      return response.data;
    } catch (error) {
      console.error("Failed to fetch classrooms", error);
      return [];
    }
  }
};

export default classroomService;