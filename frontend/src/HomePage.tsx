import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoom } from "./useRoom.tsx";
import './HomePage.css';
import { RoomOpaqueDto } from "@/types.ts";

const HomePage = () => {
  const navigate = useNavigate();
  const { fetchMyRoom, fetchRooms, createRoom, enterRoom } = useRoom();
  const [rooms, setRooms] = useState<RoomOpaqueDto[]>([]);
  const [loading, setLoading] = useState(false);

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

  const handleCreateRoom = async () => {
    const name = prompt('Enter room name:');
    if (!name) {
      return;
    }
    try {
      const res = await createRoom(name);
      navigate(`/${res.id}`);
    } catch (error) {
      console.error('Failed to create room:', error);
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
    <div className="home-container content">
      <div className="home-header">
        <h2>방 목록</h2>
        <div className="header-buttons">
          <button onClick={handleCreateRoom}>
            방 만들기
          </button>
          <button onClick={handleFetchRooms}>새로고침</button>
        </div>
      </div>

      {loading && rooms.length === 0 ? (
        <p>Loading...</p>
      ) : (
        <table className="rooms-table">
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
                  className={`room-row ${isAvailable ? 'available' : 'unavailable'}`}
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
              <td colSpan={4} className="no-rooms">
                방이 없습니다.
              </td>
            </tr>
          )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default HomePage;
