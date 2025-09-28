import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Layout/Navbar';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import StudentDashboard from './components/Dashboard/StudentDashboard';
import TeacherDashboard from './components/Dashboard/TeacherDashboard';
import TADashboard from './components/Dashboard/TADashboard';
import ClassSelector from './components/Classes/ClassSelector';
import ClassCreationForm from './components/Classes/ClassCreationForm';
import api from './services/api';

function App() {
  const { user, loading } = useAuth();
  const [selectedClass, setSelectedClass] = useState(null);
  const [showClassCreation, setShowClassCreation] = useState(false);
  const [loadingClass, setLoadingClass] = useState(false);

  useEffect(() => {
    if (user) {
      const savedClassId = localStorage.getItem('selectedClassId');
      if (savedClassId) {
        loadSavedClass(savedClassId);
      }
    } else {
      setSelectedClass(null);
      localStorage.removeItem('selectedClassId');
    }
  }, [user]);

  const loadSavedClass = async (classId) => {
    try {
      setLoadingClass(true);
      const response = await api.get(`/api/classes/${classId}`);
      setSelectedClass(response.data);
    } catch (error) {
      console.error('Error loading saved class:', error);
      localStorage.removeItem('selectedClassId');
      setSelectedClass(null);
    } finally {
      setLoadingClass(false);
    }
  };

  const handleClassSelected = (classData) => {
    setSelectedClass(classData);
    localStorage.setItem('selectedClassId', classData._id);
  };

  const handleClassCreated = (newClass) => {
    setShowClassCreation(false);
    handleClassSelected(newClass);
  };

  const handleBackToClasses = () => {
    setSelectedClass(null);
    localStorage.removeItem('selectedClassId');
  };

  const renderDashboard = () => {
    if (!selectedClass) {
      return (
        <div>
            <div className="class-actions">
              {user?.role === 'teacher' && (
                <button 
                  onClick={() => setShowClassCreation(true)}
                  className="btn btn-primary"
                >
                  + Create Class
                </button>
              )}
          </div>

          <ClassSelector 
            onClassSelected={handleClassSelected}
            selectedClassId={selectedClass?._id}
          />

          {showClassCreation && (
            <ClassCreationForm
              onClassCreated={handleClassCreated}
              onCancel={() => setShowClassCreation(false)}
            />
          )}
        </div>
      );
    }

    // If class is selected, show appropriate dashboard with class management bar
    return (
      <div>
          <div className="class-actions">
            <button 
              onClick={handleBackToClasses}
              className="btn btn-secondary"
            >
              ← Switch Class
            </button>
            {user?.role === 'teacher' && (
              <button 
                onClick={() => setShowClassCreation(true)}
                className="btn btn-primary"
              >
                + Create Class
              </button>
            )}
        </div>

        {user.role === 'student' && <StudentDashboard selectedClass={selectedClass} />}
        {user.role === 'TA' && <TADashboard selectedClass={selectedClass} />}
        {user.role === 'teacher' && <TeacherDashboard selectedClass={selectedClass} />}

        {showClassCreation && (
          <ClassCreationForm
            onClassCreated={handleClassCreated}
            onCancel={() => setShowClassCreation(false)}
          />
        )}
      </div>
    );
  };

  if (loading || loadingClass) return <div className="loading">Loading...</div>;

  return (
    <div className="App">
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
        <Route
          path="/dashboard"
          element={
            user ? renderDashboard() : <Navigate to="/login" />
          }          
        />
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </div>
  );
}

export default App;
