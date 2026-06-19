import { useEffect, useRef, useState } from 'react';
import { Link, useMatch } from 'react-router-dom';
import { useAuth } from '@/useAuth.tsx';
import styles from './NavBar.module.css';

const NavBar = () => {
  const { user, logout } = useAuth();
  const roomMatch = useMatch('/rooms/:roomId');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) {
      return;
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  return (
    <nav className={styles.navbarContainer}>
      <div className={`${styles.navbarContent} content`}>
        <div className={styles.navLeft}>
          <Link to={roomMatch ? `/rooms/${roomMatch.params.roomId}` : '/'} className={styles.homeLink}>Tichu Sim</Link>
        </div>
        <div className={styles.navRight} ref={dropdownRef}>
          <div
            className={styles.userName}
            onClick={() => setDropdownOpen(prev => !prev)}
          >
            {user?.name || 'USERNAME'}
          </div>
          {dropdownOpen && (
            <div className={styles.dropdown}>
              <Link
                to="/account"
                className={styles.dropdownItem}
                onClick={() => setDropdownOpen(false)}
              >
                계정
              </Link>
              <button
                className={`${styles.dropdownItem} ${styles.logoutItem}`}
                onClick={async () => { setDropdownOpen(false); await logout(); }}
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
