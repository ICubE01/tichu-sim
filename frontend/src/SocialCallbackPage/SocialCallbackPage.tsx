import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '@/useAuth.tsx';
import styles from './SocialCallbackPage.module.css';
import { JwtResponse, ErrorDto, SocialAuthProviderName } from '@/types.ts';
import { translateSocialAuthError } from '@/SocialCallbackPage/socialAuthErrors.ts';
import { ALLOW_INIT_NAME_PAGE_KEY } from '@/InitNamePage.tsx';

export const OAUTH_INTENT_PREFIX = 'oauth_intent_';

const resolveResponseError = async (response: Response, fallback: string): Promise<string> => {
  try {
    const error = await response.json() as Partial<ErrorDto>;
    return translateSocialAuthError(error.message ?? fallback);
  } catch {
    return fallback;
  }
};

interface Props {
  provider: SocialAuthProviderName;
}

const SocialCallbackPage = ({ provider }: Props) => {
  const { login, refresh } = useAuth();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const [isConnect] = useState(() =>
    state !== null && sessionStorage.getItem(OAUTH_INTENT_PREFIX + state) === 'connect'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(code && state ? null : '잘못된 접근입니다.');

  const hasFetchedRef = useRef(false);

  const providerLower = provider.toLowerCase();
  const providerDisplayName = provider.charAt(0) + provider.slice(1).toLowerCase();

  useEffect(() => {
    if (!code || !state) {
      return;
    }

    if (hasFetchedRef.current) {
      return;
    }
    hasFetchedRef.current = true;

    sessionStorage.removeItem(OAUTH_INTENT_PREFIX + state);

    (async () => {
      try {
        if (isConnect) {
          const fallback = `${providerDisplayName} 연결에 실패했습니다.`;

          // Always refresh first, so the connection request carries a fresh access token,
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
            setErrorMessage(await resolveResponseError(response, fallback));
            return;
          }

          navigate('/account', { replace: true });
        } else {
          const response = await fetch(`/api/auth/social/${providerLower}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, state }),
          });

          if (!response.ok) {
            const fallback = `${providerDisplayName} 로그인에 실패했습니다.`;
            setErrorMessage(await resolveResponseError(response, fallback));
            return;
          }

          const { token } = await response.json() as JwtResponse;
          const isNewUser = response.status === 201;
          await login(token);
          if (isNewUser) {
            sessionStorage.setItem(ALLOW_INIT_NAME_PAGE_KEY, '1');
          }
          navigate(isNewUser ? '/init-name' : '/', { replace: true });
        }
      } catch {
        setErrorMessage('서버와 통신 중 오류가 발생했습니다.');
      }
    })();
  }, [code, state, isConnect, login, navigate, providerDisplayName, providerLower, refresh]);

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
