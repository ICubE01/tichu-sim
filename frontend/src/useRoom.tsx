import {useAxios} from "./useAxios.tsx";
import {HttpStatusCode} from "axios";

export const useRoom = () => {
  const api = useAxios();

  const fetchRooms = () =>
    api.get('/rooms')
      .then(response => response.data);

  const createRoom = (name) =>
    api.post('/rooms', {name})
      .then(response => response.data);

  const fetchMyRoom = () =>
    api.get('/rooms/me')
      .then(response => {
        if (response.status === HttpStatusCode.NoContent) {
          return null;
        }
        return response.data;
      });

  const fetchRoom = (roomId) =>
    api.get(`/rooms/${roomId}`)
      .then(response => response.data);

  const enterRoom = (roomId) =>
    api.post(`/rooms/${roomId}`);

  const leaveRoom = (roomId) =>
    api.delete(`/rooms/${roomId}`);

  return {
    fetchRooms,
    createRoom,
    fetchMyRoom,
    enterRoom,
    leaveRoom,
    fetchRoom,
  };
};
