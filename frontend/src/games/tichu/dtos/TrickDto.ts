import { PlayerIndex } from "@/games/tichu/types.ts";
import { TrickType } from "@/games/tichu/domain/Trick.ts";
import { CardDto } from "@/games/tichu/dtos/CardDto.ts";

export interface TrickDto {
  playerIndex: PlayerIndex
  type: TrickType
  cards: CardDto[]
  rank: number | null
  minRank: number | null
  maxRank: number | null
  phoenixRank: number | null
}
