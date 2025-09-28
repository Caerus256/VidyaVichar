import React, { useState } from 'react';
import api from '../../services/api';

const ClassCreationForm = ({ onClassCreated, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.description.trim() || !formData.subject.trim()) {
      setError('All fields are required');
      return;
    }

    if (formData.name.length > 100) {
      setError('Class name must be less than 100 characters');
      return;
    }

    if (formData.subject.length > 50) {
      setError('Subject must be less than 50 characters');
      return;
    }

    if (formData.description.length > 300) {
      setError('Description must be less than 300 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/classes', {
        name: formData.name.trim(),
        description: formData.description.trim(),
        subject: formData.subject.trim()
      });
      
      onClassCreated(response.data);
      setFormData({ name: '', description: '', subject: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create class');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isFormValid = formData.name.trim() && 
                     formData.description.trim() && 
                     formData.subject.trim();

  return (
    <div className="class-creation-overlay">
      <div className="class-creation-form">
        <div className="form-header">
          <h3>Create New Class</h3>
          <button onClick={onCancel} className="close-btn" disabled={loading}>
            ×
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="form-content">
          <div className="form-group">
            <label htmlFor="className">Class Name *</label>
            <input
              id="className"
              type="text"
              name="name"
              placeholder="e.g., Advanced Mathematics, Physics Lab Session"
              value={formData.name}
              onChange={handleChange}
              maxLength={100}
              disabled={loading}
            />
            <small className="char-count">{formData.name.length}/100</small>
          </div>

          <div className="form-group">
            <label htmlFor="classSubject">Subject *</label>
            <input
              id="classSubject"
              type="text"
              name="subject"
              placeholder="e.g., Mathematics, Physics, Chemistry"
              value={formData.subject}
              onChange={handleChange}
              maxLength={50}
              disabled={loading}
            />
            <small className="char-count">{formData.subject.length}/50</small>
          </div>

          <div className="form-group">
            <label htmlFor="classDescription">Description *</label>
            <textarea
              id="classDescription"
              name="description"
              placeholder="Brief description of the class and what topics will be covered..."
              value={formData.description}
              onChange={handleChange}
              maxLength={300}
              rows={4}
              disabled={loading}
            />
            <small className="char-count">{formData.description.length}/300</small>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={onCancel}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={handleSubmit}
              className="btn btn-primary"
              disabled={loading || !isFormValid}
            >
              {loading ? 'Creating...' : 'Create Class'}
            </button>
          </div>
        </div>

        <div className="form-note">
          <p>Note: Once created, this class will be visible to all students and TAs. They can join and participate in doubt sessions.</p>
        </div>
      </div>
    </div>
  );
};

export default ClassCreationForm;