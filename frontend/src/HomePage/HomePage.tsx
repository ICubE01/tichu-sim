import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateRoomRequest, useRoom } from "@/useRoom.tsx";
import { RoomOpaqueDto } from "@/types.ts";
import styles from './HomePage.module.css';
import CreateRoomModal from './CreateRoomModal';

const HomePage = () => {
  const navigate = useNavigate();
  const { fetchMyRoom, fetchRooms, createRoom, enterRoom } = useRoom();
  const [rooms, setRooms] = useState<RoomOpaqueDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateRoomModalOpen, setIsCreateModalOpen] = useState(false);

  const checkMyRoom = async () => {
    try {
      const myRoom = await fetchMyRoom();
      if (myRoom !== null) {
        navigate(`/${myRoom.id}`, { replace: true });
      }
    } catch (error) {
      console.error('Failed to fetch my room:', error);
    }
  };

  const handleFetchRooms = async () => {
    try {
      setRooms(await fetchRooms());
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      alert('Failed to get rooms data. Please try again.')
    }
  }

  const handleCreateRoom = async (createRoomRequest: CreateRoomRequest) => {
    try {
      const res = await createRoom(createRoomRequest);
      navigate(`/${res.id}`);
    } catch (error) {
      console.error('Failed to create room:', error);
    } finally {
      setIsCreateModalOpen(false);
    }
  }

  const handleEnterRoom = async (room: RoomOpaqueDto) => {
    if (room.memberCount >= 4 || room.hasGameStarted) {
      alert('Unable to enter the room.');
      return;
    }
    try {
      await enterRoom(room.id);
      navigate(`/${room.id}`);
    } catch (error) {
      console.error('Failed to enter room:', error)
    }
  };

  useEffect(() => {
    setLoading(true);
    checkMyRoom().then();
    handleFetchRooms().then();
    setLoading(false);
  }, []);

  return (
    <div className={`${styles.homeContainer} content`}>
      <div className={styles.homeHeader}>
        <h2>방 목록</h2>
        <div className={styles.headerButtons}>
          <button onClick={() => setIsCreateModalOpen(true)}>
            방 만들기
          </button>
          <button onClick={handleFetchRooms}>새로고침</button>
        </div>
      </div>

      {loading && rooms.length === 0 ? (
        <p>Loading...</p>
      ) : (
        <table className={styles.roomsTable}>
          <thead>
          <tr>
            <th>ID</th>
            <th>이름</th>
            <th>상태</th>
            <th>인원</th>
          </tr>
          </thead>
          <tbody>
          {rooms.length > 0 ? (
            rooms.map((room) => {
              const isAvailable = room.memberCount < 4 && !room.hasGameStarted;
              return (
                <tr
                  key={room.id}
                  onClick={() => handleEnterRoom(room)}
                  className={`${styles.roomRow} ${isAvailable ? styles.available : styles.unavailable}`}
                >
                  <td>{room.id}</td>
                  <td>{room.name || `방 ${room.id}`}</td>
                  <td>{room.hasGameStarted ? '게임 진행 중' : '대기 중'}</td>
                  <td>{room.memberCount} / 4</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={4} className={styles.noRooms}>
                방이 없습니다.
              </td>
            </tr>
          )}
          </tbody>
        </table>
      )}

      <CreateRoomModal
        isOpen={isCreateRoomModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateRoom}
      />
    </div>
  );
};

export default HomePage;
