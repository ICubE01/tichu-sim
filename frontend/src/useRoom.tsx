import { useAxios } from "./useAxios.tsx";
import { HttpStatusCode } from "axios";
import { useCallback, useMemo } from "react";
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

  const fetchRooms = useCallback(() =>
    api.get<RoomOpaqueDto[]>('/rooms')
      .then(response => response.data),
    [api]);

  const createRoom = useCallback((createRoomRequest: CreateRoomRequest) =>
    api.post<CreateRoomResponse>('/rooms', createRoomRequest)
      .then(response => response.data),
    [api]);

  const fetchMyRoom = useCallback(() =>
    api.get<RoomDto | null>('/rooms/me')
      .then(response => {
        if (response.status === HttpStatusCode.NoContent) {
          return null;
        }
        return response.data as RoomDto;
      }),
    [api]);

  const fetchRoom = useCallback((roomId: string) =>
    api.get<RoomDto>(`/rooms/${roomId}`)
      .then(response => response.data),
    [api]);

  const enterRoom = useCallback((roomId: string) =>
    api.post(`/rooms/${roomId}`),
    [api]);

  const leaveRoom = useCallback((roomId: string) =>
    api.delete(`/rooms/${roomId}`),
    [api]);

  return useMemo(() => ({
    fetchRooms,
    createRoom,
    fetchMyRoom,
    enterRoom,
    leaveRoom,
    fetchRoom,
  }), [fetchRooms, createRoom, fetchMyRoom, enterRoom, leaveRoom, fetchRoom]);
};
