import { useAxios } from "./useAxios.tsx";
import { HttpStatusCode } from "axios";
import { RoomDto, RoomOpaqueDto } from "@/types.ts";

interface CreateRoomResponse {
  id: number;
}

export const useRoom = () => {
  const api = useAxios();

  const fetchRooms = () =>
    api.get('/rooms')
      .then(response => response.data as RoomOpaqueDto[]);

  const createRoom = (name: string) =>
    api.post('/rooms', { name })
      .then(response => response.data as CreateRoomResponse);

  const fetchMyRoom = () =>
    api.get('/rooms/me')
      .then(response => {
        if (response.status === HttpStatusCode.NoContent) {
          return null;
        }
        return response.data as RoomDto;
      });

  const fetchRoom = (roomId: string) =>
    api.get(`/rooms/${roomId}`)
      .then(response => response.data as RoomDto);

  const enterRoom = (roomId: string) =>
    api.post(`/rooms/${roomId}`);

  const leaveRoom = (roomId: string) =>
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
