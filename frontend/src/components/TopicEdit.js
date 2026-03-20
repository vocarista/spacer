/**
 * Topic editing component
 * Inline editing for topic details with auto-save functionality
 */

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTopics } from '../hooks/useTopics';

const EditContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const EditHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const EditTitle = styled.h3`
  font-size: 1.1rem;
  color: #333;
  margin: 0;
`;

const EditActions = styled.div`
  display: flex;
  gap: 8px;
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

  &.save {
    background: #667eea;
    color: white;
    border-color: #667eea;

    &:hover {
      background: #5a6fd8;
    }
  }

  &.cancel {
    color: #e74c3c;
    border-color: #e74c3c;

    &:hover {
      background: #fee;
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const EditForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  font-size: 0.9rem;
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

const Textarea = styled.textarea`
  padding: 8px 12px;
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
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

const LinksEditor = styled.div`
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  padding: 12px;
`;

const LinksHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const LinksTitle = styled.span`
  font-weight: 600;
  color: #333;
  font-size: 0.8rem;
`;

const AddLinkButton = styled.button`
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.7rem;
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
  gap: 6px;
  margin-bottom: 6px;
  align-items: center;
`;

const LinkInput = styled.input`
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #e1e5e9;
  border-radius: 4px;
  font-size: 0.8rem;

  &:focus {
    outline: none;
    border-color: #667eea;
  }

  &:disabled {
    background: #f8f9fa;
    cursor: not-allowed;
  }
`;

const RemoveLinkButton = styled.button`
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 3px;
  padding: 4px 6px;
  font-size: 0.7rem;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #c0392b;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.span`
  color: #e74c3c;
  font-size: 0.8rem;
  margin-top: 4px;
`;

const SuccessMessage = styled.div`
  background: #d4edda;
  color: #155724;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  border: 1px solid #c3e6cb;
`;

const CharacterCount = styled.span`
  color: #666;
  font-size: 0.7rem;
  text-align: right;
`;

export default function TopicEdit({ topic, onCancel, onSuccess }) {
  const { updateTopic, isLoading } = useTopics();
  const [editData, setEditData] = useState({
    name: topic?.name || '',
    description: topic?.description || '',
    links: topic?.links || ['']
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (topic) {
      setEditData({
        name: topic.name,
        description: topic.description || '',
        links: topic.links && topic.links.length > 0 ? topic.links : ['']
      });
    }
  }, [topic]);

  const validateForm = () => {
    const newErrors = {};

    if (!editData.name.trim()) {
      newErrors.name = 'Topic name is required';
    } else if (editData.name.length > 255) {
      newErrors.name = 'Topic name cannot exceed 255 characters';
    }

    if (editData.description && editData.description.length > 1000) {
      newErrors.description = 'Description cannot exceed 1000 characters';
    }

    // Validate URLs
    const validLinks = editData.links.filter(link => link.trim() !== '');
    const invalidLinks = validLinks.filter(link => {
      try {
        new URL(link);
        return false;
      } catch {
        return true;
      }
    });

    if (invalidLinks.length > 0) {
      newErrors.links = `Invalid URLs: ${invalidLinks.join(', ')}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSuccess('');
      const validLinks = editData.links.filter(link => link.trim() !== '');
      
      const updateData = {
        name: editData.name.trim(),
        description: editData.description.trim(),
        links: validLinks
      };

      const updatedTopic = await updateTopic(topic.id, updateData);
      
      setSuccess('Topic updated successfully!');
      
      if (onSuccess) {
        setTimeout(() => onSuccess(updatedTopic), 1000);
      }
    } catch (error) {
      setErrors({ submit: error.message });
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const addLink = () => {
    if (editData.links.length < 10) {
      setEditData({
        ...editData,
        links: [...editData.links, '']
      });
    }
  };

  const removeLink = (index) => {
    const newLinks = editData.links.filter((_, i) => i !== index);
    setEditData({
      ...editData,
      links: newLinks.length > 0 ? newLinks : ['']
    });
  };

  const updateLink = (index, value) => {
    const newLinks = [...editData.links];
    newLinks[index] = value;
    setEditData({
      ...editData,
      links: newLinks
    });
  };

  return (
    <EditContainer>
      <EditHeader>
        <EditTitle>✏️ Edit Topic</EditTitle>
        <EditActions>
          <ActionButton
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </ActionButton>
          <ActionButton
            type="submit"
            form="editTopicForm"
            className="save"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </ActionButton>
        </EditActions>
      </EditHeader>

      {success && <SuccessMessage>{success}</SuccessMessage>}
      {errors.submit && <ErrorMessage>{errors.submit}</ErrorMessage>}

      <EditForm id="editTopicForm" onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="name">Topic Name</Label>
          <Input
            id="name"
            type="text"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            disabled={isLoading}
            maxLength={255}
          />
          {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
          <CharacterCount>{editData.name.length}/255</CharacterCount>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            disabled={isLoading}
            maxLength={1000}
            placeholder="Add a description to help you remember what this topic covers..."
          />
          {errors.description && <ErrorMessage>{errors.description}</ErrorMessage>}
          <CharacterCount>{editData.description.length}/1000</CharacterCount>
        </FormGroup>

        <FormGroup>
          <Label>Study Links</Label>
          <LinksEditor>
            <LinksHeader>
              <LinksTitle>Resources ({editData.links.filter(link => link.trim()).length})</LinksTitle>
              <AddLinkButton
                type="button"
                onClick={addLink}
                disabled={isLoading || editData.links.length >= 10}
              >
                + Add
              </AddLinkButton>
            </LinksHeader>
            
            {editData.links.map((link, index) => (
              <LinkItem key={index}>
                <LinkInput
                  type="url"
                  placeholder="https://example.com/resource"
                  value={link}
                  onChange={(e) => updateLink(index, e.target.value)}
                  disabled={isLoading}
                />
                {editData.links.length > 1 && (
                  <RemoveLinkButton
                    type="button"
                    onClick={() => removeLink(index)}
                    disabled={isLoading}
                  >
                    ×
                  </RemoveLinkButton>
                )}
              </LinkItem>
            ))}
            
            {errors.links && <ErrorMessage>{errors.links}</ErrorMessage>}
          </LinksEditor>
        </FormGroup>
      </EditForm>
    </EditContainer>
  );
}
