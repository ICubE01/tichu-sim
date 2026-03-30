import React, {useState} from 'react';
import {useAuth} from './useAuth.tsx';
import {Link} from 'react-router-dom';
import './LoginPage.css';

const LoginPage = () => {
  const {login} = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, seterrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    seterrorMessage('');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password}),
      });

      if (response.ok) {
        const data = await response.json();
        login(data.token);
      } else {
        seterrorMessage('로그인에 실패했습니다.');
      }
    } catch (err) {
      seterrorMessage('서버와 통신 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>로그인</h2>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
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
          <div className="form-group">
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
          <button className="login-button" type="submit">로그인</button>
        </form>
        <div className="login-footer">
          계정이 없으신가요? <Link to="/signup">가입</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
