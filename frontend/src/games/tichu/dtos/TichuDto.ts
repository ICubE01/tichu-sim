import { TichuRule } from "@/games/tichu/domain/TichuRule.ts";
import { Team } from "@/games/tichu/domain/Team.ts";
import { CardRank } from "@/games/tichu/domain/Card.ts";
import { PhaseStatus, RoundStatus } from "@/games/tichu/domain/TichuGame.ts";
import { TichuDeclaration } from "@/games/tichu/domain/TichuDeclaration.ts";
import { PlayerIndex } from "@/games/tichu/types.ts";
import { CardDto } from "@/games/tichu/dtos/CardDto.ts";
import { TrickDto } from "@/games/tichu/dtos/TrickDto.ts";

export interface TichuDto {
  rule: TichuRule;
  players: PlayerDto[];
  scoresHistory: number[][];
  handCounts: Record<number, number>;
  myHand: CardDto[];
  roundStatus: RoundStatus;
  myExchange: { left: CardDto | null, mid: CardDto | null, right: CardDto | null };
  tichuDeclarations: (TichuDeclaration | null)[];
  wish: CardRank | null;
  exitOrder: (0 | 1 | 2)[];
  phaseStatus: PhaseStatus | null;
  turn: PlayerIndex | null;
  tricks: TrickDto[] | null;
}

export interface PlayerDto {
  id: number;
  name: string;
  team: Team;
}
