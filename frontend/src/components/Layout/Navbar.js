import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="nav-container">
        <h1 className="nav-title">VidyaVichar</h1>
        <div className="nav-right">
          <span className="nav-user">
            {user?.name} ({user?.role})
          </span>
          <button onClick={logout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;  
