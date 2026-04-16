import { PlayerIndex } from "@/games/tichu/types.ts";
import { Team } from "@/games/tichu/domain/Team.ts";
import { TichuDeclaration } from "@/games/tichu/domain/TichuDeclaration.ts";

export class Player {
  id: number;
  name: string;
  team: Team;
  index: PlayerIndex
  cardCount: number;
  tichuDeclaration: TichuDeclaration | null;
  exitOrder: number;
  passed: boolean;

  constructor(id: number, name: string, team: Team, index: PlayerIndex) {
    this.id = id;
    this.name = name;
    this.team = team;
    this.index = index;
    this.cardCount = 0;
    this.tichuDeclaration = null;
    this.exitOrder = 0;
    this.passed = false;
  }
}