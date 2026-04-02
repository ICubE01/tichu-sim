package com.icube.sim.tichu.games.tichu.tricks;

import com.icube.sim.tichu.games.tichu.cards.*;
import lombok.Getter;

import java.util.List;

@Getter
public class PairTrick extends Trick {
    private final int rank;
    private final boolean isPhoenixUsed;

    public PairTrick(int playerIndex, List<Card> cards) {
        super(playerIndex, cards);

        assert cards.size() == 2;
        assert Cards.areDistinct(cards);

        var standardCards = Cards.extractStandardCards(cards);
        isPhoenixUsed = Cards.containsPhoenix(cards);
        if (isPhoenixUsed) {
            assert standardCards.size() == 1;
        } else {
            assert standardCards.size() == 2;
            assert standardCards.get(0).rank() == standardCards.get(1).rank();
        }

        rank = standardCards.get(0).rank();
    }

    public static boolean isPairTrick(List<Card> cards) {
        if (cards.size() != 2 || !Cards.areDistinct(cards)) {
            return false;
        }

        var standardCards = Cards.extractStandardCards(cards);
        if (Cards.containsPhoenix(cards)) {
            return standardCards.size() == 1;
        } else {
            return standardCards.size() == 2 && standardCards.get(0).rank() == standardCards.get(1).rank();
        }
    }

    @Override
    public TrickType getType() {
        return TrickType.PAIR;
    }

    public boolean canCoverUp(PairTrick other) {
        return rank > other.getRank();
    }

    @Override
    public boolean canCoverUp(Trick other) {
        return other == null || (other instanceof PairTrick other1 && canCoverUp(other1));
    }

    @Override
    public boolean canPlayWishCardAfter(int wish, List<Card> hand) {
        return canPlayWishCard(wish, hand, this)
                || FourOfAKindTrick.canPlayWishCard(wish, hand, null)
                || StraightFlushTrick.canPlayWishCard(wish, hand, null);
    }

    private static boolean canPlayWishCard(int wish, List<Card> hand, PairTrick prevTrick) {
        if (wish <= prevTrick.getRank()) {
            return false;
        }
        var wishCardCount = Cards.extractStandardCards(hand).stream()
                .filter(card -> card.rank() == wish)
                .count();
        return (Cards.containsPhoenix(hand) && wishCardCount >= 1)
                || wishCardCount >= 2;
    }
}
