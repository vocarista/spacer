/**
 * Topic creation form component
 * Handles creating new topics with validation and user feedback
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { useTopics } from '../hooks/useTopics';

const FormContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  margin: 0 auto;
`;

const FormTitle = styled.h2`
  font-size: 1.5rem;
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

const Input = styled.textarea`
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #667eea;
  }

  &::placeholder {
    color: #999;
  }
`;

const TextInput = styled.input`
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #667eea;
  }

  &::placeholder {
    color: #999;
  }
`;

const DateInput = styled.input`
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const ErrorMessage = styled.span`
  color: #e74c3c;
  font-size: 0.8rem;
  margin-top: 4px;
`;

const LinksSection = styled.div`
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  padding: 16px;
`;

const LinksHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const LinksTitle = styled.span`
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
`;

const AddLinkButton = styled.button`
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #5a6fd8;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LinkItem = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
`;

const LinkInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  font-size: 0.9rem;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const RemoveLinkButton = styled.button`
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 8px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #c0392b;
  }
`;

const SubmitButton = styled.button`
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

const CancelButton = styled.button`
  background: white;
  color: #666;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  padding: 14px 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: #f8f9fa;
    color: #333;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
`;

const Alert = styled.div`
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 0.9rem;

  &.error {
    background: #fee;
    color: #c33;
    border: 1px solid #fcc;
  }

  &.success {
    background: #efe;
    color: #3c3;
    border: 1px solid #cfc;
  }
`;

const HelpText = styled.p`
  color: #666;
  font-size: 0.8rem;
  margin-top: 4px;
  line-height: 1.4;
`;

export default function TopicForm({ topic, onCancel, onSuccess }) {
  const { createTopic, updateTopic, isLoading } = useTopics();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [links, setLinks] = useState(topic?.links || ['']);

  const isEditing = !!topic;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: topic || {
      name: '',
      description: '',
      initialDate: new Date().toISOString().split('T')[0]
    }
  });

  const addLink = () => {
    if (links.length < 10) { // Limit to 10 links
      setLinks([...links, '']);
    }
  };

  const removeLink = (index) => {
    const newLinks = links.filter((_, i) => i !== index);
    setLinks(newLinks.length > 0 ? newLinks : ['']);
  };

  const updateLink = (index, value) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
  };

  const onSubmit = async (data) => {
    try {
      setError('');
      setSuccess('');

      // Filter out empty links and validate URLs
      const validLinks = links.filter(link => link.trim() !== '');
      const invalidLinks = validLinks.filter(link => {
        try {
          new URL(link);
          return false;
        } catch {
          return true;
        }
      });

      if (invalidLinks.length > 0) {
        setError(`Invalid URLs: ${invalidLinks.join(', ')}`);
        return;
      }

      const topicData = {
        ...data,
        links: validLinks
      };

      let result;
      if (isEditing) {
        result = await updateTopic(topic.id, topicData);
        setSuccess('Topic updated successfully!');
      } else {
        result = await createTopic(topicData);
        setSuccess('Topic created successfully!');
        reset(); // Clear form for new topics
        setLinks(['']); // Reset links
      }

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      setError(err.message || 'Failed to save topic');
    }
  };

  return (
    <FormContainer>
      <FormTitle>
        {isEditing ? '✏️ Edit Topic' : '➕ Create New Topic'}
      </FormTitle>

      {error && (
        <Alert className="error">
          {error}
        </Alert>
      )}

      {success && (
        <Alert className="success">
          {success}
        </Alert>
      )}

      <Form onSubmit={handleSubmit(onSubmit)}>
        <FormGroup>
          <Label htmlFor="name">Topic Name *</Label>
          <TextInput
            id="name"
            placeholder="Enter topic name (e.g., JavaScript Arrays)"
            {...register('name', {
              required: 'Topic name is required',
              minLength: {
                value: 1,
                message: 'Topic name cannot be empty'
              },
              maxLength: {
                value: 255,
                message: 'Topic name cannot exceed 255 characters'
              }
            })}
          />
          {errors.name && (
            <ErrorMessage>{errors.name.message}</ErrorMessage>
          )}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            placeholder="Add a description to help you remember what this topic covers..."
            rows={3}
            {...register('description', {
              maxLength: {
                value: 1000,
                message: 'Description cannot exceed 1000 characters'
              }
            })}
          />
          {errors.description && (
            <ErrorMessage>{errors.description.message}</ErrorMessage>
          )}
          <HelpText>
            Optional: Add details about what you want to learn with this topic
          </HelpText>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="initialDate">Initial Review Date</Label>
          <DateInput
            id="initialDate"
            type="date"
            max={new Date().toISOString().split('T')[0]}
            {...register('initialDate', {
              required: 'Initial date is required'
            })}
          />
          {errors.initialDate && (
            <ErrorMessage>{errors.initialDate.message}</ErrorMessage>
          )}
          <HelpText>
            When do you want to start reviewing this topic?
          </HelpText>
        </FormGroup>

        <FormGroup>
          <Label>Study Links</Label>
          <LinksSection>
            <LinksHeader>
              <LinksTitle>Resources & References</LinksTitle>
              <AddLinkButton
                type="button"
                onClick={addLink}
                disabled={links.length >= 10}
              >
                + Add Link
              </AddLinkButton>
            </LinksHeader>
            
            {links.map((link, index) => (
              <LinkItem key={index}>
                <LinkInput
                  type="url"
                  placeholder="https://example.com/resource"
                  value={link}
                  onChange={(e) => updateLink(index, e.target.value)}
                />
                {links.length > 1 && (
                  <RemoveLinkButton
                    type="button"
                    onClick={() => removeLink(index)}
                  >
                    Remove
                  </RemoveLinkButton>
                )}
              </LinkItem>
            ))}
            
            <HelpText>
              Add links to study materials, documentation, or reference resources
            </HelpText>
          </LinksSection>
        </FormGroup>

        <ButtonGroup>
          <CancelButton
            type="button"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </CancelButton>
          <SubmitButton type="submit" disabled={isLoading}>
            {isLoading 
              ? (isEditing ? 'Updating...' : 'Creating...') 
              : (isEditing ? 'Update Topic' : 'Create Topic')
            }
          </SubmitButton>
        </ButtonGroup>
      </Form>
    </FormContainer>
  );
}
