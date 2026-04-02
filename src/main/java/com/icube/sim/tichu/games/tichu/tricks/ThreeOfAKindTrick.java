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
        assert isThreeOfAKindTrick(cards);

        rank = Cards.extractStandardCardRanks(cards).getFirst();
        isPhoenixUsed = Cards.containsPhoenix(cards);
    }

    public static boolean isThreeOfAKindTrick(List<Card> cards) {
        if (cards.size() != 3 || !Cards.areDistinct(cards)) {
            return false;
        }

        var ranks = Cards.extractStandardCardRanks(cards);
        if (Cards.containsPhoenix(cards)) {
            return ranks.size() == 2 && ranks.get(0).equals(ranks.get(1));
        } else {
            return ranks.size() == 3 && ranks.get(0).equals(ranks.get(1)) && ranks.get(1).equals(ranks.get(2));
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

        var wishCardCount = Cards.extractStandardCardRanks(hand).stream().filter(r -> r == wish).count();
        return (Cards.containsPhoenix(hand) && wishCardCount >= 2) || wishCardCount >= 3;
    }
}
