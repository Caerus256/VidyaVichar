import React from 'react';

const StudentStickyNote = ({ question, isDeleted }) => {
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
      </div>
      
      <div className="sticky-content">
        <p>{question.text}</p>   
      </div>
      
      <div className="sticky-footer">
        <small className="time">{new Date(question.createdAt).toLocaleTimeString()}</small>
      </div>
    </div>
  );
};

export default StudentStickyNote;