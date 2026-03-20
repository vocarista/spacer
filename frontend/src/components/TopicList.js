/**
 * Topic list component
 * Displays a list of user's topics with filtering and sorting options
 */

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTopics } from '../hooks/useTopics';
import TopicForm from './TopicForm';
import formatInterval from '../utils/dateUtils';

const ListContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const ListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
`;

const ListTitle = styled.h2`
  font-size: 1.5rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Controls = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
`;

const SearchInput = styled.input`
  padding: 8px 12px;
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  font-size: 0.9rem;
  min-width: 200px;

  &:focus {
    outline: none;
    border-color: #667eea;
  }

  &::placeholder {
    color: #999;
  }
`;

const SortSelect = styled.select`
  padding: 8px 12px;
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const CreateButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
`;

const FilterTab = styled.button`
  background: none;
  border: none;
  padding: 12px 16px;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${props => props.active ? '#667eea' : '#666'};
  cursor: pointer;
  border-bottom: 2px solid ${props => props.active ? '#667eea' : 'transparent'};
  transition: color 0.2s, border-color 0.2s;

  &:hover {
    color: '#667eea';
  }
`;

const TopicsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TopicCard = styled.div`
  border: 2px solid #f0f0f0;
  border-radius: 8px;
  padding: 20px;
  transition: border-color 0.2s, box-shadow 0.2s;
  cursor: pointer;

  &:hover {
    border-color: #667eea;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
  }

  &.due-today {
    border-color: #f39c12;
    background: #fff9e6;
  }

  &.overdue {
    border-color: #e74c3c;
    background: #fee;
  }
`;

const TopicHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const TopicName = styled.h3`
  font-size: 1.1rem;
  color: #333;
  margin: 0;
  flex: 1;
`;

const TopicStatus = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
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
  font-size: 0.9rem;
  margin: 0 0 12px 0;
  line-height: 1.4;

  &:empty {
    display: none;
  }
`;

const TopicMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: #666;
`;

const TopicLinks = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
`;

const TopicLink = styled.a`
  color: #667eea;
  text-decoration: none;
  font-size: 0.8rem;
  padding: 2px 6px;
  border: 1px solid #667eea;
  border-radius: 3px;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: #667eea;
    color: white;
  }
`;

const TopicActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`;

const ActionButton = styled.button`
  background: none;
  border: 1px solid #e1e5e9;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;

  &:hover {
    background: #f8f9fa;
    border-color: #667eea;
    color: #667eea;
  }

  &.edit {
    color: #667eea;
    border-color: #667eea;

    &:hover {
      background: #667eea;
      color: white;
    }
  }

  &.delete {
    color: #e74c3c;
    border-color: #e74c3c;

    &:hover {
      background: #e74c3c;
      color: white;
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #666;
`;

const EmptyStateIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 16px;
  opacity: 0.3;
`;

const EmptyStateText = styled.p`
  font-size: 1.1rem;
  margin-bottom: 24px;
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

const filterOptions = [
  { key: 'all', label: 'All Topics' },
  { key: 'today', label: 'Due Today' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'upcoming', label: 'Upcoming' }
];

const sortOptions = [
  { key: 'next_review_date', label: 'Review Date' },
  { key: 'name', label: 'Name' },
  { key: 'created_at', label: 'Created Date' },
  { key: 'interval_days', label: 'Interval' }
];

export default function TopicList({ onTopicSelect, onCreateTopic }) {
  const { topics, isLoading, searchTopics, deleteTopic } = useTopics();
  const [filteredTopics, setFilteredTopics] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('next_review_date');
  const [filterBy, setFilterBy] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);

  useEffect(() => {
    filterAndSortTopics();
  }, [topics, searchQuery, sortBy, filterBy]);

  const filterAndSortTopics = () => {
    let filtered = [...topics];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(topic =>
        topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (topic.description && topic.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply status filter
    const today = new Date().toISOString().split('T')[0];
    filtered = filtered.filter(topic => {
      switch (filterBy) {
        case 'today':
          return topic.next_review_date === today;
        case 'overdue':
          return topic.next_review_date < today;
        case 'upcoming':
          return topic.next_review_date > today;
        default:
          return true;
      }
    });

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created_at':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'interval_days':
          return b.interval_days - a.interval_days;
        case 'next_review_date':
        default:
          return new Date(a.next_review_date) - new Date(b.next_review_date);
      }
    });

    setFilteredTopics(filtered);
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query) {
      await searchTopics(query);
    }
  };

  const getTopicStatus = (topic) => {
    const today = new Date().toISOString().split('T')[0];
    if (topic.next_review_date < today) return 'overdue';
    if (topic.next_review_date === today) return 'due-today';
    return 'upcoming';
  };

  const handleEdit = (topic) => {
    setEditingTopic(topic);
    setShowCreateForm(true);
  };

  const handleDelete = async (topic, e) => {
    e.stopPropagation();
    
    if (window.confirm(`Are you sure you want to delete "${topic.name}"? This action cannot be undone.`)) {
      try {
        await deleteTopic(topic.id);
      } catch (error) {
        console.error('Failed to delete topic:', error);
      }
    }
  };

  const handleFormSuccess = () => {
    setShowCreateForm(false);
    setEditingTopic(null);
  };

  const handleFormCancel = () => {
    setShowCreateForm(false);
    setEditingTopic(null);
  };

  if (showCreateForm) {
    return (
      <TopicForm
        topic={editingTopic}
        onCancel={handleFormCancel}
        onSuccess={handleFormSuccess}
      />
    );
  }

  if (isLoading && topics.length === 0) {
    return (
      <ListContainer>
        <LoadingState>
          <LoadingSpinner />
          <div>Loading topics...</div>
        </LoadingState>
      </ListContainer>
    );
  }

  return (
    <ListContainer>
      <ListHeader>
        <ListTitle>
          📚 My Topics ({filteredTopics.length})
        </ListTitle>
        <Controls>
          <SearchInput
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <SortSelect
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            {sortOptions.map(option => (
              <option key={option.key} value={option.key}>
                Sort by {option.label}
              </option>
            ))}
          </SortSelect>
          <CreateButton
            onClick={() => setShowCreateForm(true)}
            disabled={isLoading}
          >
            + New Topic
          </CreateButton>
        </Controls>
      </ListHeader>

      <FilterTabs>
        {filterOptions.map(option => (
          <FilterTab
            key={option.key}
            active={filterBy === option.key}
            onClick={() => setFilterBy(option.key)}
          >
            {option.label}
          </FilterTab>
        ))}
      </FilterTabs>

      {filteredTopics.length === 0 ? (
        <EmptyState>
          <EmptyStateIcon>📚</EmptyStateIcon>
          <EmptyStateText>
            {searchQuery 
              ? 'No topics found matching your search.'
              : filterBy === 'all' 
                ? 'No topics yet. Create your first topic to get started!'
                : `No ${filterOptions.find(f => f.key === filterBy)?.label.toLowerCase()}.`
            }
          </EmptyStateText>
          {!searchQuery && filterBy === 'all' && (
            <CreateButton onClick={() => setShowCreateForm(true)}>
              Create Your First Topic
            </CreateButton>
          )}
        </EmptyState>
      ) : (
        <TopicsList>
          {filteredTopics.map(topic => {
            const status = getTopicStatus(topic);
            return (
              <TopicCard
                key={topic.id}
                className={status}
                onClick={() => onTopicSelect && onTopicSelect(topic)}
              >
                <TopicHeader>
                  <TopicName>{topic.name}</TopicName>
                  <TopicStatus className={status}>
                    {status === 'overdue' && '⚠️ Overdue'}
                    {status === 'due-today' && '📅 Due Today'}
                    {status === 'upcoming' && '📆 Upcoming'}
                  </TopicStatus>
                </TopicHeader>
                
                {topic.description && (
                  <TopicDescription>{topic.description}</TopicDescription>
                )}
                
                <TopicMeta>
                  <span>
                    Next review: {new Date(topic.next_review_date).toLocaleDateString()}
                  </span>
                  <span>
                    Interval: {formatInterval(topic.interval_days)}
                  </span>
                </TopicMeta>
                
                {topic.links && topic.links.length > 0 && (
                  <TopicLinks>
                    {topic.links.slice(0, 3).map((link, index) => (
                      <TopicLink
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        📗 Resource {index + 1}
                      </TopicLink>
                    ))}
                    {topic.links.length > 3 && (
                      <span style={{ color: '#666', fontSize: '0.8rem' }}>
                        +{topic.links.length - 3} more
                      </span>
                    )}
                  </TopicLinks>
                )}
                
                <TopicActions>
                  <ActionButton
                    className="edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(topic);
                    }}
                  >
                    Edit
                  </ActionButton>
                  <ActionButton
                    className="delete"
                    onClick={(e) => handleDelete(topic, e)}
                  >
                    Delete
                  </ActionButton>
                </TopicActions>
              </TopicCard>
            );
          })}
        </TopicsList>
      )}
    </ListContainer>
  );
}
