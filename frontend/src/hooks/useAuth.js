/**
 * Authentication hook
 * Provides authentication state and methods for login, logout, and registration
 */

import { useState, useEffect, useContext, createContext } from 'react';
import { useRouter } from 'next/router';
import { authApi } from '../services/auth';

// Create authentication context
const AuthContext = createContext();

/**
 * Authentication provider component
 * Wraps the application and provides authentication state
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  /**
   * Check if user is authenticated
   */
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // Try to get current user from API
      const response = await authApi.getCurrentUser();
      
      if (response.success && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      // User is not authenticated or session expired
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login user
   */
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      
      const response = await authApi.login(email, password);
      
      if (response.success && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        
        // Store session info
        localStorage.setItem('user', JSON.stringify(response.user));
        
        return response.user;
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Register new user
   */
  const register = async (userData) => {
    try {
      setIsLoading(true);
      
      const response = await authApi.register(userData);
      
      if (response.success) {
        // Registration successful, but user needs to login
        return response;
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Call logout API
      await authApi.logout();
      
      // Clear local state
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear local storage
      localStorage.removeItem('user');
      
      // Redirect to login page
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if API call fails, clear local state
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (profileData) => {
    try {
      setIsLoading(true);
      
      const response = await authApi.updateProfile(profileData);
      
      if (response.success && response.user) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        return response.user;
      } else {
        throw new Error(response.error || 'Profile update failed');
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Change password
   */
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setIsLoading(true);
      
      const response = await authApi.changePassword(currentPassword, newPassword);
      
      if (!response.success) {
        throw new Error(response.error || 'Password change failed');
      }
      
      return response;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete user account
   */
  const deleteAccount = async (password) => {
    try {
      setIsLoading(true);
      
      const response = await authApi.deleteAccount(password);
      
      if (response.success) {
        // Clear local state and redirect
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('user');
        router.push('/register');
        
        return response;
      } else {
        throw new Error(response.error || 'Account deletion failed');
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update notification preferences
   */
  const updateNotificationPreferences = async (notificationEnabled, notificationTime) => {
    try {
      setIsLoading(true);
      
      const response = await authApi.updateNotificationPreferences(
        notificationEnabled,
        notificationTime
      );
      
      if (response.success && response.user) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        return response.user;
      } else {
        throw new Error(response.error || 'Notification preferences update failed');
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update timezone
   */
  const updateTimezone = async (timezone) => {
    try {
      setIsLoading(true);
      
      const response = await authApi.updateTimezone(timezone);
      
      if (response.success && response.user) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        return response.user;
      } else {
        throw new Error(response.error || 'Timezone update failed');
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    deleteAccount,
    updateNotificationPreferences,
    updateTimezone,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use authentication context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * Hook to require authentication
 * Redirects to login if user is not authenticated
 */
export function useRequireAuth() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  return { user, isLoading, isAuthenticated };
}

/**
 * Hook to get authentication state without redirecting
 */
export function useAuthState() {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  return { user, isLoading, isAuthenticated };
}
