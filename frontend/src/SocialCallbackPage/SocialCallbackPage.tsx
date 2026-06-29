import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/useAuth.tsx';
import styles from './SocialCallbackPage.module.css';
import { JwtResponse, ErrorDto, SocialAuthProviderName } from '@/types.ts';
import { translateSocialAuthError } from '@/SocialCallbackPage/socialAuthErrors.ts';
import { ALLOW_INIT_NAME_PAGE_KEY } from '@/InitNamePage.tsx';

export const OAUTH_INTENT_PREFIX = 'oauth_intent_';

interface Props {
  provider: SocialAuthProviderName;
}

const SocialCallbackPage = ({ provider }: Props) => {
  const { login, refresh } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const providerLower = provider.toLowerCase();
  const providerDisplayName = provider.charAt(0) + provider.slice(1).toLowerCase();

  const initState = searchParams.get('state');
  const isConnectRef = useRef(
    initState !== null && sessionStorage.getItem(OAUTH_INTENT_PREFIX + initState) === 'connect'
  );
  const isConnect = isConnectRef.current;

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

    sessionStorage.removeItem(OAUTH_INTENT_PREFIX + state);

    if (isConnect) {
      (async () => {
        const fallback = `${providerDisplayName} 연결에 실패했습니다.`;
        try {
          // Always refresh first so the connect request carries a fresh access token,
          // even if the user lingered on the provider's consent screen.
          const token = await refresh();
          if (!token) {
            setErrorMessage(fallback);
            return;
          }

          const response = await fetch(`/api/auth/social/${providerLower}/connect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ code, state }),
          });

          if (!response.ok) {
            try {
              const error = await response.json() as Partial<ErrorDto>;
              setErrorMessage(translateSocialAuthError(error.message ?? fallback));
            } catch {
              setErrorMessage(fallback);
            }
            return;
          }

          navigate('/account', { replace: true });
        } catch {
          setErrorMessage('서버와 통신 중 오류가 발생했습니다.');
        }
      })();
      return;
    }

    (async () => {
      try {
        const response = await fetch(`/api/auth/social/${providerLower}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state }),
        });

        if (!response.ok) {
          const fallback = `${providerDisplayName} 로그인에 실패했습니다.`;
          try {
            const error = await response.json() as Partial<ErrorDto>;
            setErrorMessage(translateSocialAuthError(error.message ?? fallback));
          } catch {
            setErrorMessage(fallback);
          }
          return;
        }

        const { token } = await response.json() as JwtResponse;
        const isNewUser = response.status === 201;
        await login(token);
        if (isNewUser) {
          sessionStorage.setItem(ALLOW_INIT_NAME_PAGE_KEY, '1');
        }
        navigate(isNewUser ? '/init-name' : '/', { replace: true });
      } catch {
        setErrorMessage('서버와 통신 중 오류가 발생했습니다.');
      }
    })();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {errorMessage ? (
          <>
            <p className={styles.errorMessage}>{errorMessage}</p>
            <Link to={isConnect ? '/account' : '/'} className={styles.backLink}>
              {isConnect ? '계정 페이지로 돌아가기' : '로그인 페이지로 돌아가기'}
            </Link>
          </>
        ) : (
          <p className={styles.loadingText}>{isConnect ? '연결 중...' : '로그인 중...'}</p>
        )}
      </div>
    </div>
  );
};

export default SocialCallbackPage;
