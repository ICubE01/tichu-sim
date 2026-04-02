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

        assert cards.size() == 4;
        assert Cards.areDistinct(cards);

        var standardCards = Cards.extractStandardCards(cards);
        assert standardCards.size() == 4;
        assert standardCards.get(0).rank() == standardCards.get(1).rank();
        assert standardCards.get(1).rank() == standardCards.get(2).rank();
        assert standardCards.get(2).rank() == standardCards.get(3).rank();

        rank = standardCards.get(0).rank();
    }

    public static boolean isFourOfAKindTrick(List<Card> cards) {
        if (cards.size() != 4 || !Cards.areDistinct(cards)) {
            return false;
        }

        var standardCards = Cards.extractStandardCards(cards);
        return standardCards.size() == 4
                && standardCards.get(0).rank() == standardCards.get(1).rank()
                && standardCards.get(1).rank() == standardCards.get(2).rank()
                && standardCards.get(2).rank() == standardCards.get(3).rank();
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
        var wishCardCount = Cards.extractStandardCards(hand).stream()
                .filter(card -> card.rank() == wish)
                .count();
        return wishCardCount == 4;
    }
}
