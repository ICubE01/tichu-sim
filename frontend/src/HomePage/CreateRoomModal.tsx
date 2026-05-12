import { useState, useEffect, KeyboardEvent, MouseEvent } from 'react';
import styles from './CreateRoomModal.module.css';
import { GameName } from '@/games/types.ts';
import { CreateRoomRequest } from "@/useRoom.tsx";

const ROOM_NAME_PLACEHOLDERS = [
  '초보 환영합니다',
  '한 판 하실 분',
  '진지하게 즐겨요',
  '친목 게임방',
  '실력자 모여라',
  '같이 배워요',
  '즐겜 하실 분만',
  '대박 나는 방',
  '편하게 즐겨요',
  '승부욕 있는 분',
];

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (createRoomRequest: CreateRoomRequest) => void;
}

const CreateRoomModal = ({ isOpen, onClose, onCreate }: CreateRoomModalProps) => {
  const [roomName, setRoomName] = useState('');
  const [gameName, setGameName] = useState<GameName>(GameName.TICHU);

  const [isOverlayMouseDown, setIsOverlayMouseDown] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRoomName(ROOM_NAME_PLACEHOLDERS[Math.floor(Math.random() * ROOM_NAME_PLACEHOLDERS.length)]);
    } else {
      setRoomName('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleOverlayMouseDown = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOverlayMouseDown(true);
    } else {
      setIsOverlayMouseDown(false);
    }
  };

  const handleOverlayMouseUp = (e: MouseEvent) => {
    if (isOverlayMouseDown && e.target === e.currentTarget) {
      onClose();
    }
    setIsOverlayMouseDown(false);
  };

  const handleCreate = () => {
    if (roomName.trim()) {
      onCreate({ name: roomName.trim(), gameName: gameName });
      setRoomName('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCreate();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className={styles.modalOverlay}
      onMouseDown={handleOverlayMouseDown}
      onMouseUp={handleOverlayMouseUp}
    >
      <div className={styles.modalContent}>
        <h2>방 만들기</h2>

        <div className={styles.inputGroup}>
          <div className={styles.labelRow}>
            <label htmlFor="roomName">방 이름</label>
            <span className={styles.charCount}>{roomName.length}/20</span>
          </div>
          <input
            id="roomName"
            type="text"
            className={styles.roomInput}
            placeholder="방 이름을 입력해주세요..."
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={20}
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.labelRow} htmlFor="gameName">게임 종류</label>
          <select
            id="gameName"
            className={styles.gameSelect}
            value={gameName}
            onChange={(e) => setGameName(e.target.value as GameName)}
          >
            <option value={GameName.TICHU}>티츄 (Tichu)</option>
            {/* 향후 다른 게임 추가 가능 */}
          </select>
        </div>

        <div className={styles.buttonGroup}>
          <button className={styles.cancelButton} onClick={onClose}>
            취소
          </button>
          <button
            className={styles.createButton}
            onClick={handleCreate}
            disabled={!roomName.trim()}
          >
            방 생성하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRoomModal;
