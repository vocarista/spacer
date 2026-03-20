/**
 * Topic API service
 * Handles all topic-related API calls
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
      console.log(`Topic API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('Topic API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if not authenticated
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Topic API methods
 */
export const topicApi = {
  /**
   * Create a new topic
   */
  async createTopic(topicData) {
    try {
      const response = await api.post('/api/topics', topicData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Get all topics for the user
   */
  async getTopics(options = {}) {
    try {
      const { limit = 50, offset = 0, sortBy = 'next_review_date', sortOrder = 'ASC' } = options;
      const response = await api.get('/api/topics', {
        params: { limit, offset, sortBy, sortOrder }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Get a specific topic by ID
   */
  async getTopic(topicId) {
    try {
      const response = await api.get(`/api/topics/${topicId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Get topic with review history
   */
  async getTopicWithHistory(topicId) {
    try {
      const response = await api.get(`/api/topics/${topicId}/history`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Update a topic
   */
  async updateTopic(topicId, updateData) {
    try {
      const response = await api.put(`/api/topics/${topicId}`, updateData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Delete a topic
   */
  async deleteTopic(topicId) {
    try {
      const response = await api.delete(`/api/topics/${topicId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Search topics
   */
  async searchTopics(query, options = {}) {
    try {
      const { limit = 20, offset = 0 } = options;
      const response = await api.get('/api/topics/search', {
        params: { q: query, limit, offset }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Get topics due for review today
   */
  async getTodayTopics(date = null) {
    try {
      const params = {};
      if (date) params.date = date;
      
      const response = await api.get('/api/topics/today', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Get topics for calendar view
   */
  async getCalendarTopics(startDate, endDate) {
    try {
      const response = await api.get('/api/topics/calendar', {
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Get topic statistics
   */
  async getStatistics() {
    try {
      const response = await api.get('/api/topics/statistics');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Get upcoming reviews
   */
  async getUpcomingReviews(days = 7) {
    try {
      const response = await api.get('/api/topics/upcoming', {
        params: { days }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Reset topic schedule
   */
  async resetTopicSchedule(topicId) {
    try {
      const response = await api.put(`/api/topics/${topicId}/reset`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Create multiple topics (batch operation)
   */
  async createTopics(topicsData) {
    try {
      const response = await api.post('/api/topics/batch', { topics: topicsData });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Export topics data
   */
  async exportTopics(format = 'json') {
    try {
      const response = await api.get('/api/topics/export', {
        params: { format },
        responseType: format === 'csv' ? 'blob' : 'json'
      });

      if (format === 'csv') {
        // Handle CSV download
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'topics.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        return { success: true, message: 'Topics exported successfully' };
      } else {
        return response.data;
      }
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
 * Utility function to format topic data for API
 */
export function formatTopicForApi(topicData) {
  return {
    name: topicData.name?.trim(),
    description: topicData.description?.trim() || '',
    links: topicData.links?.filter(link => link.trim() !== '') || [],
    initialDate: topicData.initialDate || new Date().toISOString().split('T')[0]
  };
}

/**
 * Utility function to validate topic data
 */
export function validateTopicData(topicData) {
  const errors = [];

  if (!topicData.name || topicData.name.trim() === '') {
    errors.push('Topic name is required');
  }

  if (topicData.name && topicData.name.length > 255) {
    errors.push('Topic name cannot exceed 255 characters');
  }

  if (topicData.description && topicData.description.length > 1000) {
    errors.push('Description cannot exceed 1000 characters');
  }

  if (topicData.links) {
    topicData.links.forEach((link, index) => {
      if (link && !isValidUrl(link)) {
        errors.push(`Link at index ${index} is not a valid URL`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Utility function to validate URL
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export default topicApi;
