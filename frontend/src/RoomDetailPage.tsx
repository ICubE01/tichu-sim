import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './RoomDetailPage.css';
import { useAuth } from './useAuth.tsx';
import { useAxios } from "./useAxios.tsx";
import { useRoom } from "./useRoom.tsx";
import { useStomp } from "./useStomp.tsx"
import TichuPage from "./TichuPage.tsx";

const RoomDetailPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchMyRoom, enterRoom, leaveRoom, fetchRoom } = useRoom();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const stomp = useStomp();
  const api = useAxios();
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

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

  const handleMemberChange = useCallback((memberMessage) => {
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

  const handleReceiveChatMessage = useCallback((chatMessage) => {
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

  const handleKeyPressOnChatInput = (e) => {
    if (e.key === 'Enter') {
      handleSendChatMessage();
    }
  };

  useEffect(() => {
    if (!user) return;

    const handleTichuMessage = (message) => {
      if (message.type === 'START') {
        setRoom(prev => ({
          ...prev,
          hasGameStarted: true,
        }));
      } else if (message.type === 'SET_RULE') {
        setRoom(prev => ({
          ...prev,
          gameRule: message.data
        }));
      }
    };
    const handleError = (error) => {
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
  }, [roomId, user, handleMemberChange, handleReceiveChatMessage]);

  const handleGameStartRequest = () => {
    stomp.publish(`/app/rooms/${roomId}/game/tichu/start`, {});
  }

  const handleSetRule = (newRule) => {
    stomp.publish(`/app/rooms/${roomId}/game/tichu/set-rule`, newRule);
  };

  const handleWinningScoreChange = (score) => {
    const newRule = {
      ...room.gameRule,
      winningScore: score
    };
    handleSetRule(newRule);
  };

  const handleTeamChange = (member, team) => {
    const newRule = {
      ...room.gameRule,
      teamAssignment: {
        ...room.gameRule.teamAssignment,
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
          ...prev,
          hasGameStarted: false,
        }))
      }}
    />
  }

  const canStartGame = room.gameRule.minPlayers <= room.members.length
    && room.members.length <= room.gameRule.maxPlayers;

  const formatWinningScore = (winningScore) => {
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
    <div className="room-detail-container content">
      <div className="room-detail-header">
        <h2>[{room.id}] {room.name}</h2>
        <div className="room-detail-header-buttons">
          <button onClick={handleGameStartRequest} className="game-start-button" disabled={!canStartGame}>게임 시작</button>
          <button onClick={handleLeaveRoom} className="leave-button">나가기</button>
        </div>
      </div>

      <div className="room-content">
        <div className="room-info-section">
          <div className="info-card">
            <h3>참가자 ({room.members?.length || 0} / 4)</h3>
            <ul className="member-list">
              {room.members?.map((member) => (
                <li key={member.id} className="member-item">
                  {member.name}
                </li>
              ))}
            </ul>
          </div>

          <div className="info-card">
            <h3>게임 설정</h3>
            <div className="rule-box">
              <div className="rule-item">
                <span>승리 점수</span>
                <div className="rule-button-group">
                  {['ZERO', 'TWO_HUNDRED', 'FIVE_HUNDRED', 'ONE_THOUSAND'].map((score) => (
                    <button
                      key={score}
                      className={`rule-button ${room.gameRule.winningScore === score ? 'active' : ''}`}
                      onClick={() => handleWinningScoreChange(score)}
                    >
                      {formatWinningScore(score) || score}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rule-item">
                <span>팀 선택</span>
                <div className="rule-item-box">
                  {room.members.map((member) => (
                    <div className="rule-item">
                      <span>{member.name}</span>
                      <div className="rule-button-group">
                        {['RED', 'NONE', 'BLUE'].map((team) => (
                          <button
                            className={`rule-button team-${team.toLowerCase()} ${room.gameRule.teamAssignment?.[member.id] === team || (!room.gameRule.teamAssignment?.[member.id] && team === 'NONE') ? 'active' : ''}`}
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

        <div className="chat-section">
          <div className="chat-header">
            <strong>채팅</strong>
          </div>
          <div className="chat-messages">
            {chatMessages.length === 0 ? (
              <div className="chat-placeholder">메시지가 없습니다.</div>
            ) : (
              chatMessages.map((msg, index) => (
                <div key={index} className="chat-message">
                  <strong>{room.members?.find(m => m.id === msg.userId)?.name || 'Unknown'}:</strong> {msg.message}
                </div>
              ))
            )}
          </div>
          <div className="chat-input-area">
            <input
              type="text"
              name="message"
              placeholder="메시지를 입력하세요..."
              value={chatInput}
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
