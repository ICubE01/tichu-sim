import { useAxios } from "./useAxios.tsx";
import { HttpStatusCode } from "axios";
import { RoomDto, RoomOpaqueDto } from "@/types.ts";
import { GameName } from "@/games/types.ts";

export interface CreateRoomRequest {
  name: string;
  gameName: GameName;
}

interface CreateRoomResponse {
  id: number;
}

export const useRoom = () => {
  const api = useAxios();

  const fetchRooms = () =>
    api.get<RoomOpaqueDto[]>('/rooms')
      .then(response => response.data);

  const createRoom = (createRoomRequest: CreateRoomRequest) =>
    api.post<CreateRoomResponse>('/rooms', createRoomRequest)
      .then(response => response.data);

  const fetchMyRoom = () =>
    api.get<RoomDto | null>('/rooms/me')
      .then(response => {
        if (response.status === HttpStatusCode.NoContent) {
          return null;
        }
        return response.data as RoomDto;
      });

  const fetchRoom = (roomId: string) =>
    api.get<RoomDto>(`/rooms/${roomId}`)
      .then(response => response.data);

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
