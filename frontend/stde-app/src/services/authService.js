import api from './api';

const authService = {
  // ... (keep register, login, logout, getToken, isAuthenticated, getUserType) ...

  // [KEEP THIS AS IS]
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', {
        firstname: userData.firstName,
        lastname: userData.familyName,
        email: userData.email,
        password: userData.password,
        userType: userData.userType || 'STUDENT',
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Registration failed';
    }
  },

  // [KEEP THIS AS IS]
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', {
        email: credentials.email,
        password: credentials.password,
      });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Login failed';
    }
  },

  // [KEEP THIS AS IS]
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // [KEEP THIS AS IS]
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // [KEEP THIS AS IS]
  getToken: () => {
    return localStorage.getItem('token');
  },

  // [KEEP THIS AS IS]
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // [KEEP THIS AS IS]
  getUserType: () => {
    const user = authService.getCurrentUser();
    return user?.userType || null;
  },

  updateProfile: async (data) => {
    try {
      const response = await api.put('/users/profile', data);
      
      if (response.data.user) {
        // Get the current user data before overwriting
        const currentUser = authService.getCurrentUser();
        const updatedUser = response.data.user;

        // If the backend returns an empty avatar but we already have one, keep the old one
        if (!updatedUser.avatarUrl && currentUser?.avatarUrl) {
            updatedUser.avatarUrl = currentUser.avatarUrl;
        }

        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
      }
      
      return response.data.user;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update profile';
    }
  },

  // Request the reset link
  requestPasswordReset: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to send reset link';
    }
  },

  // Submit the new password
  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', { 
        token, 
        password: newPassword 
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to reset password';
    }
  }
};

export default authService;