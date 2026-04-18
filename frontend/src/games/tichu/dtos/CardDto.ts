import { CardType, CardSuit, CardRank } from "@/games/tichu/domain/Card.ts";

export interface CardDto {
  type: CardType;
  suit: CardSuit | null;
  rank: CardRank | null;
}
