import { useState, useEffect, SubmitEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/useAuth.tsx';
import { useAxios } from '@/useAxios.tsx';
import { AccountDto } from '@/types.ts';
import styles from './ChangePasswordPage.module.css';

const ChangePasswordPage = () => {
  const { user } = useAuth();
  const api = useAxios();
  const navigate = useNavigate();

  const [ready, setReady] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }
    (async () => {
      try {
        const res = await api.get<AccountDto>(`/users/${user.id}`);
        if (!res.data.user.hasPassword) {
          navigate('/account', { replace: true });
          return;
        }
        setReady(true);
      } catch {
        navigate('/account', { replace: true });
      }
    })();
  }, []);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      return;
    }
    setMessage(null);

    if (!currentPassword) {
      setMessage({ text: '현재 비밀번호를 입력해 주세요.', error: true });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ text: '새 비밀번호가 일치하지 않습니다.', error: true });
      return;
    }

    setSubmitting(true);
    try {
      await api.patch(`/users/${user.id}/password`, { currentPassword, newPassword });
      navigate('/account');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 406) {
        setMessage({ text: '현재 비밀번호가 올바르지 않습니다.', error: true });
      } else {
        setMessage({ text: '비밀번호 변경에 실패했습니다.', error: true });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) {
    return null;
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h2 className={styles.title}>비밀번호 변경</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>현재 비밀번호</label>
            <input
              className={styles.input}
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>새 비밀번호 (8자 이상)</label>
            <input
              className={styles.input}
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>새 비밀번호 확인</label>
            <input
              className={styles.input}
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {message && (
            <p className={message.error ? styles.error : styles.success}>{message.text}</p>
          )}
          <div className={styles.actions}>
            <button className={styles.btnPrimary} type="submit" disabled={submitting}>
              변경
            </button>
            <button
              className={styles.btnSecondary}
              type="button"
              onClick={() => navigate('/account')}
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
