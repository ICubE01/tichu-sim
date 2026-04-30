import {
  Card,
  CardType,
  DogCard,
  DragonCard,
  PhoenixCard,
  SparrowCard,
  StandardCard
} from "@/games/tichu/domain/Card.ts";
import { CardDto } from "@/games/tichu/dtos/CardDto.ts";

export class CardMapper {
  static toCard(cardDto: CardDto): Card {
    switch (cardDto.type) {
      case CardType.STANDARD:
        if (cardDto.suit === null || cardDto.rank === null) {
          throw new Error(`Invalid card: ${cardDto}`);
        }
        return new StandardCard(cardDto.suit, cardDto.rank);
      case CardType.SPARROW:
        return new SparrowCard();
      case CardType.PHOENIX:
        return new PhoenixCard();
      case CardType.DRAGON:
        return new DragonCard();
      case CardType.DOG:
        return new DogCard();
    }
  }

  static toDto(card: Card) : CardDto {
    if (card instanceof StandardCard) {
      return {
        type: CardType.STANDARD,
        suit: card.suit,
        rank: card.rank,
      };
    } else {
      return {
        type: card.type,
        suit: null,
        rank: null,
      }
    }
  }

  static toCardNullable(cardDto: CardDto | null) : Card | null {
    return cardDto ? CardMapper.toCard(cardDto) : null;
  }

  static toDtoNullable(card: Card | null) : CardDto | null {
    return card ? CardMapper.toDto(card) : null;
  }
}
