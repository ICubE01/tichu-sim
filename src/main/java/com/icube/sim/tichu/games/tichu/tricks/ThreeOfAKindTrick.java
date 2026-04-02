package com.icube.sim.tichu.games.tichu.tricks;

import com.icube.sim.tichu.games.tichu.cards.Card;
import com.icube.sim.tichu.games.tichu.cards.Cards;
import lombok.Getter;

import java.util.List;

@Getter
public class ThreeOfAKindTrick extends Trick {
    private final int rank;
    private final boolean isPhoenixUsed;

    public ThreeOfAKindTrick(int playerIndex, List<Card> cards) {
        super(playerIndex, cards);

        assert cards.size() == 3;
        assert Cards.areDistinct(cards);

        isPhoenixUsed = Cards.containsPhoenix(cards);
        var standardCards = Cards.extractStandardCards(cards);
        if (isPhoenixUsed) {
            assert standardCards.size() == 2;
            assert standardCards.get(0).rank() == standardCards.get(1).rank();
        } else {
            assert standardCards.size() == 3;
            assert standardCards.get(0).rank() == standardCards.get(1).rank();
            assert standardCards.get(1).rank() == standardCards.get(2).rank();
        }
        rank = standardCards.get(0).rank();
    }

    public static boolean isThreeOfAKindTrick(List<Card> cards) {
        if (cards.size() != 3 || !Cards.areDistinct(cards)) {
            return false;
        }

        var standardCards = Cards.extractStandardCards(cards);
        if (Cards.containsPhoenix(cards)) {
            return standardCards.size() == 2
                    && standardCards.get(0).rank() == standardCards.get(1).rank();
        } else {
            return standardCards.size() == 3
                    && standardCards.get(0).rank() == standardCards.get(1).rank()
                    && standardCards.get(1).rank() == standardCards.get(2).rank();
        }
    }

    @Override
    public TrickType getType() {
        return TrickType.THREE_OF_A_KIND;
    }

    public boolean canCoverUp(ThreeOfAKindTrick other) {
        return rank > other.getRank();
    }

    @Override
    public boolean canCoverUp(Trick other) {
        return other == null || (other instanceof ThreeOfAKindTrick other1 && canCoverUp(other1));
    }

    @Override
    public boolean canPlayWishCardAfter(int wish, List<Card> hand) {
        return canPlayWishCard(wish, hand, this)
                || FourOfAKindTrick.canPlayWishCard(wish, hand, null)
                || StraightFlushTrick.canPlayWishCard(wish, hand, null);
    }

    private static boolean canPlayWishCard(int wish, List<Card> hand, ThreeOfAKindTrick prevTrick) {
        if (wish <= prevTrick.getRank()) {
            return false;
        }
        var wishCardCount = Cards.extractStandardCards(hand).stream()
                .filter(card -> card.rank() == wish)
                .count();
        return (Cards.containsPhoenix(hand) && wishCardCount >= 2)
                || wishCardCount >= 3;
    }
}
