/**
 * Topic detail page
 * Shows detailed information about a specific topic with review history
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import { useTopics } from '../hooks/useTopics';
import ProtectedRoute from '../components/ProtectedRoute';
import TopicForm from '../components/TopicForm';
import formatInterval from '../utils/dateUtils';

const DetailContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 20px;
`;

const Header = styled.header`
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
`;

const TopicTitle = styled.h1`
  font-size: 2rem;
  color: #333;
  margin: 0;
  flex: 1;
`;

const TopicStatus = styled.span`
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;

  &.due-today {
    background: #f39c12;
    color: white;
  }

  &.overdue {
    background: #e74c3c;
    color: white;
  }

  &.upcoming {
    background: #27ae60;
    color: white;
  }
`;

const TopicDescription = styled.p`
  color: #666;
  font-size: 1.1rem;
  line-height: 1.6;
  margin: 0 0 24px 0;
`;

const TopicMeta = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
`;

const MetaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const MetaLabel = styled.span`
  color: #666;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const MetaValue = styled.span`
  color: #333;
  font-size: 0.9rem;
  font-weight: 500;
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

const Button = styled.button`
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

const DangerButton = styled.button`
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #c0392b;
  }
`;

const Section = styled.section`
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  color: #333;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LinksGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
`;

const LinkCard = styled.a`
  display: block;
  padding: 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  text-decoration: none;
  color: #333;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:hover {
    border-color: #667eea;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
  }
`;

const LinkTitle = styled.div`
  font-weight: 600;
  margin-bottom: 4px;
  color: #667eea;
`;

const LinkUrl = styled.div`
  font-size: 0.8rem;
  color: #666;
  word-break: break-all;
`;

const ReviewHistory = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ReviewItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
`;

const ReviewInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ReviewDate = styled.span`
  font-weight: 600;
  color: #333;
`;

const ReviewQuality = styled.span`
  font-size: 0.9rem;
  color: #666;
`;

const ReviewRating = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${props => {
    const rating = props.rating;
    if (rating >= 4) return '#d4edda';
    if (rating >= 3) return '#fff3cd';
    return '#f8d7da';
  }};
  color: ${props => {
    const rating = props.rating;
    if (rating >= 4) return '#155724';
    if (rating >= 3) return '#856404';
    return '#721c24';
  }};
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
`;

const LoadingSpinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid #f0f0f0;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #667eea;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  padding: 8px 0;
  transition: color 0.2s;

  &:hover {
    color: #5a6fd8;
  }
`;

export default function TopicDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { getTopic, deleteTopic, isLoading } = useTopics();
  const [topic, setTopic] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadTopic();
    }
  }, [id]);

  const loadTopic = async () => {
    try {
      setError('');
      const topicData = await getTopic(parseInt(id));
      setTopic(topicData);
    } catch (err) {
      setError(err.message || 'Failed to load topic');
    }
  };

  const handleEdit = () => {
    setShowEditForm(true);
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${topic.name}"? This action cannot be undone.`)) {
      try {
        await deleteTopic(topic.id);
        router.push('/topics');
      } catch (err) {
        setError(err.message || 'Failed to delete topic');
      }
    }
  };

  const handleFormSuccess = () => {
    setShowEditForm(false);
    loadTopic(); // Reload topic data
  };

  const handleFormCancel = () => {
    setShowEditForm(false);
  };

  const getTopicStatus = (topic) => {
    const today = new Date().toISOString().split('T')[0];
    if (topic.next_review_date < today) return 'overdue';
    if (topic.next_review_date === today) return 'due-today';
    return 'upcoming';
  };

  if (showEditForm) {
    return (
      <DetailContainer>
        <BackButton onClick={() => setShowEditForm(false)}>
          ← Back to Topic Details
        </BackButton>
        <TopicForm
          topic={topic}
          onCancel={handleFormCancel}
          onSuccess={handleFormSuccess}
        />
      </DetailContainer>
    );
  }

  if (isLoading || !topic) {
    return (
      <ProtectedRoute>
        <DetailContainer>
          <LoadingState>
            <LoadingSpinner />
            <div>Loading topic details...</div>
          </LoadingState>
        </DetailContainer>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <DetailContainer>
          <div style={{ color: '#e74c3c', textAlign: 'center', padding: '40px' }}>
            {error}
          </div>
        </DetailContainer>
      </ProtectedRoute>
    );
  }

  const status = getTopicStatus(topic);

  return (
    <ProtectedRoute>
      <DetailContainer>
        <BackButton onClick={() => router.push('/topics')}>
          ← Back to Topics
        </BackButton>

        <Header>
          <HeaderContent>
            <TopicTitle>{topic.name}</TopicTitle>
            <TopicStatus className={status}>
              {status === 'overdue' && '⚠️ Overdue'}
              {status === 'due-today' && '📅 Due Today'}
              {status === 'upcoming' && '📆 Upcoming'}
            </TopicStatus>
          </HeaderContent>

          {topic.description && (
            <TopicDescription>{topic.description}</TopicDescription>
          )}

          <TopicMeta>
            <MetaItem>
              <MetaLabel>Next Review</MetaLabel>
              <MetaValue>{new Date(topic.next_review_date).toLocaleDateString()}</MetaValue>
            </MetaItem>
            <MetaItem>
              <MetaLabel>Review Interval</MetaLabel>
              <MetaValue>{formatInterval(topic.interval_days)}</MetaValue>
            </MetaItem>
            <MetaItem>
              <MetaLabel>Easiness Factor</MetaLabel>
              <MetaValue>{topic.easiness_factor.toFixed(2)}</MetaValue>
            </MetaItem>
            <MetaItem>
              <MetaLabel>Repetitions</MetaLabel>
              <MetaValue>{topic.repetition_count}</MetaValue>
            </MetaItem>
            <MetaItem>
              <MetaLabel>Created</MetaLabel>
              <MetaValue>{new Date(topic.created_at).toLocaleDateString()}</MetaValue>
            </MetaItem>
            <MetaItem>
              <MetaLabel>Last Updated</MetaLabel>
              <MetaValue>{new Date(topic.updated_at).toLocaleDateString()}</MetaValue>
            </MetaItem>
          </TopicMeta>

          <Actions>
            <Button onClick={handleEdit}>
              ✏️ Edit Topic
            </Button>
            <SecondaryButton onClick={() => router.push('/topics')}>
              📚 Back to Topics
            </SecondaryButton>
            <DangerButton onClick={handleDelete}>
              🗑️ Delete Topic
            </DangerButton>
          </Actions>
        </Header>

        {topic.links && topic.links.length > 0 && (
          <Section>
            <SectionTitle>
              📗 Study Resources ({topic.links.length})
            </SectionTitle>
            <LinksGrid>
              {topic.links.map((link, index) => (
                <LinkCard
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <LinkTitle>Resource {index + 1}</LinkTitle>
                  <LinkUrl>{link}</LinkUrl>
                </LinkCard>
              ))}
            </LinksGrid>
          </Section>
        )}

        <Section>
          <SectionTitle>
            📈 Review History
          </SectionTitle>
          {topic.reviewHistory && topic.reviewHistory.length > 0 ? (
            <ReviewHistory>
              {topic.reviewHistory.map((review, index) => (
                <ReviewItem key={index}>
                  <ReviewInfo>
                    <ReviewDate>{new Date(review.review_date).toLocaleDateString()}</ReviewDate>
                    <ReviewQuality>Time: {review.review_time_seconds || 0}s</ReviewQuality>
                  </ReviewInfo>
                  <ReviewRating rating={review.quality_rating}>
                    Rating: {review.quality_rating}/5
                  </ReviewRating>
                </ReviewItem>
              ))}
            </ReviewHistory>
          ) : (
            <EmptyState>
              No review history yet. Start reviewing this topic to see your progress!
            </EmptyState>
          )}
        </Section>
      </DetailContainer>
    </ProtectedRoute>
  );
}
