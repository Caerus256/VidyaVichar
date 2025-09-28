import React, { useState, useEffect } from 'react';
import QuestionForm from '../Questions/QuestionForm';
import StudentStickyNote from '../Questions/StudentStickyNote';
import api from '../../services/api';

const StudentDashboard = ({ selectedClass }) => {
  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedClass) {
      fetchQuestions();
      const interval = setInterval(fetchQuestions, 10000); // Refresh every 10 seconds
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

  const handleQuestionAdded = (newQuestion) => {
    setQuestions(prev => [newQuestion, ...prev]);
  };

  const getQuestionCount = (status) => {
    if (status === 'deleted') {
      return questions.filter(q => q.deleted === true).length;
    }
    if (status === 'all') {
      // Count only non-deleted questions for "all"
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
          <h2>Student Q&A Board</h2>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <QuestionForm 
        onQuestionAdded={handleQuestionAdded} 
        selectedClass={selectedClass}
      />

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
        <h3>View Questions:</h3>
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
            <h3>No questions found</h3>
            <p>
              {filter === 'deleted' 
                ? 'No deleted questions yet.' 
                : filter === 'all'
                ? 'Be the first to ask a question in this class!'
                : `No ${filter} questions yet.`
              }
            </p>
          </div>
        ) : (
          getFilteredQuestions().map(question => (
            <StudentStickyNote 
              key={question._id} 
              question={question} 
              isDeleted={question.deleted === true}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
