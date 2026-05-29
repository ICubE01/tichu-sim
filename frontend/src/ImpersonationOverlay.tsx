import { useAuth } from '@/useAuth.tsx';
import styles from './ImpersonationOverlay.module.css';

const ImpersonationOverlay = () => {
  const { impersonating, refresh } = useAuth();
  if (!impersonating) return null;
  return (
    <div className={styles.overlay}>
      <span>Impersonating: {impersonating}</span>
      <button className={styles.stopBtn} onClick={refresh}>Stop</button>
    </div>
  );
};

export default ImpersonationOverlay;
