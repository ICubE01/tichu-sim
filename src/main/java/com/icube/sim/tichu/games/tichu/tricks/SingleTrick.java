package com.icube.sim.tichu.games.tichu.tricks;

import com.icube.sim.tichu.games.tichu.cards.*;
import lombok.Getter;
import org.jspecify.annotations.Nullable;

import java.util.List;

@Getter
public class SingleTrick extends Trick {
    private final float rank;
    private final boolean isPhoenixUsed;

    public SingleTrick(int playerIndex, List<Card> cards, @Nullable Trick prevTrick) {
        super(playerIndex, cards);
        assert isSingleTrick(cards);

        switch (cards.getFirst()) {
            case StandardCard standardCard -> {
                rank = standardCard.rank();
                isPhoenixUsed = false;
            }
            case SparrowCard ignored -> {
                rank = 1;
                isPhoenixUsed = false;
            }
            case PhoenixCard ignored -> {
                isPhoenixUsed = true;
                if (prevTrick == null) {
                    rank = 1.5f;
                } else if (prevTrick instanceof SingleTrick prevSingleTrick) {
                    if (prevSingleTrick.getCard() instanceof DragonCard) {
                        rank = 0;
                    } else {
                        rank = prevSingleTrick.getRank() + 0.5f;
                    }
                } else {
                    rank = 0;
                }
            }
            case DragonCard ignored -> {
                rank = 20;
                isPhoenixUsed = false;
            }
            case null, default -> throw new IllegalArgumentException();
        }
    }

    public static boolean isSingleTrick(List<Card> cards) {
        return cards.size() == 1 && !(cards.getFirst() instanceof DogCard);
    }

    public Card getCard() {
        return cards.getFirst();
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
