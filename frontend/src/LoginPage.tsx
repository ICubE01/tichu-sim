import { SubmitEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { JwtResponse } from "@/types.ts";
import { useAuth } from '@/useAuth.tsx';
import googleIcon from '@/assets/GoogleIcon.svg';
import naverIcon from '@/assets/NaverIconWhite.svg';
import kakaoIcon from '@/assets/KakaoIcon.svg';
import styles from './LoginPage.module.css';

interface SocialAuthUrlResponse {
  url: string;
  state: string;
}

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      const response = await fetch('/api/auth/social/google/url');
      if (!response.ok) {
        setErrorMessage('Google 로그인을 시작할 수 없습니다.');
        return;
      }
      const data = await response.json() as SocialAuthUrlResponse;
      window.location.href = data.url;
    } catch {
      setErrorMessage('서버와 통신 중 오류가 발생했습니다.');
    }
  };

  const handleNaverLogin = async () => {
    try {
      const response = await fetch('/api/auth/social/naver/url');
      if (!response.ok) {
        setErrorMessage('Naver 로그인을 시작할 수 없습니다.');
        return;
      }
      const data = await response.json() as SocialAuthUrlResponse;
      window.location.href = data.url;
    } catch {
      setErrorMessage('서버와 통신 중 오류가 발생했습니다.');
    }
  };

  const handleKakaoLogin = async () => {
    try {
      const response = await fetch('/api/auth/social/kakao/url');
      if (!response.ok) {
        setErrorMessage('Kakao 로그인을 시작할 수 없습니다.');
        return;
      }
      const data = await response.json() as SocialAuthUrlResponse;
      window.location.href = data.url;
    } catch {
      setErrorMessage('서버와 통신 중 오류가 발생했습니다.');
    }
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json() as JwtResponse;
        await login(data.token);
        navigate(from, { replace: true });
      } else {
        setErrorMessage('로그인에 실패했습니다.');
      }
    } catch (err) {
      setErrorMessage('서버와 통신 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <h2>로그인</h2>
        {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}
        <button className={styles.googleButton} type="button" onClick={handleGoogleLogin}>
          <img src={googleIcon} className={styles.googleIcon} alt=""/>
          Google로 로그인
        </button>
        <button className={styles.naverButton} type="button" onClick={handleNaverLogin}>
          <img src={naverIcon} className={styles.naverIcon} alt=""/>
          네이버로 로그인
        </button>
        <button className={styles.kakaoButton} type="button" onClick={handleKakaoLogin}>
          <img src={kakaoIcon} className={styles.kakaoIcon} alt=""/>
          카카오로 로그인
        </button>
        {showEmailForm ? (
          <>
            <div className={styles.divider}><span>이메일로 로그인</span></div>
            <form className={styles.loginForm} onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="email">이메일</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=""
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="password">비밀번호</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=""
                  required
                />
              </div>
              <button className={styles.loginButton} type="submit">로그인</button>
            </form>
            <div className={styles.loginFooter}>
              계정이 없으신가요? <Link to="/signup">가입</Link>
            </div>
          </>
        ) : (
          <button type="button" className={styles.emailToggle} onClick={() => setShowEmailForm(true)}>
            이메일로 로그인
          </button>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
