import { SubmitEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './SignupPage.module.css';

const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        const data = await response.json();
        if (data.message === 'The email is already registered.') {
          setErrorMessage("이미 사용 중인 이메일입니다.")
        } else {
          setErrorMessage("가입에 실패했습니다.")
        }
      }
    } catch (err) {
      setErrorMessage('서버와 통신 중 오류가 발생했습니다.');
    }
  };

  if (success) {
    return (
      <div className={styles.signupContainer}>
        <div className={styles.signupCard}>
          <h2>가입 완료</h2>
          <div className={styles.successMessage}>
            가입이 성공적으로 완료되었습니다!
          </div>
          <div className={styles.signupFooter}>
            <Link to="/">로그인 페이지로 이동</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.signupContainer}>
      <div className={styles.signupCard}>
        <h2>가입</h2>
        {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}
        <form className={styles.signupForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="name">별명</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder=""
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="email">이메일</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password">비밀번호 (8자 이상)</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=""
              minLength={8}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">비밀번호 확인</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder=""
              required
            />
          </div>
          <button className={styles.signupButton} type="submit">회원가입</button>
        </form>
        <div className={styles.signupFooter}>
          이미 계정이 있으신가요? <Link to="/">로그인</Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
