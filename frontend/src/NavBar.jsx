import React, {useState} from 'react';
import {useAuth} from './useAuth.jsx';
import './NavBar.css';

const NavBar = () => {
  const {user, logout} = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  return (
    <>
      <nav className="navbar-container">
        <div className="navbar-content content">
          <div className="nav-left">
            <span
              className="settings-btn"
              onClick={() => setShowSettings(!showSettings)}
              title="Settings"
            >
              ⚙️
            </span>
          </div>

          <div className="nav-right">
            <span
              className="user-name"
              onClick={() => setShowLogout(!showLogout)}
            >
              {user?.name || 'User'}
            </span>
            {showLogout && (
              <button
                className="logout-btn"
                onClick={logout}
                title="Logout"
              >
                🚪
              </button>
            )}
          </div>
        </div>
      </nav>

      {showSettings && (
        <div className="settings-popup">
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <strong>Settings</strong>
            <span style={{cursor: 'pointer'}} onClick={() => setShowSettings(false)}>X</span>
          </div>
          <hr/>
          <p style={{fontSize: '0.9rem', color: '#666'}}>TODO</p>
        </div>
      )}
    </>
  );
};

export default NavBar;
