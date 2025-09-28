import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const ClassSelector = ({ onClassSelected, selectedClassId }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async (searchQuery = '') => {
    try {
      setLoading(true);
      setError('');
      
      const url = searchQuery 
        ? `/api/classes?search=${encodeURIComponent(searchQuery.trim())}`
        : '/api/classes';
        
      const response = await api.get(url);
      setClasses(response.data || []);
    } catch (err) {
      console.error('Error fetching classes:', err);
      
      // Handle different error types
      if (err.response?.status === 401) {
        setError('Please login again to view classes');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view classes');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Failed to load classes. Please try again.');
      }
      
      setClasses([]);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const handleSearch = async () => {
    if (searching) return;
    
    setSearching(true);
    await fetchClasses(searchTerm);
  };

  const handleClearSearch = async () => {
    if (searching) return;
    
    setSearchTerm('');
    setSearching(true);
    await fetchClasses('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleClassClick = (classData) => {
    if (!classData || !classData._id) {
      setError('Invalid class data');
      return;
    }
    
    try {
      onClassSelected(classData);
    } catch (err) {
      console.error('Error selecting class:', err);
      setError('Failed to select class. Please try again.');
    }
  };

  const handleRefresh = () => {
    fetchClasses(searchTerm);
  };

  if (loading && classes.length === 0) {
    return (
      <div className="class-selector-container">
        <div className="loading">Loading classes...</div>
      </div>
    );
  }

  return (
    <div className="class-selector-container">
      <div className="class-selector-header">
        <h3>Select a Class</h3>
        <p>Choose any class to join the doubt session</p>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search classes by name, subject, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading || searching}
          />
          <button 
            onClick={handleSearch} 
            className="btn btn-secondary"
            disabled={loading || searching}
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
          {searchTerm && (
            <button 
              onClick={handleClearSearch}
              className="btn btn-secondary"
              disabled={loading || searching}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="error">
          {error}
          <button 
            onClick={handleRefresh}
            className="btn btn-secondary"
            style={{ marginLeft: '1rem' }}
          >
            Retry
          </button>
        </div>
      )}

      <div className="classes-grid">
        {loading && classes.length === 0 ? (
          <div className="loading" style={{ gridColumn: '1 / -1' }}>
            Loading classes...
          </div>
        ) : classes.length === 0 ? (
          <div className="no-classes">
            <h4>No classes found</h4>
            <p>
              {searchTerm 
                ? 'Try a different search term or check with your teacher.'
                : 'No classes are available yet. Ask your teacher to create a class.'}
            </p>
            {searchTerm && (
              <button 
                onClick={handleClearSearch}
                className="btn btn-primary"
                disabled={searching}
              >
                Show All Classes
              </button>
            )}
            <button 
              onClick={handleRefresh}
              className="btn btn-secondary"
              style={{ marginTop: '1rem' }}
              disabled={loading}
            >
              Refresh
            </button>
          </div>
        ) : (
          classes.map(classData => (
            <div
              key={classData._id}
              className={`class-card ${selectedClassId === classData._id ? 'selected' : ''}`}
              onClick={() => handleClassClick(classData)}
              style={{ cursor: 'pointer' }}
            >
              <div className="class-card-header">
                <h4>{classData.name}</h4>
                <span className="subject-tag">{classData.subject}</span>
              </div>
              
              <div className="class-card-content">
                <p>{classData.description}</p>
              </div>
              
              <div className="class-card-footer">
                <div className="class-stats">
                  <span className="stat">
                    Pending: {classData.pendingQuestions || 0}
                  </span>
                  <span className="stat">
                    Total: {classData.totalQuestions || 0}
                  </span>
                </div>
                <div className="class-creator">
                  <small>Created by: {classData.createdByName || 'Unknown'}</small>
                  <small>
                    {classData.createdAt 
                      ? new Date(classData.createdAt).toLocaleDateString()
                      : 'Unknown date'
                    }
                  </small>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {classes.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button 
            onClick={handleRefresh}
            className="btn btn-secondary"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Classes'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ClassSelector;