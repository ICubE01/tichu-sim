package com.icube.sim.tichu.games.tichu.tricks;

import com.icube.sim.tichu.games.tichu.cards.*;
import lombok.Getter;
import org.jspecify.annotations.Nullable;

import java.util.List;

@Getter
public class SingleTrick extends Trick {
    private final float rank;

    public SingleTrick(int playerIndex, List<Card> cards, @Nullable Trick prevTrick) {
        super(playerIndex, cards);

        assert cards.size() == 1;
        assert (prevTrick == null || prevTrick instanceof SingleTrick);

        var card = cards.get(0);

        if (card instanceof StandardCard standardCard) {
            rank = standardCard.rank();
        } else if (card instanceof SparrowCard) {
            rank = 1;
        } else if (card instanceof PhoenixCard) {
            if (prevTrick == null) {
                rank = 1.5f;
            } else {
                rank = Math.min(((SingleTrick) prevTrick).getRank() + 0.5f, 15);
            }
        } else if (card instanceof DragonCard) {
            rank = 20;
        } else {
            throw new AssertionError();
        }
    }

    public Card getCard() {
        return cards.get(0);
    }

    @Override
    public TrickType getType() {
        return TrickType.SINGLE;
    }

    public boolean canCoverUp(SingleTrick other) {
        return rank > other.getRank();
    }

    @Override
    public boolean canCoverUp(@Nullable Trick other) {
        return other == null || (other instanceof SingleTrick other1 && canCoverUp(other1));
    }

    @Override
    public boolean canPlayWishCardAfter(int wish, List<Card> hand) {
        return canPlayWishCard(wish, hand, this)
                || FourOfAKindTrick.canPlayWishCard(wish, hand, null)
                || StraightFlushTrick.canPlayWishCard(wish, hand, null);
    }

    private static boolean canPlayWishCard(int wish, List<Card> hand, SingleTrick prevTrick) {
        return wish > prevTrick.getRank() && Cards.containsWishCard(hand, wish);
    }
}
