/**
 * User Profile page
 * Handles user profile management, preferences, and account settings
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { useAuth } from '../hooks/useAuth';
import ProtectedRoute from '../components/ProtectedRoute';

const ProfileContainer = styled.div`
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
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 20px;
`;

const PageTitle = styled.h2`
  font-size: 2rem;
  color: #333;
  margin-bottom: 32px;
`;

const ProfileGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const ProfileSection = styled.section`
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h3`
  font-size: 1.3rem;
  color: #333;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #667eea;
  }

  &:disabled {
    background: #f8f9fa;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const CheckboxLabel = styled.span`
  color: #333;
  font-size: 0.9rem;
`;

const ErrorMessage = styled.span`
  color: #e74c3c;
  font-size: 0.8rem;
  margin-top: 4px;
`;

const SuccessMessage = styled.div`
  background: #d4edda;
  color: #155724;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #c3e6cb;
`;

const Button = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 14px 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const SecondaryButton = styled.button`
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 8px;
  padding: 14px 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: #667eea;
    color: white;
  }
`;

const DangerButton = styled.button`
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 14px 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #c0392b;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

const AccountInfo = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e1e5e9;

  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.span`
  color: #666;
  font-size: 0.9rem;
`;

const InfoValue = styled.span`
  color: #333;
  font-weight: 500;
  font-size: 0.9rem;
`;

// Common timezones
const timezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney'
];

export default function ProfilePage() {
  const { user, logout, updateProfile, updateNotificationPreferences, updateTimezone, deleteAccount } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile
  } = useForm();

  const {
    register: registerNotifications,
    handleSubmit: handleNotificationsSubmit,
    formState: { errors: notificationErrors },
    reset: resetNotifications
  } = useForm();

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    watch: watchPassword
  } = useForm();

  useEffect(() => {
    if (user) {
      // Reset forms with current user data
      resetProfile({
        timezone: user.timezone || 'UTC'
      });
      
      resetNotifications({
        notificationEnabled: user.notificationEnabled,
        notificationTime: user.notificationTime
      });
    }
  }, [user, resetProfile, resetNotifications]);

  const onProfileSubmit = async (data) => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      await updateTimezone(data.timezone);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const onNotificationsSubmit = async (data) => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      await updateNotificationPreferences(
        data.notificationEnabled,
        data.notificationTime
      );
      setSuccess('Notification preferences updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      await updateProfile.changePassword(data.currentPassword, data.newPassword);
      setSuccess('Password changed successfully!');
      
      // Clear password fields
      resetPassword();
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleDeleteAccount = async () => {
    const password = prompt('Please enter your password to confirm account deletion. This action cannot be undone.');
    
    if (!password) {
      return;
    }

    const confirm = window.confirm(
      'Are you absolutely sure you want to delete your account? All your data will be permanently deleted.'
    );

    if (!confirm) {
      return;
    }

    try {
      setIsLoading(true);
      await deleteAccount(password);
      // Account deletion will redirect to register page automatically
    } catch (err) {
      setError(err.message || 'Failed to delete account');
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <ProfileContainer>
        <Header>
          <HeaderContent>
            <Logo>
              🧠 Spacer
            </Logo>
            
            <Navigation>
              <NavLink href="/">Dashboard</NavLink>
              <NavLink href="#">Topics</NavLink>
              <NavLink href="#">Calendar</NavLink>
              <NavLink href="#" className="active">Profile</NavLink>
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
          <PageTitle>Profile Settings</PageTitle>

          {success && (
            <SuccessMessage>
              {success}
            </SuccessMessage>
          )}

          {error && (
            <ErrorMessage style={{ display: 'block', marginBottom: '20px' }}>
              {error}
            </ErrorMessage>
          )}

          <ProfileGrid>
            <ProfileSection>
              <SectionTitle>
                👤 Account Information
              </SectionTitle>
              
              <AccountInfo>
                <InfoRow>
                  <InfoLabel>Email Address</InfoLabel>
                  <InfoValue>{user?.email}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>Account Created</InfoLabel>
                  <InfoValue>
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>Last Updated</InfoLabel>
                  <InfoValue>
                    {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                  </InfoValue>
                </InfoRow>
              </AccountInfo>

              <Form onSubmit={handleProfileSubmit(onProfileSubmit)}>
                <FormGroup>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    id="timezone"
                    {...registerProfile('timezone')}
                  >
                    {timezones.map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </Select>
                </FormGroup>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Timezone'}
                </Button>
              </Form>
            </ProfileSection>

            <ProfileSection>
              <SectionTitle>
                🔔 Notification Preferences
              </SectionTitle>

              <Form onSubmit={handleNotificationsSubmit(onNotificationsSubmit)}>
                <CheckboxGroup>
                  <Checkbox
                    id="notificationEnabled"
                    type="checkbox"
                    {...registerNotifications('notificationEnabled')}
                  />
                  <CheckboxLabel htmlFor="notificationEnabled">
                    Enable daily review notifications
                  </CheckboxLabel>
                </CheckboxGroup>

                <FormGroup>
                  <Label htmlFor="notificationTime">Notification Time</Label>
                  <Select
                    id="notificationTime"
                    {...registerNotifications('notificationTime')}
                  >
                    <option value="06:00">6:00 AM</option>
                    <option value="07:00">7:00 AM</option>
                    <option value="08:00">8:00 AM</option>
                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="18:00">6:00 PM</option>
                    <option value="19:00">7:00 PM</option>
                    <option value="20:00">8:00 PM</option>
                  </Select>
                </FormGroup>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Notifications'}
                </Button>
              </Form>
            </ProfileSection>
          </ProfileGrid>

          <ProfileGrid style={{ marginTop: '32px' }}>
            <ProfileSection>
              <SectionTitle>
                🔒 Change Password
              </SectionTitle>

              <Form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
                <FormGroup>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="Enter current password"
                    {...registerPassword('currentPassword', {
                      required: 'Current password is required'
                    })}
                  />
                  {passwordErrors.currentPassword && (
                    <ErrorMessage>{passwordErrors.currentPassword.message}</ErrorMessage>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    {...registerPassword('newPassword', {
                      required: 'New password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters'
                      },
                      pattern: {
                        value: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message: 'Password must contain uppercase, lowercase, and numbers'
                      }
                    })}
                  />
                  {passwordErrors.newPassword && (
                    <ErrorMessage>{passwordErrors.newPassword.message}</ErrorMessage>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    {...registerPassword('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: value => value === watchPassword('newPassword') || 'Passwords do not match'
                    })}
                  />
                  {passwordErrors.confirmPassword && (
                    <ErrorMessage>{passwordErrors.confirmPassword.message}</ErrorMessage>
                  )}
                </FormGroup>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Changing...' : 'Change Password'}
                </Button>
              </Form>
            </ProfileSection>

            <ProfileSection>
              <SectionTitle>
                ⚠️ Danger Zone
              </SectionTitle>

              <p style={{ color: '#666', marginBottom: '24px' }}>
                Once you delete your account, there is no going back. Please be certain.
              </p>

              <DangerButton 
                onClick={handleDeleteAccount}
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete Account'}
              </DangerButton>
            </ProfileSection>
          </ProfileGrid>
        </MainContent>
      </ProfileContainer>
    </ProtectedRoute>
  );
}
