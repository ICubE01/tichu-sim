export interface GameRule {
  gameName: GameName;
  minPlayers: number;
  maxPlayers: number;
}

export enum GameName {
  TICHU = 'TICHU',
}
