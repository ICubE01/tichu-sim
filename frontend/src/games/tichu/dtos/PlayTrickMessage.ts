import { TrickDto } from "@/games/tichu/dtos/TrickDto.ts";
import { CardRank } from "@/games/tichu/domain/Card.ts";

export interface PlayTrickMessage {
  playerId: number;
  trick: TrickDto;
  wish: CardRank;
}
