import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/useAuth.tsx';
import { useAxios } from '@/useAxios.tsx';
import { AccountDto, SocialAuthProviderName } from '@/types.ts';
import { OAUTH_INTENT_PREFIX } from '@/SocialCallbackPage/SocialCallbackPage.tsx';
import { translateSocialAuthError } from '@/SocialCallbackPage/socialAuthErrors.ts';
import googleIcon from '@/assets/GoogleIcon.svg';
import naverIcon from '@/assets/NaverIconGreen.svg';
import kakaoIcon from '@/assets/KakaoIcon.svg';
import styles from './AccountPage.module.css';

interface SocialAuthUrlResponse {
  url: string;
  state: string;
}

const PROVIDERS = [
  { name: SocialAuthProviderName.GOOGLE, label: 'Google', icon: googleIcon },
  { name: SocialAuthProviderName.NAVER, label: '네이버', icon: naverIcon, iconClassName: styles.providerIconNaver },
  { name: SocialAuthProviderName.KAKAO, label: '카카오', icon: kakaoIcon },
];

const AccountPage = () => {
  const { user, reloadUser } = useAuth();
  const api = useAxios();
  const navigate = useNavigate();

  const [accountData, setAccountData] = useState<AccountDto | null>(null);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameMessage, setNameMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [socialMessage, setSocialMessage] = useState<{ text: string; error: boolean } | null>(null);

  const fetchAccountData = async () => {
    if (!user) {
      return;
    }
    try {
      const res = await api.get<AccountDto>(`/users/${user.id}`);
      setAccountData(res.data);
    } catch {
      // leave accountData null; page will show empty state
    }
  };

  useEffect(() => {
    (async () => {
      await fetchAccountData();
    })();
  }, []);

  const handleEditName = () => {
    setNameInput(user?.name ?? '');
    setNameMessage(null);
    setEditingName(true);
  };

  const handleSaveName = async () => {
    if (!user) {
      return;
    }
    setNameMessage(null);
    try {
      await api.patch(`/users/${user.id}`, { name: nameInput });
      await reloadUser();
      setEditingName(false);
      setNameMessage({ text: '별명이 변경되었습니다.', error: false });
    } catch {
      setNameMessage({ text: '별명 변경에 실패했습니다.', error: true });
    }
  };

  const handleConnect = async (provider: SocialAuthProviderName) => {
    setSocialMessage(null);
    try {
      const res = await api.get<SocialAuthUrlResponse>(`/auth/social/${provider.toLowerCase()}/url`);
      sessionStorage.setItem(OAUTH_INTENT_PREFIX + res.data.state, 'connect');
      window.location.href = res.data.url;
    } catch {
      setSocialMessage({ text: '연결을 시작할 수 없습니다.', error: true });
    }
  };

  const handleDisconnect = async (provider: SocialAuthProviderName) => {
    setSocialMessage(null);
    try {
      await api.delete(`/auth/social/${provider.toLowerCase()}`);
      setSocialMessage({ text: '연결이 해제되었습니다.', error: false });
      await fetchAccountData();
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSocialMessage({
        text: msg ? translateSocialAuthError(msg) : '연결 해제에 실패했습니다.',
        error: true,
      });
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h2 className={styles.title}>계정</h2>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>기본 정보</h3>

          <div className={styles.field}>
            <span className={styles.label}>이름</span>
            {editingName ? (
              <div className={styles.inlineEdit}>
                <input
                  name={'name-input'}
                  className={styles.input}
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  autoFocus
                />
                <button className={styles.btnPrimary} onClick={handleSaveName}>저장</button>
                <button className={styles.btnSecondary} onClick={() => setEditingName(false)}>취소</button>
              </div>
            ) : (
              <div className={styles.fieldValue}>
                <span className={styles.fieldText}>{user?.name}</span>
                <button className={styles.btnSecondary} onClick={handleEditName}>수정</button>
              </div>
            )}
          </div>
          {nameMessage && (
            <p className={nameMessage.error ? styles.error : styles.success}>{nameMessage.text}</p>
          )}

          <div className={styles.field}>
            <span className={styles.label}>이메일</span>
            <span className={styles.fieldText}>{accountData?.user.email}</span>
          </div>
        </section>

        {accountData?.user.hasPassword && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>보안</h3>
            <button
              className={styles.btnDanger}
              onClick={() => navigate('/account/change-password')}
            >
              비밀번호 변경
            </button>
          </section>
        )}

        {accountData && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>외부 계정 연결</h3>
            {PROVIDERS.map(({ name, label, icon, iconClassName }) => {
              const identity = accountData.identities.find(i => i.provider === name);
              return (
                <div key={name} className={styles.field}>
                  <span className={styles.label}>
                    <img src={icon} className={`${styles.providerIcon} ${iconClassName ?? ''}`} alt=""/>
                    {label}
                  </span>
                  <div className={styles.fieldValue}>
                    {identity && (
                      <span className={styles.fieldText}>{identity.providerEmail}</span>
                    )}
                    {identity ? (
                      <button className={styles.btnDanger} onClick={() => handleDisconnect(name)}>
                        연결 해제
                      </button>
                    ) : (
                      <button className={styles.btnSecondary} onClick={() => handleConnect(name)}>
                        연결
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {socialMessage && (
              <p className={socialMessage.error ? styles.error : styles.success}>{socialMessage.text}</p>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default AccountPage;
