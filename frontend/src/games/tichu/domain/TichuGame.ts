import { PlayerIndex } from "@/games/tichu/types.ts";
import { TichuRule } from "@/games/tichu/domain/TichuRule.ts";
import { Player } from "@/games/tichu/domain/Player.ts";
import { Card, CardRank } from "@/games/tichu/domain/Card.ts";
import { Trick } from "@/games/tichu/domain/Trick.ts";

export enum PhaseStatus {
  PLAYING = 'PLAYING',
  WAITING_DRAGON_SELECTION = 'WAITING_DRAGON_SELECTION',
  FINISHED = 'FINISHED',
}

export enum RoundStatus {
  WAITING_LARGE_TICHU = 'WAITING_LARGE_TICHU',
  EXCHANGING = 'EXCHANGING',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED',
}

export class TichuGame {
  rule: TichuRule | null;
  players: Player[];
  scoresHistory: number[][];
  hand: Card[];
  roundStatus: RoundStatus | null;
  wish: CardRank | null;
  phaseStatus: PhaseStatus | null;
  turn: PlayerIndex | null;
  tricks: Trick[];

  constructor() {
    this.rule = null;
    this.players = [];
    this.scoresHistory = [];
    this.hand = [];
    this.roundStatus = null;
    this.wish = null;
    this.phaseStatus = null;
    this.turn = null;
    this.tricks = [];
  }
}
