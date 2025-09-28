import React, { useState, useEffect } from 'react';
import TeacherStickyNote from '../Questions/TeacherStickyNote';
import api from '../../services/api';

const TeacherDashboard = ({ selectedClass }) => {
  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedClass) {
      fetchQuestions();
      const interval = setInterval(fetchQuestions, 5000); // Auto-refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [selectedClass]);

  const fetchQuestions = async () => {
    try {
      if (!selectedClass?._id) return;
      
      // Always fetch all questions including deleted for consistent stats
      const response = await api.get(`/api/questions?includeDeleted=true&classId=${selectedClass._id}`);
      setQuestions(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const updateQuestion = async (id, updates) => {
    try {
      await api.put(`/api/questions/${id}`, updates);
      setQuestions(prev => 
        prev.map(q => q._id === id ? { ...q, ...updates } : q)
      );
    } catch (error) {
      console.error('Error updating question:', error);
      setError('Failed to update question');
    }
  };

  const deleteQuestion = async (id) => {
    if (window.confirm('Delete this question?')) {
      try {
        const response = await api.delete(`/api/questions/${id}`);
        // Update the local state using the response from server to maintain data integrity
        setQuestions(prev => 
          prev.map(q => q._id === id ? response.data.question : q)
        );
      } catch (error) {
        console.error('Error deleting question:', error);
        setError('Failed to delete question');
      }
    }
  };

  const clearAllQuestions = async () => {
    if (window.confirm('Are you sure you want to clear all active questions? This action cannot be undone.')) {
      try {
        // Get only active (non-deleted) questions to delete
        const activeQuestions = questions.filter(q => !q.deleted);
        const deletePromises = activeQuestions.map(q => api.delete(`/api/questions/${q._id}`));
        const responses = await Promise.all(deletePromises);
        
        // Update state using server responses to maintain data integrity
        setQuestions(prev => 
          prev.map(q => {
            if (!q.deleted) {
              const response = responses.find(r => r.data.question._id === q._id);
              return response ? response.data.question : { ...q, deleted: true };
            }
            return q;
          })
        );
      } catch (error) {
        console.error('Error clearing questions:', error);
        setError('Failed to clear questions');
      }
    }
  };

  const getQuestionCount = (status) => {
    if (status === 'deleted') {
      return questions.filter(q => q.deleted === true).length;
    }
    if (status === 'all') {
      // Count only active (non-deleted) questions for "all"
      return questions.filter(q => !q.deleted).length;
    }
    // For specific statuses, count only non-deleted questions with that status
    return questions.filter(q => !q.deleted && q.status === status).length;
  };

  const getFilteredQuestions = () => {
    if (filter === 'deleted') {
      return questions.filter(q => q.deleted === true);
    }
    if (filter === 'all') {
      // Show only non-deleted questions for "all"
      return questions.filter(q => !q.deleted);
    }
    // For specific status filters, show only non-deleted questions with that status
    return questions.filter(q => !q.deleted && q.status === filter);
  };

  if (!selectedClass) {
    return <div className="loading">Please select a class to continue...</div>;
  }

  if (loading) return <div className="loading">Loading questions...</div>;

  return (
    <div className="student-dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Teacher Control Panel</h2>
        </div>
        <div className="teacher-actions">
          <button onClick={fetchQuestions} className="btn btn-secondary" disabled={loading}>
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </button>
          <button 
            onClick={clearAllQuestions} 
            className="btn btn-danger"
            disabled={getQuestionCount('all') === 0}
          >
            🗑️ Clear All Active
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="student-stats">
        <div className="stat-card pending">
          <span className="stat-number">{getQuestionCount('pending')}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat-card answered">
          <span className="stat-number">{getQuestionCount('answered')}</span>
          <span className="stat-label">Answered</span>
        </div>
        <div className="stat-card important">
          <span className="stat-number">{getQuestionCount('important')}</span>
          <span className="stat-label">Important</span>
        </div>
        <div className="stat-card deleted">
          <span className="stat-number">{getQuestionCount('deleted')}</span>
          <span className="stat-label">Deleted</span>
        </div>
      </div>

      <div className="filter-section">
        <h3>Filter Questions:</h3>
        <div className="filter-buttons">
          <button 
            className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={filter === 'pending' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button 
            className={filter === 'answered' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('answered')}
          >
            Answered
          </button>
          <button 
            className={filter === 'important' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('important')}
          >
            Important 
          </button>
          <button 
            className={filter === 'deleted' ? 'filter-btn deleted-filter active' : 'filter-btn deleted-filter'}
            onClick={() => setFilter('deleted')}
          >
            Deleted 
          </button>
        </div>
      </div>

      <div className="student-questions-grid">
        {getFilteredQuestions().length === 0 ? (
          <div className="no-questions">
            <h3>No questions to display</h3>
            <p>
              {filter === 'deleted' 
                ? 'No deleted questions found.' 
                : "Students haven't asked any questions yet in this class."
              }
            </p>
          </div>
        ) : (
          getFilteredQuestions().map(question => (
            <TeacherStickyNote
              key={question._id}
              question={question}
              onUpdate={updateQuestion}
              onDelete={deleteQuestion}
              isDeleted={question.deleted === true}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
