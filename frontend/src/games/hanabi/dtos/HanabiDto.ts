import { HanabiRule } from "@/games/hanabi/domain/HanabiRule.ts";

export enum HanabiColor {
  WHITE = 'WHITE',
  RED = 'RED',
  BLUE = 'BLUE',
  YELLOW = 'YELLOW',
  GREEN = 'GREEN',
  RAINBOW = 'RAINBOW',
  BLACK = 'BLACK',
}

export enum ClueType {
  COLOR = 'COLOR',
  VALUE = 'VALUE',
}

export enum BonusEffect {
  GAIN_CLUE = 'GAIN_CLUE',
  REPAIR_AND_CLUE = 'REPAIR_AND_CLUE',
  FREE_COLOR_HINT = 'FREE_COLOR_HINT',
  FREE_VALUE_HINT = 'FREE_VALUE_HINT',
  RECOVER_TO_DECK = 'RECOVER_TO_DECK',
  RECOVER_TO_PLAY = 'RECOVER_TO_PLAY',
}

// A card is masked (color/value null) when the viewer is not allowed to see it — their own hand
// cards and their own freshly drawn card. Real cards (opponents' hands, discards) are fully populated.
export interface HanabiCardDto {
  color: HanabiColor | null;
  value: number | null;
}

export interface CardViewDto {
  card: HanabiCardDto | null;
  positiveColors: HanabiColor[];
  negativeColors: HanabiColor[];
  positiveValues: number[];
  negativeValues: number[];
}

export interface PlayerDto {
  playerId: number;
  name: string;
  cardViews: CardViewDto[];
}

export interface FireworkDto {
  color: HanabiColor;
  playCount: number;
  isComplete: boolean;
  topValue: number;
  descending: boolean;
}

export interface PendingBonusDto {
  effect: BonusEffect;
  playerId: number;
}

export interface HanabiDto {
  rule: HanabiRule;
  myId: number;
  players: PlayerDto[];
  deckSize: number;
  fireworks: FireworkDto[];
  discardPile: HanabiCardDto[];
  clueTokens: number;
  maxClueTokens: number;
  fuseTokens: number;
  maxFuseTokens: number;
  currentTurnIndex: number;
  finalTurnsRemaining: number | null;
  exploded: boolean;
  ended: boolean;
  pendingBonus: PendingBonusDto | null;
}
