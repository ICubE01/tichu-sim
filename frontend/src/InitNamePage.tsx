import { SubmitEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/useAuth.tsx';
import { useAxios } from '@/useAxios.tsx';
import styles from './InitNamePage.module.css';

export const ALLOW_INIT_NAME_PAGE_KEY = 'allowInitNamePage';

const InitNamePage = () => {
  const { user, reloadUser } = useAuth();
  const navigate = useNavigate();
  const api = useAxios();
  const [name, setName] = useState(user?.name ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (hasCheckedRef.current) {
      return;
    }
    hasCheckedRef.current = true;

    const keyExists = sessionStorage.getItem(ALLOW_INIT_NAME_PAGE_KEY) !== null;
    sessionStorage.removeItem(ALLOW_INIT_NAME_PAGE_KEY);
    setAllowed(keyExists);
    if (!keyExists) {
      navigate('/', { replace: true });
    }
  }, []);

  if (!user || allowed !== true) {
    return null;
  }

  const handleComplete = () => navigate('/', { replace: true });

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/users/${user.id}`, { name });
      await reloadUser();
    } finally {
      setSubmitting(false);
    }
    handleComplete();
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>이름 설정</h2>
        <p className={styles.description}>사용할 이름을 설정해 주세요.</p>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="name">이름</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={submitting} className={styles.submitButton}>
            확인
          </button>
          <button type="button" onClick={handleComplete} disabled={submitting} className={styles.skipButton}>
            건너뛰기
          </button>
        </form>
      </div>
    </div>
  );
};

export default InitNamePage;
