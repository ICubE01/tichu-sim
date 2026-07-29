import { KeyboardEventHandler, useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChatMessage, JwtResponse, MemberDto, MemberMessage, RoomDto } from "@/types.ts";
import { useAuth } from '@/useAuth.tsx';
import { useAxios } from "@/useAxios.tsx";
import { useRoom } from "@/useRoom.tsx";
import { useStomp } from "@/useStomp.tsx"
import { GameMessage, GameName, GameRule } from "@/games/types.ts";
import TichuPage from "@/games/tichu/TichuPage.tsx";
import { Team } from "@/games/tichu/domain/Team.ts";
import { TichuRule, TichuWinningScore } from "@/games/tichu/domain/TichuRule.ts";
import HanabiPage from "@/games/hanabi/HanabiPage.tsx";
import { HanabiRule, RainbowMode } from "@/games/hanabi/domain/HanabiRule.ts";
import styles from './RoomDetailPage.module.css';

const gameSlugOf = (gameName: GameName) => {
  switch (gameName) {
    case GameName.TICHU:
      return 'tichu';
    case GameName.HANABI:
      return 'hanabi';
  }
};

const RoomDetailPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const roomApi = useRoom();
  const [room, setRoom] = useState<RoomDto | null>(null);
  const [loading, setLoading] = useState(true);
  const { stomp } = useStomp();
  const api = useAxios();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');

  if (!roomId) {
    navigate('/');
    return;
  }

  const leaveRoom = async () => {
    try {
      await roomApi.leaveRoom(roomId);
      navigate('/');
    } catch (error) {
      console.error('Failed to leave room:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      let myRoom;
      try {
        myRoom = await roomApi.fetchMyRoom();
      } catch (error) {
        console.error('Failed to fetch my room:', error);
        return;
      }
      if (myRoom === null) {
        try {
          await roomApi.enterRoom(roomId);
        } catch (error) {
          console.error('Failed to enter room:', error);
          navigate('/');
          return;
        }
      } else if (String(myRoom.id) !== String(roomId)) {
        alert('You are already in another room. Please leave the current room first.');
        navigate(`/rooms/${myRoom.id}`);
        return;
      }

      try {
        setRoom(await roomApi.fetchRoom(roomId));
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch room detail:', error);
      }
    };

    init().then();
  }, [roomId]);

  const handleMemberChange = useCallback((memberMessage: MemberMessage) => {
    setRoom((prevRoom) => {
      if (!prevRoom) {
        return prevRoom;
      }
      return { ...prevRoom, members: memberMessage.members };
    });
  }, []);

  const handleReceiveChatMessage = useCallback((chatMessage: ChatMessage) => {
    setChatMessages((prev) => [...prev, chatMessage]);
  }, []);

  const sendChatMessage = () => {
    if (chatInput.trim() === '') {
      return;
    }

    stomp.publish(`/app/rooms/${roomId}/chat`, {
      message: chatInput
    });

    setChatInput('');
  };

  const chatInputKeyDown: KeyboardEventHandler = (e) => {
    if (e.key === 'Enter') {
      sendChatMessage();
    }
  };

  useEffect(() => {
    if (!user || !room) {
      return;
    }

    const gameSlug = gameSlugOf(room.gameName);

    const handleGameMessage = (message: GameMessage) => {
      if (message.type === 'START') {
        setRoom(prev => ({
          ...prev!,
          hasGameStarted: true,
        }));
      } else if (message.type === 'SET_RULE') {
        setRoom(prev => ({
          ...prev!,
          gameRule: message.data as GameRule,
        }));
      }
    };

    const handleError = (error: Error) => {
      alert(`Error: ${error.message || 'Unknown error'}`);
    };

    stomp.subscribe(`/topic/rooms/${roomId}/members`, handleMemberChange);
    stomp.subscribe(`/topic/rooms/${roomId}/chat`, handleReceiveChatMessage);
    stomp.subscribe(`/user/${user.id}/queue/game/${gameSlug}`, handleGameMessage);
    stomp.subscribe(`/user/${user.id}/queue/errors`, handleError);

    stomp.connect(() =>
      api.get<JwtResponse>('/auth/issue/web-socket-token')
        .then(response => response.data.token)
    );

    return () => {
      stomp.unsubscribe(`/topic/rooms/${roomId}/members`, handleMemberChange);
      stomp.unsubscribe(`/topic/rooms/${roomId}/chat`, handleReceiveChatMessage);
      stomp.unsubscribe(`/user/${user.id}/queue/game/${gameSlug}`, handleGameMessage);
      stomp.unsubscribe(`/user/${user.id}/queue/errors`, handleError);
      stomp.disconnect();
    };
  }, [roomId, room == null, user, handleMemberChange, handleReceiveChatMessage]);

  const startGame = () => {
    if (!room) {
      return;
    }
    stomp.publish(`/app/rooms/${roomId}/game/${gameSlugOf(room.gameName)}/start`, {});
  }

  const toggleReady = () => {
    const isReadyNow = room?.members.find(m => m.id === user?.id)?.isReady ?? false;
    stomp.publish(`/app/rooms/${roomId}/set-ready`, { ready: !isReadyNow });
  };

  const setRule = (newRule: GameRule) => {
    if (!room) {
      return;
    }
    stomp.publish(`/app/rooms/${roomId}/game/${gameSlugOf(room.gameName)}/set-rule`, newRule);
  };

  const changeWinningScore = (score: TichuWinningScore) => {
    const newRule = {
      ...room!.gameRule,
      winningScore: score
    };
    setRule(newRule);
  };

  const changeTeam = (member: MemberDto, team: Team) => {
    const newRule = {
      ...room!.gameRule,
      teamAssignment: {
        ...(room!.gameRule as TichuRule).teamAssignment,
        [member.id]: team
      }
    };
    setRule(newRule);
  };

  const changeHanabiRule = (patch: Partial<HanabiRule>) => {
    setRule({ ...(room!.gameRule as HanabiRule), ...patch });
  };

  if (loading || room === null) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  if (room.hasGameStarted) {
    const onGameEnd = () => {
      setRoom(prev => ({
        ...prev!,
        hasGameStarted: false,
      }));
    };

    switch (room.gameName) {
      case GameName.TICHU:
        return <TichuPage roomId={room.id} stomp={stomp} chatMessages={chatMessages} onGameEnd={onGameEnd} />;
      case GameName.HANABI:
        return <HanabiPage roomId={room.id} stomp={stomp} chatMessages={chatMessages} onGameEnd={onGameEnd} />;
    }
  }

  const currentMember = room.members.find(m => m.id === user?.id);
  const isHost = currentMember?.isHost ?? false;
  const allNonHostsReady = room.members.filter(m => !m.isHost).every(m => m.isReady);
  const isPlayerCountValid = room.gameRule.minPlayers <= room.members.length
    && room.members.length <= room.gameRule.maxPlayers;
  const canStartGame = isHost && allNonHostsReady && isPlayerCountValid;

  const formatWinningScore = (winningScore: TichuWinningScore) => {
    switch (winningScore) {
      case 'ZERO':
        return '단판';
      case 'TWO_HUNDRED':
        return '200';
      case 'FIVE_HUNDRED':
        return '500';
      case 'ONE_THOUSAND':
        return '1000';
      default:
        return '';
    }
  }

  const isHanabi = room.gameName === GameName.HANABI;
  const hanabiRule = room.gameRule as HanabiRule;

  return (
    <div className={`${styles.roomDetailContainer} content`}>
      <div className={styles.roomDetailHeader}>
        <h2>[{room.id}] {room.name}</h2>
        <div className={styles.roomDetailHeaderButtons}>
          {isHost
            ? <button onClick={startGame} className={styles.gameStartButton} disabled={!canStartGame}>게임 시작</button>
            : <button onClick={toggleReady} className={styles.gameStartButton}>{currentMember?.isReady ? '준비 취소' : '준비'}</button>
          }
          <button onClick={leaveRoom} className={styles.leaveButton}>나가기</button>
        </div>
      </div>

      <div className={styles.roomContent}>
        <div className={styles.roomInfoSection}>
          <div className={styles.infoCard}>
            <h3>참가자 ({room.members?.length || 0} / {room.gameRule.maxPlayers})</h3>
            <ul className={styles.memberList}>
              {room.members?.map((member) => (
                <li key={member.id} className={styles.memberItem}>
                  {member.name}
                  {member.isHost && <span> ⭐</span>}
                  {!member.isHost && member.isReady && <span> ✅</span>}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.infoCard}>
            <h3>게임 설정</h3>
            {isHanabi ? (
              <div className={styles.ruleBox}>
                <div className={styles.ruleItem}>
                  <span>무지개 색 (Colour Avalanche)</span>
                  <input
                    type="checkbox"
                    disabled={!isHost}
                    checked={hanabiRule.isRainbowEnabled}
                    onChange={(e) => changeHanabiRule({ isRainbowEnabled: e.target.checked })}
                  />
                </div>
                {hanabiRule.isRainbowEnabled && (
                  <div className={styles.ruleItem}>
                    <span>무지개 모드</span>
                    <select
                      disabled={!isHost}
                      value={hanabiRule.rainbowMode}
                      onChange={(e) => changeHanabiRule({ rainbowMode: e.target.value as RainbowMode })}
                    >
                      <option value={RainbowMode.WILDCARD}>와일드카드 (모든 색 힌트, 공식)</option>
                      <option value={RainbowMode.SIXTH_LONG}>여섯 번째 색 (10장)</option>
                      <option value={RainbowMode.SIXTH_SHORT}>여섯 번째 색 (5장, 어려움)</option>
                    </select>
                  </div>
                )}
                <div className={styles.ruleItem}>
                  <span>흑색 화약 (Black Gunpowder)</span>
                  <input
                    type="checkbox"
                    disabled={!isHost}
                    checked={hanabiRule.isBlackEnabled}
                    onChange={(e) => changeHanabiRule({ isBlackEnabled: e.target.checked })}
                  />
                </div>
                <div className={styles.ruleItem}>
                  <span>화려한 불꽃놀이 (Flamboyant Fireworks)</span>
                  <input
                    type="checkbox"
                    disabled={!isHost}
                    checked={hanabiRule.isBonusEnabled}
                    onChange={(e) => changeHanabiRule({ isBonusEnabled: e.target.checked })}
                  />
                </div>
              </div>
            ) : (
              <div className={styles.ruleBox}>
                <div className={styles.ruleItem}>
                  <span>승리 점수</span>
                  <div className={styles.ruleButtonGroup}>
                    {[TichuWinningScore.ZERO, TichuWinningScore.TWO_HUNDRED, TichuWinningScore.FIVE_HUNDRED, TichuWinningScore.ONE_THOUSAND].map((score) => (
                      <button
                        key={score}
                        className={`${styles.ruleButton} ${!isHost ? styles.ruleButtonReadonly : ''} ${(room.gameRule as TichuRule).winningScore === score ? styles.active : ''}`}
                        onClick={() => changeWinningScore(score)}
                      >
                        {formatWinningScore(score) || score}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.ruleItem}>
                  <span>팀 선택</span>
                  <div className={styles.ruleItemBox}>
                    {room.members.map((member) => {
                      const assignedTeam = (room.gameRule as TichuRule).teamAssignment[member.id] ?? Team.NONE;
                      return (
                        <div key={`team-assignment-${member.id}`} className={styles.ruleItem}>
                          <span>{member.name}</span>
                          <div className={styles.ruleButtonGroup}>
                            {[Team.RED, Team.NONE, Team.BLUE].map((team) => (
                              <button
                                key={`team-assignment-${member.id}-${team.toLowerCase()}`}
                                className={`${styles.ruleButton} ${!isHost ? styles.ruleButtonReadonly : ''} ${team === Team.NONE ? '' : team === Team.RED ? styles.teamRed : styles.teamBlue} ${assignedTeam === team ? styles.active : ''}`}
                                onClick={() => changeTeam(member, team)}
                              >
                                {team === 'NONE' ? '자동' : team}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.chatSection}>
          <div className={styles.chatHeader}>
            <strong>채팅</strong>
          </div>
          <div className={styles.chatMessages}>
            {chatMessages.length === 0 ? (
              <div className={styles.chatPlaceholder}>메시지가 없습니다.</div>
            ) : (
              chatMessages.map((msg, index) => (
                <div key={index} className={styles.chatMessage}>
                  <strong>{room.members?.find(m => m.id === msg.userId)?.name || 'Unknown'}:</strong> {msg.message}
                </div>
              ))
            )}
          </div>
          <div className={styles.chatInputArea}>
            <input
              type="text"
              name="message"
              placeholder="메시지를 입력하세요..."
              value={chatInput}
              autoComplete="off"
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={chatInputKeyDown}
            />
            <button onClick={sendChatMessage}>전송</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetailPage;
