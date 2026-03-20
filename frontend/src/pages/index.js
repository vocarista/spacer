/**
 * User Dashboard page
 * Main dashboard for authenticated users showing today's topics and statistics
 */

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../hooks/useAuth';
import ProtectedRoute from '../components/ProtectedRoute';
import DashboardStats from '../components/DashboardStats';
import TodayTopics from '../components/TodayTopics';

const DashboardContainer = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
`;

const Header = styled.header`
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 16px 0;
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.h1`
  font-size: 1.5rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Navigation = styled.nav`
  display: flex;
  gap: 24px;
  align-items: center;
`;

const NavLink = styled.a`
  color: #666;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;

  &:hover {
    color: #667eea;
  }

  &.active {
    color: #667eea;
  }
`;

const UserMenu = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const UserEmail = styled.span`
  color: #333;
  font-weight: 500;
`;

const LogoutButton = styled.button`
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #c0392b;
  }
`;

const MainContent = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 20px;
`;

const WelcomeSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const WelcomeTitle = styled.h2`
  font-size: 2rem;
  color: #333;
  margin-bottom: 8px;
`;

const WelcomeSubtitle = styled.p`
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 24px;
`;

const QuickActions = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
`;

const QuickActionButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
  }
`;

const SecondaryButton = styled.button`
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: #667eea;
    color: white;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const Section = styled.section`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h3`
  font-size: 1.3rem;
  color: #333;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #666;
`;

const EmptyStateIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyStateText = styled.p`
  font-size: 1.1rem;
  margin-bottom: 16px;
`;

const EmptyStateAction = styled.button`
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #5a6fd8;
  }
`;

export default function DashboardPage() {
  const { user, logout, isLoading } = useAuth();
  const [statistics, setStatistics] = useState(null);
  const [todayTopics, setTodayTopics] = useState([]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Load user statistics
      const statsResponse = await fetch('/api/auth/statistics', {
        credentials: 'include'
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStatistics(statsData.statistics);
      }

      // Load today's topics (placeholder until we implement the topics API)
      setTodayTopics([]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleCreateTopic = () => {
    // Navigate to topic creation page (will be implemented later)
    console.log('Navigate to create topic');
  };

  const handleViewCalendar = () => {
    // Navigate to calendar page (will be implemented later)
    console.log('Navigate to calendar');
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <ProtectedRoute>
      <DashboardContainer>
        <Header>
          <HeaderContent>
            <Logo>
              🧠 Spacer
            </Logo>
            
            <Navigation>
              <NavLink href="#" className="active">Dashboard</NavLink>
              <NavLink href="#">Topics</NavLink>
              <NavLink href="#">Calendar</NavLink>
              <NavLink href="#">Profile</NavLink>
            </Navigation>

            <UserMenu>
              <UserEmail>{user?.email}</UserEmail>
              <LogoutButton onClick={handleLogout}>
                Logout
              </LogoutButton>
            </UserMenu>
          </HeaderContent>
        </Header>

        <MainContent>
          <WelcomeSection>
            <WelcomeTitle>Welcome back, {user?.email?.split('@')[0]}! 👋</WelcomeTitle>
            <WelcomeSubtitle>
              Ready to continue your learning journey? Here's what's on your schedule today.
            </WelcomeSubtitle>
            
            <QuickActions>
              <QuickActionButton onClick={handleCreateTopic}>
                ➕ Create New Topic
              </QuickActionButton>
              <SecondaryButton onClick={handleViewCalendar}>
                📅 View Calendar
              </SecondaryButton>
            </QuickActions>
          </WelcomeSection>

          <ContentGrid>
            <Section>
              <SectionTitle>
                📊 Your Progress
              </SectionTitle>
              {statistics ? (
                <DashboardStats statistics={statistics} />
              ) : (
                <EmptyState>
                  <EmptyStateIcon>📈</EmptyStateIcon>
                  <EmptyStateText>Loading your statistics...</EmptyStateText>
                </EmptyState>
              )}
            </Section>

            <Section>
              <SectionTitle>
                📚 Today's Reviews
              </SectionTitle>
              {todayTopics.length > 0 ? (
                <TodayTopics topics={todayTopics} />
              ) : (
                <EmptyState>
                  <EmptyStateIcon>🎉</EmptyStateIcon>
                  <EmptyStateText>
                    No topics to review today! Great job staying on top of your schedule.
                  </EmptyStateText>
                  <EmptyStateAction onClick={handleCreateTopic}>
                    Create Your First Topic
                  </EmptyStateAction>
                </EmptyState>
              )}
            </Section>
          </ContentGrid>
        </MainContent>
      </DashboardContainer>
    </ProtectedRoute>
  );
}
