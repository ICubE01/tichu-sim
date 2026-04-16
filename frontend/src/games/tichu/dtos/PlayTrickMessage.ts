import { Trick } from "@/games/tichu/domain/Trick.ts";
import { CardRank } from "@/games/tichu/domain/Card.ts";

export interface PlayTrickMessage {
  playerId: number;
  trick: Trick;
  wish: CardRank;
}
