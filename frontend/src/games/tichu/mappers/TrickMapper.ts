import { TrickDto } from "@/games/tichu/dtos/TrickDto.ts";
import {
  ConsecutivePairsTrick, DogTrick, FourOfAKindTrick,
  FullHouseTrick,
  PairTrick,
  SingleTrick, StraightFlushTrick, StraightTrick,
  ThreeOfAKindTrick,
  Trick,
  TrickType
} from "@/games/tichu/domain/Trick.ts";
import { CardMapper } from "@/games/tichu/mappers/CardMapper.ts";
import { CardRank, CardSuit, StandardCard } from "@/games/tichu/domain/Card.ts";

export class TrickMapper {
  static toTrick(trickDto: TrickDto): Trick {
    const cards = trickDto.cards.map(CardMapper.toCard);
    switch (trickDto.type) {
      case TrickType.SINGLE:
        if (trickDto.phoenixRank !== null) {
          const prevRank = trickDto.phoenixRank - 0.5 as CardRank;
          const dummyCard = new StandardCard(CardSuit.SPADE, prevRank);
          const dummyTrick = new SingleTrick(0, [dummyCard], null);
          return new SingleTrick(trickDto.playerIndex, cards, dummyTrick);
        } else {
          return new SingleTrick(trickDto.playerIndex, cards, null);
        }
      case TrickType.PAIR:
        return new PairTrick(trickDto.playerIndex, cards);
      case TrickType.THREE_OF_A_KIND:
        return new ThreeOfAKindTrick(trickDto.playerIndex, cards);
      case TrickType.FULL_HOUSE:
        return new FullHouseTrick(trickDto.playerIndex, cards);
      case TrickType.CONSECUTIVE_PAIRS:
        return new ConsecutivePairsTrick(trickDto.playerIndex, cards);
      case TrickType.STRAIGHT:
        return new StraightTrick(trickDto.playerIndex, cards);
      case TrickType.DOG:
        return new DogTrick(trickDto.playerIndex, cards);
      case TrickType.FOUR_OF_A_KIND:
        return new FourOfAKindTrick(trickDto.playerIndex, cards);
      case TrickType.STRAIGHT_FLUSH:
        return new StraightFlushTrick(trickDto.playerIndex, cards);
    }
  }
}
