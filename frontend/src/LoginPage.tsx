import { SubmitEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { JwtResponse } from "@/types.ts";
import { useAuth } from '@/useAuth.tsx';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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
      </div>
    </div>
  );
};

export default LoginPage;
