import { BonusEffect, ClueType, HanabiCardDto, HanabiColor } from "@/games/hanabi/dtos/HanabiDto.ts";

export enum HanabiMessageType {
  SET_RULE = 'SET_RULE',
  START = 'START',
  STATE = 'STATE',
  HINT = 'HINT',
  DISCARD = 'DISCARD',
  PLAY = 'PLAY',
  RESOLVE_FREE_HINT = 'RESOLVE_FREE_HINT',
  RESOLVE_RECOVER_TO_DECK = 'RESOLVE_RECOVER_TO_DECK',
  RESOLVE_RECOVER_TO_PLAY = 'RESOLVE_RECOVER_TO_PLAY',
  END = 'END',
}

export interface HanabiMessage {
  type: HanabiMessageType;
  data: unknown;
}

// ----- Per-action delta payloads (carried by the messages above) -----
// These mirror the backend `*Info` records. They describe only what the action changed; the resulting
// scalar counters (tokens, deck size, turn) are derived client-side by `applyDelta`. A `drawnCard` that
// is present but masked (`{color: null, value: null}`) still means a card was drawn.

export interface HintInfo {
  fromId: number;
  targetId: number;
  clueType: ClueType;
  color: HanabiColor | null;
  value: number | null;
  matchedIndices: number[];
}

export interface DiscardInfo {
  playerId: number;
  index: number;
  discardedCard: HanabiCardDto;
  drawnCard: HanabiCardDto | null;
}

export interface PlayInfo {
  playerId: number;
  index: number;
  playedCard: HanabiCardDto;
  success: boolean;
  fireworkCompleted: boolean;
  bonusEffect: BonusEffect | null;
  drawnCard: HanabiCardDto | null;
}

export interface FreeHintInfo {
  fromId: number;
  targetId: number;
  clueType: ClueType;
  color: HanabiColor | null;
  value: number | null;
  matchedIndices: number[];
  drawnCard: HanabiCardDto | null;
}

export interface RecoverToDeckInfo {
  playerId: number;
  recoveredCard: HanabiCardDto;
  drawnCard: HanabiCardDto | null;
}

export interface RecoverToPlayInfo {
  playerId: number;
  index: number;
  playedCard: HanabiCardDto;
  fireworkCompleted: boolean;
  bonusEffect: BonusEffect | null;
  drawnCard: HanabiCardDto | null;
}
