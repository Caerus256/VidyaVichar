import React from 'react';

const TAStickyNote = ({ question, onUpdate, isDeleted }) => {
  const handleStatusChange = (newStatus) => {
    // Don't allow status changes for deleted questions
    if (isDeleted) return;
    onUpdate(question._id, { status: newStatus });
  };

  const getStatusIcon = () => {
    if (isDeleted) return '🗑️';
    switch (question.status) {
      case 'answered': return '✅';
      case 'important': return '⭐';
      default: return '❓';
    }
  };

  const getStatusText = () => {
    if (isDeleted) return 'Deleted';
    switch (question.status) {
      case 'answered': return 'Answered';
      case 'important': return 'Important';
      default: return 'Pending';
    }
  };

  return (
    <div 
      className={`teacher-sticky-note ${question.status} ${isDeleted ? 'deleted-question' : ''}`} 
      style={{ backgroundColor: isDeleted ? '#f8f9fa' : question.color }}
    >
      <div className="sticky-header">
        <div className="status-info">
          <span className="status-icon">{getStatusIcon()}</span>
          <span className="status-text">{getStatusText()}</span>
        </div>
        <small className="author">{question.author}</small>
        {/* TAs cannot delete questions */}
      </div>
      
      <div className="sticky-content">
        <p>{question.text}</p>
      </div>
      
      <div className="sticky-footer">
        <small className="time">{new Date(question.createdAt).toLocaleTimeString()}</small>
        <div className="teacher-controls">
          <button 
            onClick={() => handleStatusChange('pending')}
            className={`control-btn pending ${question.status === 'pending' ? 'active' : ''} ${isDeleted ? 'disabled' : ''}`}
            title={isDeleted ? 'Cannot modify deleted question' : 'Mark as pending'}
            disabled={isDeleted}
          >
            ❓
          </button>
          <button 
            onClick={() => handleStatusChange('important')}
            className={`control-btn important ${question.status === 'important' ? 'active' : ''} ${isDeleted ? 'disabled' : ''}`}
            title={isDeleted ? 'Cannot modify deleted question' : 'Mark as important'}
            disabled={isDeleted}
          >
            ⭐
          </button>
          <button 
            onClick={() => handleStatusChange('answered')}
            className={`control-btn answered ${question.status === 'answered' ? 'active' : ''} ${isDeleted ? 'disabled' : ''}`}
            title={isDeleted ? 'Cannot modify deleted question' : 'Mark as answered'}
            disabled={isDeleted}
          >
            ✅
          </button>
        </div>
      </div>
    </div>
  );
};

export default TAStickyNote;