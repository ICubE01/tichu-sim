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
        assert isPairTrick(cards);

        rank = Cards.extractStandardCardRanks(cards).getFirst();
        isPhoenixUsed = Cards.containsPhoenix(cards);
    }

    public static boolean isPairTrick(List<Card> cards) {
        if (cards.size() != 2 || !Cards.areDistinct(cards)) {
            return false;
        }

        var ranks = Cards.extractStandardCardRanks(cards);
        if (Cards.containsPhoenix(cards)) {
            return ranks.size() == 1;
        } else {
            return ranks.size() == 2 && ranks.get(0).equals(ranks.get(1));
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

        var wishCardCount = Cards.extractStandardCardRanks(hand).stream().filter(r -> r == wish).count();
        return (Cards.containsPhoenix(hand) && wishCardCount >= 1) || wishCardCount >= 2;
    }
}
