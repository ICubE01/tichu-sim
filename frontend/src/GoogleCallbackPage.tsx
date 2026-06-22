import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/useAuth.tsx';
import styles from './GoogleCallbackPage.module.css';
import { JwtResponse, ErrorDto } from "@/types.ts";
import { ALLOW_INIT_NAME_PAGE_KEY } from '@/InitNamePage.tsx';

const GoogleCallbackPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      setErrorMessage('잘못된 접근입니다.');
      return;
    }

    if (hasFetchedRef.current) {
      return;
    }
    hasFetchedRef.current = true;

    (async () => {
      let token: string;
      let isNewUser: boolean;
      try {
        const response = await fetch('/api/auth/social/google/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state }),
        });

        if (!response.ok) {
          try {
            const error = await response.json() as Partial<ErrorDto>;
            setErrorMessage(error.message ?? 'Google 로그인에 실패했습니다.');
          } catch {
            setErrorMessage('Google 로그인에 실패했습니다.');
          }
          return;
        }

        ({ token } = await response.json() as JwtResponse);
        isNewUser = response.status === 201;
      } catch {
        setErrorMessage('서버와 통신 중 오류가 발생했습니다.');
        return;
      }

      await login(token);
      if (isNewUser) {
        sessionStorage.setItem(ALLOW_INIT_NAME_PAGE_KEY, '1');
      }
      navigate(isNewUser ? '/init-name' : '/', { replace: true });
    })();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {errorMessage ? (
          <>
            <p className={styles.errorMessage}>{errorMessage}</p>
            <Link to="/" className={styles.backLink}>로그인 페이지로 돌아가기</Link>
          </>
        ) : (
          <p className={styles.loadingText}>로그인 중...</p>
        )}
      </div>
    </div>
  );
};

export default GoogleCallbackPage;
