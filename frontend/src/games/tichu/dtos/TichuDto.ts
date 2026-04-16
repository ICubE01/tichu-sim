import { TichuRule } from "@/games/tichu/domain/TichuRule.ts";
import { Team } from "@/games/tichu/domain/Team.ts";
import { Card, CardRank } from "@/games/tichu/domain/Card.ts";
import { PhaseStatus, RoundStatus } from "@/games/tichu/domain/TichuGame.ts";
import { TichuDeclaration } from "@/games/tichu/domain/TichuDeclaration.ts";
import { PlayerIndex } from "@/games/tichu/types.ts";
import { Trick } from "@/games/tichu/domain/Trick.ts";

export interface TichuDto {
  rule: TichuRule;
  players: PlayerDto[];
  scoresHistory: number[][];
  handCounts: Map<number, number>;
  myHand: Card[];
  roundStatus: RoundStatus;
  tichuDeclarations: (TichuDeclaration | null)[];
  wish: CardRank | null;
  exitOrder: (0 | 1 | 2)[];
  phaseStatus: PhaseStatus | null;
  turn: PlayerIndex | null;
  tricks: Trick[] | null;
}

export interface PlayerDto {
  id: number;
  name: string;
  team: Team;
}
