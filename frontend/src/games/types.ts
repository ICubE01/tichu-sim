export interface GameRule {
  gameName: GameName;
  minPlayers: number;
  maxPlayers: number;
}

export enum GameName {
  TICHU = 'TICHU',
  HANABI = 'HANABI',
}

export interface GameMessage {
  type: string;
  data: unknown;
}
