/**
 * Protected Route wrapper component
 * Protects routes that require authentication
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin-bottom: 20px;
`;

const LoadingText = styled.p`
  font-size: 1.1rem;
  opacity: 0.9;
`;

/**
 * Protected Route component
 * Redirects to login if user is not authenticated
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Store the intended destination for redirect after login
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register') {
          sessionStorage.setItem('redirectAfterLogin', currentPath);
        }
      }
      
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <LoadingContainer>
        <Spinner />
        <LoadingText>Loading...</LoadingText>
      </LoadingContainer>
    );
  }

  // If not authenticated, don't render anything (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // If authenticated, render the protected content
  return children;
}

/**
 * Higher-order component for protecting pages
 */
export function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    return (
      <ProtectedRoute>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

/**
 * Hook to handle redirect after login
 */
export function useRedirectAfterLogin() {
  const router = useRouter();

  const redirectToIntended = () => {
    if (typeof window !== 'undefined') {
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      sessionStorage.removeItem('redirectAfterLogin');
      
      if (redirectPath && redirectPath !== '/login' && redirectPath !== '/register') {
        router.push(redirectPath);
      } else {
        router.push('/');
      }
    } else {
      router.push('/');
    }
  };

  return { redirectToIntended };
}
