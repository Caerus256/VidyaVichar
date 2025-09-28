import React, { useState } from 'react';
import api from '../../services/api';

const QuestionForm = ({ onQuestionAdded, selectedClass }) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    // Clear previous error
    setError('');

    // Validate inputs
    if (!question.trim()) {
      setError('Question text is required');
      return;
    }
    
    if (!selectedClass?._id) {
      setError('Please select a class first');
      return;
    }

    if (question.trim().length < 10) {
      setError('Question must be at least 10 characters long');
      return;
    }

    if (question.trim().length > 500) {
      setError('Question must be less than 500 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await api.post('/api/questions', { 
        text: question.trim(),
        classId: selectedClass._id
      });
      
      // Call parent callback with new question
      if (onQuestionAdded && typeof onQuestionAdded === 'function') {
        onQuestionAdded(response.data);
      }
      
      // Clear form on success
      setQuestion('');
      setError('');
    } catch (err) {
      console.error('Error posting question:', err);
      
      // Handle different types of errors
      if (err.response?.status === 400) {
        setError(err.response.data.message || 'Invalid request. Please check your input.');
      } else if (err.response?.status === 401) {
        setError('You need to login again');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to post questions in this class');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(err.response?.data?.message || 'Failed to post question. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!selectedClass) {
    return (
      <div className="student-question-form">
        <h3>Please select a class first</h3>
        <p>You need to select a class before you can ask questions.</p>
      </div>
    );
  }

  const characterCount = question.length;
  const isOverLimit = characterCount > 500;
  const isUnderMinimum = characterCount > 0 && characterCount < 10;
  const canSubmit = !loading && question.trim() && !isOverLimit && !isUnderMinimum;

  return (
    <div className="student-question-form">
      <h3>Ask Your Question in {selectedClass.name}</h3>
      <p className="class-context">Subject: {selectedClass.subject}</p>
      
      {error && <div className="error">{error}</div>}
      
      <div className="question-input-group">
        <textarea
          placeholder={`Type your question about ${selectedClass.subject} here...`}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={loading}
          maxLength={500}
          rows={4}
          style={{
            borderColor: isOverLimit ? '#e74c3c' : isUnderMinimum ? '#f39c12' : undefined
          }}
        />
        <div className="form-footer">
          <small 
            className={`char-count ${isOverLimit ? 'over-limit' : isUnderMinimum ? 'under-minimum' : ''}`}
          >
            {characterCount}/500 characters
            {isUnderMinimum && ' (minimum 10 characters)'}
            {isOverLimit && ' (over limit!)'}
          </small>
          <button 
            onClick={handleSubmit}
            disabled={!canSubmit} 
            className="btn btn-primary submit-btn"
            title={
              loading ? 'Posting...' :
              !question.trim() ? 'Enter a question' :
              isUnderMinimum ? 'Question too short (minimum 10 characters)' :
              isOverLimit ? 'Question too long (maximum 500 characters)' :
              'Post your question'
            }
          >
            {loading ? 'Posting...' : 'Post Question'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionForm;
