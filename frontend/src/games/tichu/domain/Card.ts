import { Equatable } from "@/types.ts";

export enum CardType {
  STANDARD = "STANDARD",
  SPARROW = "SPARROW",
  PHOENIX = "PHOENIX",
  DRAGON = "DRAGON",
  DOG = "DOG",
}

export enum CardSuit {
  SPADE = "SPADE",
  CLUB = "CLUB",
  HEART = "HEART",
  DIAMOND = "DIAMOND",
}

export type CardRank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export interface Card extends Equatable<Card> {
  type: CardType;
  suit?: CardSuit;
  rank?: CardRank;
}

export class StandardCard implements Card {
  readonly type: CardType = CardType.STANDARD;
  readonly suit: CardSuit;
  readonly rank: CardRank;

  constructor(suit: CardSuit, rank: CardRank) {
    this.suit = suit;
    this.rank = rank;
  }

  equals(other: Card | null): boolean {
    return other !== null
      && other.type === CardType.STANDARD && other.suit === this.suit && other.rank === this.rank;
  }
}

export class SparrowCard implements Card {
  readonly type: CardType = CardType.SPARROW;

  equals(other: Card | null): boolean {
    return other !== null && other.type === CardType.SPARROW;
  }
}

export class PhoenixCard implements Card {
  readonly type: CardType = CardType.PHOENIX;

  equals(other: Card | null): boolean {
    return other !== null && other.type === CardType.PHOENIX;
  }
}

export class DragonCard implements Card {
  readonly type: CardType = CardType.DRAGON;

  equals(other: Card | null): boolean {
    return other !== null && other.type === CardType.DRAGON;
  }
}

export class DogCard implements Card {
  readonly type: CardType = CardType.DOG;

  equals(other: Card | null): boolean {
    return other !== null && other.type === CardType.DOG;
  }
}

export function cardRankToString(rank: CardRank): string {
  if (rank === 11) {
    return "J";
  } else if (rank === 12) {
    return "Q";
  } else if (rank === 13) {
    return "K";
  } else if (rank === 14) {
    return "A";
  } else {
    return rank.toString();
  }
}
