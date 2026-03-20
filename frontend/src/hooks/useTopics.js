/**
 * Topic management hooks
 * Provides state management and API integration for topics
 */

import { useState, useEffect, useContext, createContext } from 'react';
import { useRouter } from 'next/router';
import { topicApi } from '../services/topic';

// Create topics context
const TopicsContext = createContext();

/**
 * Topics provider component
 * Wraps the application and provides topics state management
 */
export function TopicsProvider({ children }) {
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [statistics, setStatistics] = useState(null);

  // Load topics on mount
  useEffect(() => {
    loadTopics();
  }, []);

  /**
   * Load all topics for the user
   */
  const loadTopics = async (options = {}) => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await topicApi.getTopics(options);
      
      if (response.success) {
        setTopics(response.topics);
      } else {
        throw new Error(response.error || 'Failed to load topics');
      }
    } catch (err) {
      setError(err.message);
      console.error('Load topics error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create a new topic
   */
  const createTopic = async (topicData) => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await topicApi.createTopic(topicData);
      
      if (response.success) {
        setTopics(prev => [response.topic, ...prev]);
        return response.topic;
      } else {
        throw new Error(response.error || 'Failed to create topic');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get a specific topic by ID
   */
  const getTopic = async (topicId) => {
    try {
      setError('');
      
      const response = await topicApi.getTopic(topicId);
      
      if (response.success) {
        return response.topic;
      } else {
        throw new Error(response.error || 'Failed to get topic');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Update a topic
   */
  const updateTopic = async (topicId, updateData) => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await topicApi.updateTopic(topicId, updateData);
      
      if (response.success) {
        setTopics(prev => prev.map(topic => 
          topic.id === topicId ? response.topic : topic
        ));
        return response.topic;
      } else {
        throw new Error(response.error || 'Failed to update topic');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete a topic
   */
  const deleteTopic = async (topicId) => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await topicApi.deleteTopic(topicId);
      
      if (response.success) {
        setTopics(prev => prev.filter(topic => topic.id !== topicId));
      } else {
        throw new Error(response.error || 'Failed to delete topic');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Search topics
   */
  const searchTopics = async (query, options = {}) => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await topicApi.searchTopics(query, options);
      
      if (response.success) {
        setTopics(response.topics);
      } else {
        throw new Error(response.error || 'Failed to search topics');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get topics due for review today
   */
  const getTodayTopics = async (date = null) => {
    try {
      setError('');
      
      const response = await topicApi.getTodayTopics(date);
      
      if (response.success) {
        return response.topics;
      } else {
        throw new Error(response.error || 'Failed to get today\'s topics');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Get calendar topics
   */
  const getCalendarTopics = async (startDate, endDate) => {
    try {
      setError('');
      
      const response = await topicApi.getCalendarTopics(startDate, endDate);
      
      if (response.success) {
        return response.topics;
      } else {
        throw new Error(response.error || 'Failed to get calendar topics');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Get topic statistics
   */
  const getStatistics = async () => {
    try {
      setError('');
      
      const response = await topicApi.getStatistics();
      
      if (response.success) {
        setStatistics(response.statistics);
        return response.statistics;
      } else {
        throw new Error(response.error || 'Failed to get statistics');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Get upcoming reviews
   */
  const getUpcomingReviews = async (days = 7) => {
    try {
      setError('');
      
      const response = await topicApi.getUpcomingReviews(days);
      
      if (response.success) {
        return response.upcomingReviews;
      } else {
        throw new Error(response.error || 'Failed to get upcoming reviews');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Reset topic schedule
   */
  const resetTopicSchedule = async (topicId) => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await topicApi.resetTopicSchedule(topicId);
      
      if (response.success) {
        setTopics(prev => prev.map(topic => 
          topic.id === topicId ? response.topic : topic
        ));
        return response.topic;
      } else {
        throw new Error(response.error || 'Failed to reset topic schedule');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create multiple topics (batch operation)
   */
  const createTopics = async (topicsData) => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await topicApi.createTopics(topicsData);
      
      if (response.success) {
        setTopics(prev => [...response.createdTopics, ...prev]);
        return response;
      } else {
        throw new Error(response.error || 'Failed to create topics');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Export topics data
   */
  const exportTopics = async (format = 'json') => {
    try {
      setError('');
      
      const response = await topicApi.exportTopics(format);
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.error || 'Failed to export topics');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setError('');
  };

  /**
   * Refresh topics data
   */
  const refresh = () => {
    loadTopics();
    getStatistics();
  };

  const value = {
    topics,
    isLoading,
    error,
    statistics,
    loadTopics,
    createTopic,
    getTopic,
    updateTopic,
    deleteTopic,
    searchTopics,
    getTodayTopics,
    getCalendarTopics,
    getStatistics,
    getUpcomingReviews,
    resetTopicSchedule,
    createTopics,
    exportTopics,
    clearError,
    refresh
  };

  return (
    <TopicsContext.Provider value={value}>
      {children}
    </TopicsContext.Provider>
  );
}

/**
 * Hook to use topics context
 */
export function useTopics() {
  const context = useContext(TopicsContext);
  
  if (!context) {
    throw new Error('useTopics must be used within a TopicsProvider');
  }
  
  return context;
}

/**
 * Hook to get a specific topic
 */
export function useTopic(topicId) {
  const { getTopic, topics } = useTopics();
  const [topic, setTopic] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (topicId) {
      loadTopic();
    }
  }, [topicId]);

  const loadTopic = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // First try to get from the cached topics
      const cachedTopic = topics.find(t => t.id === parseInt(topicId));
      if (cachedTopic) {
        setTopic(cachedTopic);
      }
      
      // Then fetch fresh data
      const freshTopic = await getTopic(parseInt(topicId));
      setTopic(freshTopic);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { topic, isLoading, error, refresh: loadTopic };
}

/**
 * Hook to get today's topics
 */
export function useTodayTopics(date = null) {
  const { getTodayTopics } = useTopics();
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTodayTopics();
  }, [date]);

  const loadTodayTopics = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const todayTopics = await getTodayTopics(date);
      setTopics(todayTopics);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { topics, isLoading, error, refresh: loadTodayTopics };
}

/**
 * Hook to get calendar topics
 */
export function useCalendarTopics(startDate, endDate) {
  const { getCalendarTopics } = useTopics();
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (startDate && endDate) {
      loadCalendarTopics();
    }
  }, [startDate, endDate]);

  const loadCalendarTopics = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const calendarTopics = await getCalendarTopics(startDate, endDate);
      setTopics(calendarTopics);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { topics, isLoading, error, refresh: loadCalendarTopics };
}
