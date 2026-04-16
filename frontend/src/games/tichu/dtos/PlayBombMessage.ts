import { Trick } from "@/games/tichu/domain/Trick.ts";

export interface PlayBombMessage {
  playerId: number;
  bomb: Trick;
}
