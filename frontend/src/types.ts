export interface Equatable<T> {
  equals(other: T | null): boolean;
}

export interface RoomOpaqueDto {
  id: string;
  name: string;
  memberCount: number;
  hasGameStarted: boolean;
}

export interface MemberDto {
  id: number;
  name: string;
}

export interface GameRule {
  minPlayers: number;
  maxPlayers: number;
}

export interface RoomDto {
  id: string;
  name: string;
  members: MemberDto[];
  hasGameStarted: boolean;
  gameRule: GameRule;
}

export interface ChatMessage {
  userId: number;
  message: string;
}
