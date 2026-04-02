package com.icube.sim.tichu.games.tichu.tricks;

import com.icube.sim.tichu.games.tichu.cards.Card;
import com.icube.sim.tichu.games.tichu.cards.Cards;
import lombok.Getter;
import org.jspecify.annotations.Nullable;

import java.util.List;

@Getter
public class FourOfAKindTrick extends Trick {
    private final int rank;

    public FourOfAKindTrick(int playerIndex, List<Card> cards) {
        super(playerIndex, cards);
        assert isFourOfAKindTrick(cards);

        rank = Cards.extractStandardCardRanks(cards).getFirst();
    }

    public static boolean isFourOfAKindTrick(List<Card> cards) {
        if (cards.size() != 4 || !Cards.areDistinct(cards)) {
            return false;
        }

        var ranks = Cards.extractStandardCardRanks(cards);
        return ranks.size() == 4
                && ranks.get(0).equals(ranks.get(1))
                && ranks.get(1).equals(ranks.get(2))
                && ranks.get(2).equals(ranks.get(3));
    }

    @Override
    public TrickType getType() {
        return TrickType.FOUR_OF_A_KIND;
    }

    public boolean canCoverUp(FourOfAKindTrick other) {
        return rank > other.getRank();
    }

    @Override
    public boolean canCoverUp(Trick other) {
        if (other instanceof DogTrick || other instanceof StraightFlushTrick) {
            return false;
        } else if (other instanceof FourOfAKindTrick other1) {
            return canCoverUp(other1);
        } else {
            return true;
        }
    }

    @Override
    public boolean canPlayWishCardAfter(int wish, List<Card> hand) {
        return canPlayWishCard(wish, hand, this)
                || StraightFlushTrick.canPlayWishCard(wish, hand, null);
    }

    public static boolean canPlayWishCard(int wish, List<Card> hand, @Nullable FourOfAKindTrick prevTrick) {
        if (prevTrick != null && wish <= prevTrick.getRank()) {
            return false;
        }

        var wishCardCount = Cards.extractStandardCardRanks(hand).stream().filter(r -> r == wish).count();
        return wishCardCount >= 4;
    }
}
