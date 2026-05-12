import { GameName, GameRule } from "@/games/types.ts";

export interface Equatable<T> {
  equals(other: T | null): boolean;
}

export interface RoomOpaqueDto {
  id: string;
  name: string;
  memberCount: number;
  gameName: GameName;
  hasGameStarted: boolean;
  maxPlayers: number;
}

export interface MemberDto {
  id: number;
  name: string;
}

export interface RoomDto {
  id: string;
  name: string;
  members: MemberDto[];
  gameName: GameName;
  hasGameStarted: boolean;
  gameRule: GameRule;
}

export interface ChatMessage {
  userId: number;
  message: string;
}
