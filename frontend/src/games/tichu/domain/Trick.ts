import { Card, CardRank, DogCard, DragonCard, PhoenixCard, SparrowCard, StandardCard } from "@/games/tichu/domain/Card.ts";
import { Cards } from "@/games/tichu/domain/Cards.ts";
import { PlayerIndex } from "@/games/tichu/types.ts";

export enum TrickType {
  SINGLE = "SINGLE",
  PAIR = "PAIR",
  THREE_OF_A_KIND = "THREE_OF_A_KIND",
  FULL_HOUSE = "FULL_HOUSE",
  CONSECUTIVE_PAIRS = "CONSECUTIVE_PAIRS",
  STRAIGHT = "STRAIGHT",
  DOG = "DOG",
  FOUR_OF_A_KIND = "FOUR_OF_A_KIND",
  STRAIGHT_FLUSH = "STRAIGHT_FLUSH",
}

export function isBomb(trickType: TrickType) {
  return trickType === TrickType.FOUR_OF_A_KIND || trickType === TrickType.STRAIGHT_FLUSH;
}

export abstract class Trick {
  public readonly type: TrickType;
  public readonly playerIndex: PlayerIndex;
  public readonly cards: Card[];

  protected constructor(type: TrickType, playerIndex: PlayerIndex, cards: Card[]) {
    this.type = type;
    this.playerIndex = playerIndex;
    this.cards = cards;
  }

  public abstract canCoverUp(other: Trick | null): boolean;

  public abstract canFulfillWishAfter(wish: CardRank, hand: Card[]): boolean;
}

export class SingleTrick extends Trick {
  public readonly rank: number;
  public readonly isPhoenixUsed: boolean;

  public constructor(playerIndex: PlayerIndex, cards: Card[], prevTrick: Trick | null) {
    super(TrickType.SINGLE, playerIndex, cards);

    const card = cards[0];
    if (card instanceof StandardCard) {
      this.rank = card.rank;
      this.isPhoenixUsed = false;
    } else if (card instanceof SparrowCard) {
      this.rank = 1;
      this.isPhoenixUsed = false;
    } else if (card instanceof PhoenixCard) {
      this.isPhoenixUsed = true;
      if (prevTrick === null) {
        this.rank = 1.5;
      } else if (prevTrick instanceof SingleTrick) {
        if (prevTrick.card() instanceof DragonCard) {
          this.rank = 0;
        } else {
          this.rank = prevTrick.rank + 0.5;
        }
      } else {
        this.rank = 0;
      }
    } else if (card instanceof DragonCard) {
      this.rank = 20;
      this.isPhoenixUsed = false;
    } else {
      throw new Error("Invalid card type for SingleTrick");
    }
  }

  public static isSingleTrick(cards: Card[]): boolean {
    return cards.length === 1 && !(cards[0] instanceof DogCard);
  }

  public card(): Card {
    return this.cards[0];
  }

  public canCoverUp(other: Trick | null): boolean {
    return other === null || (other instanceof SingleTrick && this.rank > other.rank);
  }

  public canFulfillWishAfter(wish: CardRank, hand: Card[]): boolean {
    return SingleTrick.canFulfillWish(wish, hand, this)
      || FourOfAKindTrick.canFulfillWish(wish, hand, null)
      || StraightFlushTrick.canFulfillWish(wish, hand, null);
  }

  public static canFulfillWish(wish: CardRank, hand: Card[], prevTrick: SingleTrick): boolean {
    return wish > prevTrick.rank && Cards.containsWishCard(hand, wish);
  }
}

export class PairTrick extends Trick {
  public readonly rank: number;
  public readonly isPhoenixUsed: boolean;

  public constructor(playerIndex: PlayerIndex, cards: Card[]) {
    super(TrickType.PAIR, playerIndex, cards);
    this.rank = Cards.extractStandardCardRanks(cards)[0];
    this.isPhoenixUsed = Cards.containsPhoenix(cards);
  }

  public static isPairTrick(cards: Card[]): boolean {
    if (cards.length !== 2 || !Cards.areDistinct(cards)) {
      return false;
    }

    const ranks = Cards.extractStandardCardRanks(cards);
    if (Cards.containsPhoenix(cards)) {
      return ranks.length === 1;
    } else {
      return ranks.length === 2 && ranks[0] === ranks[1];
    }
  }

  public canCoverUp(other: Trick | null): boolean {
    return other === null || (other instanceof PairTrick && this.rank > other.rank);
  }

  public canFulfillWishAfter(wish: CardRank, hand: Card[]): boolean {
    return PairTrick.canFulfillWish(wish, hand, this)
      || FourOfAKindTrick.canFulfillWish(wish, hand, null)
      || StraightFlushTrick.canFulfillWish(wish, hand, null);
  }

  public static canFulfillWish(wish: CardRank, hand: Card[], prevTrick: PairTrick): boolean {
    if (wish <= prevTrick.rank) {
      return false;
    }

    const wishCardCount = Cards.extractStandardCardRanks(hand).filter(r => r === wish).length;
    return (Cards.containsPhoenix(hand) && wishCardCount >= 1) || wishCardCount >= 2;
  }
}

export class ThreeOfAKindTrick extends Trick {
  public readonly rank: number;
  public readonly isPhoenixUsed: boolean;

  public constructor(playerIndex: PlayerIndex, cards: Card[]) {
    super(TrickType.THREE_OF_A_KIND, playerIndex, cards);
    this.rank = Cards.extractStandardCardRanks(cards)[0];
    this.isPhoenixUsed = Cards.containsPhoenix(cards);
  }

  public static isThreeOfAKindTrick(cards: Card[]): boolean {
    if (cards.length !== 3 || !Cards.areDistinct(cards)) {
      return false;
    }

    const ranks = Cards.extractStandardCardRanks(cards);
    if (Cards.containsPhoenix(cards)) {
      return ranks.length === 2 && ranks[0] === ranks[1];
    } else {
      return ranks.length === 3 && ranks[0] === ranks[1] && ranks[1] === ranks[2];
    }
  }

  public canCoverUp(other: Trick | null): boolean {
    return other === null || (other instanceof ThreeOfAKindTrick && this.rank > other.rank);
  }

  public canFulfillWishAfter(wish: CardRank, hand: Card[]): boolean {
    return ThreeOfAKindTrick.canFulfillWish(wish, hand, this)
      || FourOfAKindTrick.canFulfillWish(wish, hand, null)
      || StraightFlushTrick.canFulfillWish(wish, hand, null);
  }

  public static canFulfillWish(wish: CardRank, hand: Card[], prevTrick: ThreeOfAKindTrick): boolean {
    if (wish <= prevTrick.rank) {
      return false;
    }

    const wishCardCount = Cards.extractStandardCardRanks(hand).filter(r => r === wish).length;
    return (Cards.containsPhoenix(hand) && wishCardCount >= 2) || wishCardCount >= 3;
  }
}

export class FullHouseTrick extends Trick {
  public readonly rank: number;
  public readonly phoenixRank: number | null;

  public constructor(playerIndex: PlayerIndex, cards: Card[]) {
    super(TrickType.FULL_HOUSE, playerIndex, cards);

    const ranks = Cards.extractStandardCardRanks(cards).toSorted();
    this.rank = ranks[2];
    if (Cards.containsPhoenix(cards)) {
      if (ranks[1] === ranks[3]) {
        this.phoenixRank = ranks[0];
      } else {
        this.phoenixRank = ranks[3];
      }
    } else {
      this.phoenixRank = null;
    }
  }

  public static isFullHouseTrick(cards: Card[]): boolean {
    if (cards.length !== 5 || !Cards.areDistinct(cards)) {
      return false;
    }

    const ranks = Cards.extractStandardCardRanks(cards).toSorted();
    if (Cards.containsPhoenix(cards)) {
      if (ranks.length !== 4 || ranks[0] === ranks[3]) {
        return false;
      }

      return ranks[0] === ranks[1] && ranks[1] === ranks[2]
        || ranks[0] === ranks[1] && ranks[2] === ranks[3]
        || ranks[1] === ranks[2] && ranks[2] === ranks[3];
    } else {
      return ranks.length === 5
        && ranks[0] === ranks[1]
        && ranks[3] === ranks[4]
        && (ranks[1] === ranks[2] || ranks[2] === ranks[3]);
    }
  }

  public canCoverUp(other: Trick | null): boolean {
    return other === null || (other instanceof FullHouseTrick && this.rank > other.rank);
  }

  public canFulfillWishAfter(wish: CardRank, hand: Card[]): boolean {
    return FullHouseTrick.canFulfillWish(wish, hand, this)
      || FourOfAKindTrick.canFulfillWish(wish, hand, null)
      || StraightFlushTrick.canFulfillWish(wish, hand, null);
  }

  public static canFulfillWish(wish: CardRank, hand: Card[], prevTrick: FullHouseTrick): boolean {
    const ranks = Cards.extractStandardCardRanks(hand);
    const rankCounts = new Map<CardRank, number>();
    for (const r of ranks) {
      rankCounts.set(r, (rankCounts.get(r) || 0) + 1);
    }
    const hasPhoenix = Cards.containsPhoenix(hand);
    const wishCount = rankCounts.get(wish) || 0;

    if (wish > prevTrick.rank) {
      if (wishCount >= 3) {
        const hasPair = Array.from(rankCounts.entries())
          .some(([r, c]) => r !== wish && c >= 2);
        const hasSingle = Array.from(rankCounts.entries())
          .some(([r, c]) => r !== wish && c >= 1);
        if (hasPair || hasPhoenix && hasSingle) {
          return true;
        }
      } else if (hasPhoenix && wishCount >= 2) {
        const hasPair = Array.from(rankCounts.entries())
          .some(([r, c]) => r !== wish && c >= 2);
        if (hasPair) {
          return true;
        }
      }
    }

    if (wishCount >= 2) {
      const hasTriple = Array.from(rankCounts.entries())
        .some(([r, c]) => r !== wish && r > prevTrick.rank && c >= 3);
      const hasPair = Array.from(rankCounts.entries())
        .some(([r, c]) => r !== wish && r > prevTrick.rank && c >= 2);
      return hasTriple || hasPhoenix && hasPair;
    } else if (hasPhoenix && wishCount >= 1) {
      return Array.from(rankCounts.entries())
        .some(([r, c]) => r !== wish && r > prevTrick.rank && c >= 3);
    } else {
      return false;
    }
  }
}

export class ConsecutivePairsTrick extends Trick {
  public readonly minRank: number;
  public readonly maxRank: number;
  public readonly phoenixRank: number | null;

  public constructor(playerIndex: PlayerIndex, cards: Card[]) {
    super(TrickType.CONSECUTIVE_PAIRS, playerIndex, cards);

    const ranks = Cards.extractStandardCardRanks(cards);
    this.minRank = Math.min(...ranks);
    this.maxRank = Math.max(...ranks);

    if (Cards.containsPhoenix(cards)) {
      const rankCounts = new Map<CardRank, number>();
      for (const r of ranks) {
        rankCounts.set(r, (rankCounts.get(r) || 0) + 1);
      }
      this.phoenixRank = Array.from(rankCounts.entries())
        .filter(([, c]) => c != 2)
        .map(([r,]) => r)
        .at(0) as number;
    } else {
      this.phoenixRank = null;
    }
  }

  public static isConsecutivePairsTrick(cards: Card[]): boolean {
    if (cards.length <= 2 || cards.length % 2 !== 0 || !Cards.areDistinct(cards)) {
      return false;
    }

    const ranks = Cards.extractStandardCardRanks(cards);
    const minRank = Math.min(...ranks);
    const maxRank = Math.max(...ranks);
    const rankCounts = new Map<CardRank, number>();
    for (const r of ranks) {
      rankCounts.set(r, (rankCounts.get(r) || 0) + 1);
    }
    if (Cards.containsPhoenix(cards)) {
      if (ranks.length !== cards.length - 1) {
        return false;
      }

      let consumedPhoenix = false;
      for (let r = minRank; r <= maxRank; r++) {
        if ((rankCounts.get(r as CardRank) || 0) < 2) {
          if (consumedPhoenix) {
            return false;
          }
          consumedPhoenix = true;
        }
      }
    } else {
      if (ranks.length !== cards.length) {
        return false;
      }

      for (let r = minRank; r <= maxRank; r++) {
        if ((rankCounts.get(r as CardRank) || 0) < 2) {
          return false;
        }
      }
    }

    return true;
  }

  public length(): number {
    return this.maxRank - this.minRank + 1;
  }

  public canCoverUp(other: Trick | null): boolean {
    return other === null
      || (other instanceof ConsecutivePairsTrick && this.length() === other.length() && this.maxRank > other.maxRank);
  }

  public canFulfillWishAfter(wish: CardRank, hand: Card[]): boolean {
    return ConsecutivePairsTrick.canFulfillWish(wish, hand, this)
      || FourOfAKindTrick.canFulfillWish(wish, hand, null)
      || StraightFlushTrick.canFulfillWish(wish, hand, null);
  }

  public static canFulfillWish(wish: CardRank, hand: Card[], prevTrick: ConsecutivePairsTrick): boolean {
    const ranks = Cards.extractStandardCardRanks(hand);
    const rankCounts = new Map<CardRank, number>();
    for (const r of ranks) {
      rankCounts.set(r, (rankCounts.get(r) || 0) + 1);
    }
    if ((rankCounts.get(wish) || 0) === 0) {
      return false;
    }

    const hasPhoenix = Cards.containsPhoenix(hand);
    const length = prevTrick.length();

    for (let segStart = prevTrick.minRank + 1; segStart <= 15 - length; segStart++) {
      const segEnd = segStart + length - 1;
      if (wish < segStart || segEnd < wish) {
        continue;
      }

      let missing = 0;
      for (let r = segStart; r <= segEnd; r++) {
        const count = rankCounts.get(r as CardRank) || 0;
        if (count < 2) {
          missing += 2 - count;
        }
      }
      if (missing == 0 || (hasPhoenix && missing == 1)) {
        return true;
      }
    }

    return false;
  }
}

export class StraightTrick extends Trick {
  public readonly minRank: number;
  public readonly maxRank: number;
  public readonly phoenixRank: number | null;

  public constructor(playerIndex: PlayerIndex, cards: Card[]) {
    super(TrickType.STRAIGHT, playerIndex, cards);

    const ranks = Cards.extractStandardCardRanks(cards);
    const isSparrowUsed = Cards.containsSparrow(cards);
    if (Cards.containsPhoenix(cards)) {
      const start = isSparrowUsed ? 1 : Math.min(...ranks);
      const end = Math.max(...ranks);
      let missing: number | null = null;
      for (let r = isSparrowUsed ? 2 : start; r <= end; r++) {
        if (!ranks.some(r2 => r2 === r)) {
          missing = r;
          break;
        }
      }

      if (missing !== null) {
        this.minRank = start;
        this.maxRank = end;
        this.phoenixRank = missing;
      } else {
        if (end === 14) {
          this.minRank = start - 1;
          this.maxRank = 14;
          this.phoenixRank = this.minRank;
        } else {
          this.minRank = start;
          this.maxRank = end + 1;
          this.phoenixRank = this.maxRank;
        }
      }
    } else {
      this.minRank = isSparrowUsed ? 1 : Math.min(...ranks);
      this.maxRank = Math.max(...ranks);
      this.phoenixRank = null;
    }
  }

  public static isStraightTrick(cards: Card[]): boolean {
    if (cards.length < 5 || cards.length > 14 || !Cards.areDistinct(cards)) {
      return false;
    }

    const rankList = Cards.extractStandardCardRanks(cards);
    const rankSet = new Set(rankList);
    const minRank = Math.min(...rankList);
    const maxRank = Math.max(...rankList);

    if (Cards.containsPhoenix(cards)) {
      let start: number;
      if (Cards.containsSparrow(cards)) {
        if (rankList.length !== cards.length - 2) {
          return false;
        }
        start = 2;
      } else {
        if (rankList.length !== cards.length - 1) {
          return false;
        }
        start = minRank;
      }

      let consumedPhoenix = false;
      for (let r = start; r <= maxRank; r++) {
        if (!rankSet.has(r as CardRank)) {
          if (consumedPhoenix) {
            return false;
          }
          consumedPhoenix = true;
        }
      }
    } else {
      let start: number;
      if (Cards.containsSparrow(cards)) {
        if (rankList.length !== cards.length - 1) {
          return false;
        }
        start = 2;
      } else {
        if (rankList.length !== cards.length) {
          return false;
        }
        if (Cards.haveSameSuit(Cards.extractStandardCards(cards))) {
          return false;
        }
        start = minRank;
      }

      for (let r = start; r <= maxRank; r++) {
        if (!rankSet.has(r as CardRank)) {
          return false;
        }
      }
    }

    return true;
  }

  public length(): number {
    return this.maxRank - this.minRank + 1;
  }

  public canCoverUp(other: Trick | null): boolean {
    return other === null
      || (other instanceof StraightTrick && this.length() === other.length() && this.maxRank > other.maxRank);
  }

  public canFulfillWishAfter(wish: CardRank, hand: Card[]): boolean {
    return StraightTrick.canFulfillWish(wish, hand, this)
      || FourOfAKindTrick.canFulfillWish(wish, hand, null)
      || StraightFlushTrick.canFulfillWish(wish, hand, null);
  }

  public static canFulfillWish(wish: CardRank, hand: Card[], prevTrick: StraightTrick): boolean {
    const ranks = new Set(Cards.extractStandardCardRanks(hand));
    if (!ranks.has(wish)) {
      return false;
    }

    const hasPhoenix = Cards.containsPhoenix(hand);
    const length = prevTrick.length();

    for (let segStart = prevTrick.minRank + 1; segStart <= 15 - length; segStart++) {
      const segEnd = segStart + length - 1;
      if (wish < segStart || segEnd < wish) {
        continue;
      }

      let missing = 0;
      for (let r = segStart; r <= segEnd; r++) {
        if (!ranks.has(r as CardRank)) {
          missing++;
        }
      }
      if (missing === 0 || (hasPhoenix && missing === 1)) {
        return true;
      }
    }

    return false;
  }
}

export class DogTrick extends Trick {
  public constructor(playerIndex: PlayerIndex, cards: Card[]) {
    super(TrickType.DOG, playerIndex, cards);
  }

  public static isDogTrick(cards: Card[]): boolean {
    return cards.length === 1 && cards[0] instanceof DogCard;
  }

  public canCoverUp(other: Trick | null): boolean {
    return other === null;
  }

  public canFulfillWishAfter(_wish: CardRank, _hand: Cards): boolean {
    return false;
  }
}

export class FourOfAKindTrick extends Trick {
  public readonly rank: number;

  public constructor(playerIndex: PlayerIndex, cards: Card[]) {
    super(TrickType.FOUR_OF_A_KIND, playerIndex, cards);
    this.rank = Cards.extractStandardCards(cards)[0].rank;
  }

  public static isFourOfAKindTrick(cards: Card[]): boolean {
    if (cards.length !== 4 || !Cards.areDistinct(cards)) {
      return false;
    }

    const ranks = Cards.extractStandardCardRanks(cards);
    return ranks.length === 4 && ranks[0] === ranks[1] && ranks[1] === ranks[2] && ranks[2] === ranks[3];
  }

  public canCoverUp(other: Trick | null): boolean {
    if (other instanceof DogTrick || other instanceof StraightFlushTrick) {
      return false;
    } else if (other instanceof FourOfAKindTrick) {
      return this.rank > other.rank;
    } else {
      return true;
    }
  }

  public canFulfillWishAfter(wish: CardRank, hand: Card[]): boolean {
    return FourOfAKindTrick.canFulfillWish(wish, hand, this)
      || StraightFlushTrick.canFulfillWish(wish, hand, null);
  }

  public static canFulfillWish(wish: CardRank, hand: Card[], prevTrick: FourOfAKindTrick | null): boolean {
    if (prevTrick !== null && wish <= prevTrick.rank) {
      return false;
    }

    const wishCardCount = Cards.extractStandardCardRanks(hand).filter(r => r === wish).length;
    return wishCardCount >= 4;
  }
}

export class StraightFlushTrick extends Trick {
  public readonly minRank: number;
  public readonly maxRank: number;

  public constructor(playerIndex: PlayerIndex, cards: Card[]) {
    super(TrickType.STRAIGHT_FLUSH, playerIndex, cards);

    const ranks = Cards.extractStandardCardRanks(cards);
    this.minRank = Math.min(...ranks);
    this.maxRank = Math.max(...ranks);
  }

  public length(): number {
    return this.maxRank - this.minRank + 1;
  }

  public static isStraightFlushTrick(cards: Card[]): boolean {
    if (cards.length < 5 || cards.length > 13 || !Cards.areDistinct(cards)) {
      return false;
    }

    const standardCards = Cards.extractStandardCards(cards);
    if (standardCards.length !== cards.length || !Cards.haveSameSuit(standardCards)) {
      return false;
    }

    const ranks = new Set(standardCards.map(c => c.rank));
    const minRank = Math.min(...ranks);
    const maxRank = Math.max(...ranks);
    for (let r = minRank; r <= maxRank; r++) {
      if (!ranks.has(r as CardRank)) {
        return false;
      }
    }

    return true;
  }

  public canCoverUp(other: Trick | null): boolean {
    if (other instanceof DogTrick) {
      return false;
    } else if (other instanceof StraightFlushTrick) {
      return this.length() > other.length() || (this.length() === other.length() && this.maxRank > other.maxRank);
    } else {
      return true;
    }
  }

  public canFulfillWishAfter(wish: CardRank, hand: Card[]): boolean {
    return StraightFlushTrick.canFulfillWish(wish, hand, this);
  }

  public static canFulfillWish(wish: CardRank, hand: Card[], prevTrick: StraightFlushTrick | null): boolean {
    const standardCards = Cards.extractStandardCards(hand);
    const wishCards = standardCards.filter(card => card.rank === wish);
    for (let wishCard of wishCards) {
      const cardsInSameSuit = standardCards.filter(card => card.suit === wishCard.suit);
      const ranks = new Set(cardsInSameSuit.map(card => card.rank));

      let r = 2;
      while (r <= 14) {
        while (r <= 14 && !ranks.has(r as CardRank)) {
          r++;
        }
        if (r > 14) {
          break;
        }

        const segStart = r;
        if (wish < segStart) {
          break;
        }
        while (r <= 14 && ranks.has(r as CardRank)) {
          r++;
        }
        const segEnd = r - 1;
        const segLen = segEnd - segStart + 1;
        if (segLen < 5 || segEnd < wish) {
          continue;
        }

        if (prevTrick == null) {
          return true;
        } else if (segLen > prevTrick.length()) {
          return true;
        } else if (segLen === prevTrick.length() && segEnd > prevTrick.maxRank) {
          return true;
        }
      }
    }

    return false;
  }
}

export class TrickBuilder {
  private readonly playerIndex: PlayerIndex;
  private readonly cards: Card[];
  private readonly prevTrick: Trick | null;
  private trickType: TrickType | null;

  private constructor(playerIndex: PlayerIndex, cards: Card[], prevTrick: Trick | null) {
    this.playerIndex = playerIndex;
    this.cards = cards;
    this.prevTrick = prevTrick;
    this.trickType = null;
  }

  public build(): Trick | null {
    if (this.getType() === null) {
      return null;
    }

    switch (this.getType()) {
      case TrickType.SINGLE:
        return new SingleTrick(this.playerIndex, this.cards, this.prevTrick);
      case TrickType.PAIR:
        return new PairTrick(this.playerIndex, this.cards);
      case TrickType.THREE_OF_A_KIND:
        return new ThreeOfAKindTrick(this.playerIndex, this.cards);
      case TrickType.FULL_HOUSE:
        return new FullHouseTrick(this.playerIndex, this.cards);
      case TrickType.CONSECUTIVE_PAIRS:
        return new ConsecutivePairsTrick(this.playerIndex, this.cards);
      case TrickType.STRAIGHT:
        return new StraightTrick(this.playerIndex, this.cards);
      case TrickType.DOG:
        return new DogTrick(this.playerIndex, this.cards);
      case TrickType.FOUR_OF_A_KIND:
        return new FourOfAKindTrick(this.playerIndex, this.cards);
      case TrickType.STRAIGHT_FLUSH:
        return new StraightFlushTrick(this.playerIndex, this.cards);
      default:
        return null;
    }
  }

  private getType(): TrickType | null {
    if (this.trickType !== null) {
      return this.trickType;
    }

    if (this.cards.length === 0) {
      return null;
    } else if (this.cards.length === 1) {
      if (SingleTrick.isSingleTrick(this.cards)) {
        this.trickType = TrickType.SINGLE;
      } else if (DogTrick.isDogTrick(this.cards)) {
        this.trickType = TrickType.DOG;
      }
      return this.trickType;
    } else if (this.cards.length === 2) {
      if (PairTrick.isPairTrick(this.cards)) {
        this.trickType = TrickType.PAIR;
      }
      return this.trickType;
    } else if (this.cards.length === 3) {
      if (ThreeOfAKindTrick.isThreeOfAKindTrick(this.cards)) {
        this.trickType = TrickType.THREE_OF_A_KIND;
      }
      return this.trickType;
    } else {
      if (this.cards.length === 4) {
        if (FourOfAKindTrick.isFourOfAKindTrick(this.cards)) {
          this.trickType = TrickType.FOUR_OF_A_KIND;
          return this.trickType;
        }
      }
      if (this.cards.length === 5) {
        if (FullHouseTrick.isFullHouseTrick(this.cards)) {
          this.trickType = TrickType.FULL_HOUSE;
          return this.trickType;
        }
      }
      if (this.cards.length % 2 === 0) {
        if (ConsecutivePairsTrick.isConsecutivePairsTrick(this.cards)) {
          this.trickType = TrickType.CONSECUTIVE_PAIRS;
          return this.trickType;
        }
      }
      if (this.cards.length >= 5) {
        if (StraightTrick.isStraightTrick(this.cards)) {
          this.trickType = TrickType.STRAIGHT;
          return this.trickType;
        }
        if (StraightFlushTrick.isStraightFlushTrick(this.cards)) {
          this.trickType = TrickType.STRAIGHT_FLUSH;
          return this.trickType;
        }
      }
    }

    return null;
  }

  public static of(playerIndex: PlayerIndex, cards: Card[], prevTrick: Trick | null): TrickBuilder {
    return new TrickBuilder(playerIndex, cards, prevTrick);
  }
}
