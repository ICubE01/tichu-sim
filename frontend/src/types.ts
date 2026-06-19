import { GameName, GameRule } from "@/games/types.ts";

export interface Equatable<T> {
  equals(other: T | null): boolean;
}

export interface JwtResponse {
  token: string;
}

export type Role = 'USER' | 'ADMIN' | 'BOT';

export interface MeResponse {
  id: number;
  name: string;
  role: Role;
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
  isHost: boolean;
  isReady: boolean;
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

export interface MemberMessage {
  members: MemberDto[];
}

export enum SocialAuthProviderName {
  GOOGLE = 'GOOGLE',
}

export interface UserIdentityDto {
  provider: SocialAuthProviderName;
  providerEmail: string;
  connectedAt: string;
}

export interface UserDto {
  id: number;
  name: string;
  email: string;
  hasPassword: boolean;
  createdAt: string;
}

export interface AccountDto {
  user: UserDto;
  identities: UserIdentityDto[];
}
