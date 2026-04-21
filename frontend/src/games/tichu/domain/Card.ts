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

export abstract class Card implements Equatable<Card> {
  readonly type: CardType;

  protected constructor(type: CardType) {
    this.type = type;
  }

  abstract equals(other: Card | null): boolean;
}

export class StandardCard extends Card {
  readonly suit: CardSuit;
  readonly rank: CardRank;

  constructor(suit: CardSuit, rank: CardRank) {
    super(CardType.STANDARD);
    this.suit = suit;
    this.rank = rank;
  }

  equals(other: Card | null): boolean {
    return other instanceof StandardCard && other.suit === this.suit && other.rank === this.rank;
  }
}

export class SparrowCard extends Card {
  constructor() {
    super(CardType.SPARROW);
  }

  equals(other: Card | null): boolean {
    return other instanceof SparrowCard;
  }
}

export class PhoenixCard extends Card {
  constructor() {
    super(CardType.PHOENIX);
  }

  equals(other: Card | null): boolean {
    return other instanceof PhoenixCard;
  }
}

export class DragonCard extends Card {
  constructor() {
    super(CardType.DRAGON);
  }

  equals(other: Card | null): boolean {
    return other instanceof DragonCard;
  }
}

export class DogCard extends Card {
  constructor() {
    super(CardType.DOG);
  }

  equals(other: Card | null): boolean {
    return other instanceof DogCard;
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
