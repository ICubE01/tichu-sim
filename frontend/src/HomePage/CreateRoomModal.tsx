import { useState, KeyboardEvent, MouseEvent } from 'react';
import styles from './CreateRoomModal.module.css';
import { GameName } from '@/games/types.ts';
import { CreateRoomRequest } from "@/useRoom.tsx";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (createRoomRequest: CreateRoomRequest) => void;
}

const CreateRoomModal = ({ isOpen, onClose, onCreate }: CreateRoomModalProps) => {
  const [roomName, setRoomName] = useState('');
  const [gameName, setGameName] = useState<GameName>(GameName.TICHU);

  const [isOverlayMouseDown, setIsOverlayMouseDown] = useState(false);

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
          <label htmlFor="roomName">방 이름</label>
          <input
            id="roomName"
            type="text"
            className={styles.roomInput}
            placeholder="방 이름을 입력해주세요..."
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="gameName">게임 종류</label>
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
