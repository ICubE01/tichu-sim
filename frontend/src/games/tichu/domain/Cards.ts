import { Card, CardRank, CardType, StandardCard } from "@/games/tichu/domain/Card.ts";
export class Cards {
  static areDistinct(cards: Card[]): boolean {
    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        if (cards[i].equals(cards[j])) {
          return false;
        }
      }
    }
    return true;
  }

  static containsPhoenix(cards: Card[]): boolean {
    return cards.some(c => c.type === CardType.PHOENIX);
  }

  static containsSparrow(cards: Card[]): boolean {
    return cards.some(c => c.type === CardType.SPARROW);
  }

  static extractStandardCardRanks(cards: Card[]): CardRank[] {
    return cards.filter(c => c instanceof StandardCard).map(c => c.rank);
  }

  static extractStandardCards(cards: Card[]): StandardCard[] {
    return cards.filter(c => c instanceof StandardCard);
  }

  static haveSameSuit(cards: StandardCard[]): boolean {
    console.assert(cards.length != 0);
    return cards.every(c => c.suit === cards[0].suit);
  }

  static containsWishCard(cards: Card[], wish: CardRank): boolean {
    return Cards.extractStandardCards(cards).some(c => c.rank === wish);
  }
}
