import { useState } from 'react';
import { useAuth } from './useAuth.tsx';
import styles from './NavBar.module.css';

const NavBar = () => {
  const { user, logout } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  return (
    <>
      <nav className={styles.navbarContainer}>
        <div className={`${styles.navbarContent} content`}>
          <div className={styles.navLeft}>
            <span
              className={styles.settingsBtn}
              onClick={() => setShowSettings(!showSettings)}
              title="Settings"
            >
              ⚙️
            </span>
          </div>

          <div className={styles.navRight}>
            <span
              className={styles.userName}
              onClick={() => setShowLogout(!showLogout)}
            >
              {user?.name || 'User'}
            </span>
            {showLogout && (
              <button
                className={styles.logoutBtn}
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
        <div className={styles.settingsPopup}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Settings</strong>
            <span style={{ cursor: 'pointer' }} onClick={() => setShowSettings(false)}>X</span>
          </div>
          <hr/>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>TODO</p>
        </div>
      )}
    </>
  );
};

export default NavBar;
