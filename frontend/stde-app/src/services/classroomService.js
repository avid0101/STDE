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

  // ✅ NEW: Update a class
  updateClassroom: async (id, classData) => {
    try {
      const response = await api.put(`/classrooms/${id}`, classData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update classroom';
    }
  },

  // ✅ NEW: Delete a class
  deleteClassroom: async (id) => {
    try {
      await api.delete(`/classrooms/${id}`);
      return true;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to delete classroom';
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
  },

  joinClassroom: async (classCode) => {
    try {
      const response = await api.post('/classrooms/join', { classCode });
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to join classroom';
    }
  },

  getStudentClassrooms: async () => {
    try {
      const response = await api.get('/classrooms/student');
      return response.data;
    } catch (error) {
      console.error("Failed to fetch student classrooms", error);
      return [];
    }
  },

  getClassStudents: async (classId) => {
    try {
      const response = await api.get(`/classrooms/${classId}/students`);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch class students", error);
      return [];
    }
  }
};

export default classroomService;