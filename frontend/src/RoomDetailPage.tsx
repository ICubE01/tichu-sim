import { KeyboardEventHandler, useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './RoomDetailPage.module.css';
import { useAuth } from './useAuth.tsx';
import { useAxios } from "./useAxios.tsx";
import { useRoom } from "./useRoom.tsx";
import { useStomp } from "./useStomp.tsx"
import TichuPage from "./games/tichu/TichuPage.tsx";
import { ChatMessage, MemberDto, RoomDto } from "@/types.ts";
import { TichuMessage, TichuMessageType } from "@/games/tichu/dtos/TichuMessage.ts";
import { TichuRule, TichuWinningScore } from "@/games/tichu/domain/TichuRule.ts";
import { Team } from "@/games/tichu/domain/Team.ts";
import { GameRule } from "@/games/types.ts";

interface MemberMessage {
  type: 'ENTER' | 'LEAVE';
  id: number;
  name: string;
}

const RoomDetailPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchMyRoom, enterRoom, leaveRoom, fetchRoom } = useRoom();
  const [room, setRoom] = useState<RoomDto | null>(null);
  const [loading, setLoading] = useState(true);
  const stomp = new useStomp();
  const api = useAxios();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');

  if (!roomId) {
    navigate('/');
    return;
  }

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom(roomId);
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
        myRoom = await fetchMyRoom();
      } catch (error) {
        console.error('Failed to fetch my room:', error);
        return;
      }
      if (myRoom === null) {
        try {
          await enterRoom(roomId);
        } catch (error) {
          console.error('Failed to enter room:', error);
          navigate('/');
          return;
        }
      } else if (String(myRoom.id) !== String(roomId)) {
        alert('You are already in another room. Please leave the current room first.');
        navigate(`/${myRoom.id}`);
        return;
      }

      try {
        setRoom(await fetchRoom(roomId));
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

      let members = [...(prevRoom.members || [])];
      if (memberMessage.type === 'ENTER') {
        if (!members.find(m => m.id === memberMessage.id)) {
          members.push({ id: memberMessage.id, name: memberMessage.name });
        }
      } else if (memberMessage.type === 'LEAVE') {
        members = members.filter(m => m.id !== memberMessage.id);
      }

      return { ...prevRoom, members: members };
    });
  }, []);

  const handleReceiveChatMessage = useCallback((chatMessage: ChatMessage) => {
    setChatMessages((prev) => [...prev, chatMessage]);
  }, []);

  const handleSendChatMessage = () => {
    if (chatInput.trim() === '') {
      return;
    }

    stomp.publish(`/app/rooms/${roomId}/chat`, {
      message: chatInput
    });

    setChatInput('');
  };

  const handleKeyPressOnChatInput: KeyboardEventHandler = (e) => {
    if (e.key === 'Enter') {
      handleSendChatMessage();
    }
  };

  useEffect(() => {
    if (!user || !room) return;

    const handleTichuMessage = (message: TichuMessage) => {
      if (message.type === TichuMessageType.START) {
        setRoom(prev => ({
          ...prev!,
          hasGameStarted: true,
        }));
      } else if (message.type === TichuMessageType.SET_RULE) {
        setRoom(prev => ({
          ...prev!,
          gameRule: message.data as TichuRule
        }));
      }
    };
    const handleError = (error: Error) => {
      alert(`Error: ${error.message || 'Unknown error'}`);
    };

    stomp.subscribe(`/topic/rooms/${roomId}/members`, handleMemberChange);
    stomp.subscribe(`/topic/rooms/${roomId}/chat`, handleReceiveChatMessage);
    stomp.subscribe(`/user/${user.id}/queue/game/tichu`, handleTichuMessage);
    stomp.subscribe(`/user/${user.id}/queue/errors`, handleError);

    api.get('/auth/issue/web-socket-token')
      .then(response => response.data.token)
      .then(token => stomp.connect(token));

    return () => {
      stomp.unsubscribe(`/topic/rooms/${roomId}/members`, handleMemberChange);
      stomp.unsubscribe(`/topic/rooms/${roomId}/chat`, handleReceiveChatMessage);
      stomp.unsubscribe(`/user/${user.id}/queue/game/tichu`, handleTichuMessage);
      stomp.unsubscribe(`/user/${user.id}/queue/errors`, handleError);
      stomp.disconnect();
    };
  }, [roomId, room, user, handleMemberChange, handleReceiveChatMessage]);

  const handleGameStartRequest = () => {
    stomp.publish(`/app/rooms/${roomId}/game/tichu/start`, {});
  }

  const handleSetRule = (newRule: GameRule) => {
    stomp.publish(`/app/rooms/${roomId}/game/tichu/set-rule`, newRule);
  };

  const handleWinningScoreChange = (score: TichuWinningScore) => {
    const newRule = {
      ...room!.gameRule,
      winningScore: score
    };
    handleSetRule(newRule);
  };

  const handleTeamChange = (member: MemberDto, team: Team) => {
    const newRule = {
      ...room!.gameRule,
      teamAssignment: {
        ...(room!.gameRule as TichuRule).teamAssignment,
        [member.id]: team
      }
    };
    handleSetRule(newRule);
  };

  if (loading || room === null) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  if (room.hasGameStarted) {
    return <TichuPage
      roomId={room.id}
      stomp={stomp}
      chatMessages={chatMessages}
      onGameEnd={() => {
        setRoom(prev => ({
          ...prev!,
          hasGameStarted: false,
        }))
      }}
    />
  }

  const canStartGame = room.gameRule.minPlayers <= room.members.length
    && room.members.length <= room.gameRule.maxPlayers;

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

  return (
    <div className={`${styles.roomDetailContainer} content`}>
      <div className={styles.roomDetailHeader}>
        <h2>[{room.id}] {room.name}</h2>
        <div className={styles.roomDetailHeaderButtons}>
          <button onClick={handleGameStartRequest} className={styles.gameStartButton} disabled={!canStartGame}>게임 시작</button>
          <button onClick={handleLeaveRoom} className={styles.leaveButton}>나가기</button>
        </div>
      </div>

      <div className={styles.roomContent}>
        <div className={styles.roomInfoSection}>
          <div className={styles.infoCard}>
            <h3>참가자 ({room.members?.length || 0} / 4)</h3>
            <ul className={styles.memberList}>
              {room.members?.map((member) => (
                <li key={member.id} className={styles.memberItem}>
                  {member.name}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.infoCard}>
            <h3>게임 설정</h3>
            <div className={styles.ruleBox}>
              <div className={styles.ruleItem}>
                <span>승리 점수</span>
                <div className={styles.ruleButtonGroup}>
                  {[TichuWinningScore.ZERO, TichuWinningScore.TWO_HUNDRED, TichuWinningScore.FIVE_HUNDRED, TichuWinningScore.ONE_THOUSAND].map((score) => (
                    <button
                      key={score}
                      className={`${styles.ruleButton} ${(room.gameRule as TichuRule).winningScore === score ? styles.active : ''}`}
                      onClick={() => handleWinningScoreChange(score)}
                    >
                      {formatWinningScore(score) || score}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.ruleItem}>
                <span>팀 선택</span>
                <div className={styles.ruleItemBox}>
                  {room.members.map((member) => (
                    <div key={`team-assignment-${member.id}`} className={styles.ruleItem}>
                      <span>{member.name}</span>
                      <div className={styles.ruleButtonGroup}>
                        {[Team.RED, Team.NONE, Team.BLUE].map((team) => (
                          <button
                            key={`team-assignment-${member.id}-${team.toLowerCase()}`}
                            className={`${styles.ruleButton} ${team === Team.NONE ? '' : team === Team.RED ? styles.teamRed : styles.teamBlue} ${(room.gameRule as TichuRule).teamAssignment[member.id] === team || (!(room.gameRule as TichuRule).teamAssignment[member.id] && team === 'NONE') ? styles.active : ''}`}
                            onClick={() => handleTeamChange(member, team)}
                          >
                            {team === 'NONE' ? '자동' : team}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
              onKeyDown={handleKeyPressOnChatInput}
            />
            <button onClick={handleSendChatMessage}>전송</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetailPage;
