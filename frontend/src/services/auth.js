/**
 * Authentication API service
 * Handles all authentication-related API calls
 */

import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
  timeout: 10000,
  withCredentials: true // Important for session cookies
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Clear any stored user data
      localStorage.removeItem('user');
      
      // Redirect to login if not already there
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * Authentication API methods
 */
export const authApi = {
  /**
   * Register a new user
   */
  async register(userData) {
    try {
      const response = await api.post('/api/auth/register', userData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Login user
   */
  async login(email, password) {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      const response = await api.post('/api/auth/logout');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Get current user
   */
  async getCurrentUser() {
    try {
      const response = await api.get('/api/auth/me');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(profileData) {
    try {
      const response = await api.put('/api/auth/profile', profileData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Change password
   */
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await api.put('/api/auth/password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Delete user account
   */
  async deleteAccount(password) {
    try {
      const response = await api.delete('/api/auth/account', {
        data: { password }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Get user statistics
   */
  async getStatistics() {
    try {
      const response = await api.get('/api/auth/statistics');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(notificationEnabled, notificationTime) {
    try {
      const response = await api.put('/api/auth/notifications', {
        notificationEnabled,
        notificationTime
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Update timezone
   */
  async updateTimezone(timezone) {
    try {
      const response = await api.put('/api/auth/timezone', { timezone });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Check session validity
   */
  async checkSession() {
    try {
      const response = await api.get('/api/auth/session');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Handle API errors consistently
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const { data, status } = error.response;
      
      if (data.error) {
        return new Error(data.error);
      } else {
        return new Error(`Request failed with status ${status}`);
      }
    } else if (error.request) {
      // Network error
      return new Error('Network error. Please check your connection.');
    } else {
      // Other error
      return new Error(error.message || 'An unexpected error occurred.');
    }
  }
};

/**
 * Utility function to check if user is authenticated
 */
export function isAuthenticated() {
  if (typeof window === 'undefined') return false;
  
  const user = localStorage.getItem('user');
  return !!user;
}

/**
 * Utility function to get stored user data
 */
export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error parsing stored user data:', error);
    localStorage.removeItem('user');
    return null;
  }
}

/**
 * Utility function to clear stored user data
 */
export function clearStoredUser() {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('user');
}

export default authApi;
