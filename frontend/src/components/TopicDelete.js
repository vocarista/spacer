/**
 * Topic deletion confirmation component
 * Provides a safe way to delete topics with confirmation and feedback
 */

import { useState } from 'react';
import styled from 'styled-components';
import { useTopics } from '../hooks/useTopics';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 32px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  margin-bottom: 24px;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  color: #333;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ModalSubtitle = styled.p`
  color: #666;
  font-size: 1rem;
  margin: 0;
  line-height: 1.4;
`;

const WarningBox = styled.div`
  background: #fee;
  border: 2px solid #fcc;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
`;

const WarningTitle = styled.div`
  font-weight: 600;
  color: #c33;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const WarningText = styled.div`
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const TopicInfo = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
`;

const TopicName = styled.div`
  font-weight: 600;
  color: #333;
  font-size: 1.1rem;
  margin-bottom: 8px;
`;

const TopicMeta = styled.div`
  display: flex;
  gap: 16px;
  font-size: 0.9rem;
  color: #666;
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ConfirmSection = styled.div`
  margin-bottom: 24px;
`;

const ConfirmLabel = styled.label`
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  display: block;
`;

const ConfirmInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #e74c3c;
  }

  &::placeholder {
    color: #999;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  font-size: 0.8rem;
  margin-top: 4px;
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background: white;
  color: #666;
  border: 2px solid #e1e5e9;

  &:hover:not(:disabled) {
    background: #f8f9fa;
    border-color: #667eea;
    color: #667eea;
  }
`;

const DeleteButton = styled(Button)`
  background: #e74c3c;
  color: white;

  &:hover:not(:disabled) {
    background: #c0392b;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 20px;
  color: #666;
`;

const LoadingSpinner = styled.div`
  width: 24px;
  height: 24px;
  border: 2px solid #f0f0f0;
  border-top: 2px solid #e74c3c;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 12px;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export default function TopicDelete({ topic, onCancel, onSuccess }) {
  const { deleteTopic, isLoading } = useTopics();
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');

  const expectedText = `delete ${topic.name.toLowerCase()}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (confirmText !== expectedText) {
      setError('Please type the confirmation text exactly as shown');
      return;
    }

    try {
      setError('');
      await deleteTopic(topic.id);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message || 'Failed to delete topic');
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const isConfirmDisabled = confirmText !== expectedText || isLoading;

  if (isLoading) {
    return (
      <ModalOverlay>
        <ModalContent>
          <LoadingState>
            <LoadingSpinner />
            <div>Deleting topic...</div>
          </LoadingState>
        </ModalContent>
      </ModalOverlay>
    );
  }

  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>
            ⚠️ Delete Topic
          </ModalTitle>
          <ModalSubtitle>
            This action cannot be undone. All data associated with this topic will be permanently deleted.
          </ModalSubtitle>
        </ModalHeader>

        <WarningBox>
          <WarningTitle>
            ⚠️ Warning
          </WarningTitle>
          <WarningText>
            Deleting this topic will remove:
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>The topic and all its details</li>
              <li>All review history and progress</li>
              <li>Any associated study links</li>
            </ul>
            This action is permanent and cannot be recovered.
          </WarningText>
        </WarningBox>

        <TopicInfo>
          <TopicName>{topic.name}</TopicName>
          <TopicMeta>
            <MetaItem>
              📅 Created: {new Date(topic.created_at).toLocaleDateString()}
            </MetaItem>
            <MetaItem>
              📚 Reviews: {topic.repetition_count}
            </MetaItem>
            <MetaItem>
              ⏱️ Interval: {topic.interval_days} days
            </MetaItem>
          </TopicMeta>
        </TopicInfo>

        <ConfirmSection>
          <form onSubmit={handleSubmit}>
            <ConfirmLabel htmlFor="confirm">
              Type <strong>"{expectedText}"</strong> to confirm deletion:
            </ConfirmLabel>
            <ConfirmInput
              id="confirm"
              type="text"
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value);
                setError('');
              }}
              placeholder={expectedText}
              autoComplete="off"
              autoFocus
            />
            {error && <ErrorMessage>{error}</ErrorMessage>}
            
            <Actions style={{ marginTop: '24px' }}>
              <CancelButton
                type="button"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </CancelButton>
              <DeleteButton
                type="submit"
                disabled={isConfirmDisabled}
              >
                Delete Topic
              </DeleteButton>
            </Actions>
          </form>
        </ConfirmSection>
      </ModalContent>
    </ModalOverlay>
  );
}
