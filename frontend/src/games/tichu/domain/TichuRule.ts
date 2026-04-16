import { GameRule } from "@/types.ts";
import { Team } from "@/games/tichu/domain/Team.ts";

export interface TichuRule extends GameRule {
  winningScore: TichuWinningScore;
  teamAssignment: Map<number, Team>;
  timeLimit: number;
}

export enum TichuWinningScore {
  ZERO = 'ZERO',
  TWO_HUNDRED = 'TWO_HUNDRED',
  FIVE_HUNDRED = 'FIVE_HUNDRED',
  ONE_THOUSAND = 'ONE_THOUSAND',
}
