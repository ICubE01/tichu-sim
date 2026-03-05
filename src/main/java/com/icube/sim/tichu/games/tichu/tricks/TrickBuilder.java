package com.icube.sim.tichu.games.tichu.tricks;

import com.icube.sim.tichu.games.tichu.cards.Card;
import com.icube.sim.tichu.games.tichu.cards.Cards;
import com.icube.sim.tichu.games.tichu.cards.DogCard;
import org.jspecify.annotations.Nullable;

import java.util.List;

public class TrickBuilder {
    private final int playerIndex;
    private final List<Card> cards;
    @Nullable
    private final Trick prevTrick;
    @Nullable
    private TrickType trickType;

    private TrickBuilder(int playerIndex, List<Card> cards, @Nullable Trick prevTrick) {
        assert !cards.isEmpty() && Cards.areDistinct(cards);

        this.playerIndex = playerIndex;
        this.cards = cards;
        this.prevTrick = prevTrick;
        this.trickType = null;
    }

    public @Nullable Trick build() {
        if (getType() == null) {
            return null;
        }

        return switch (getType()) {
            case SINGLE -> new SingleTrick(playerIndex, cards, prevTrick);
            case PAIR -> new PairTrick(playerIndex, cards);
            case CONSECUTIVE_PAIRS -> new ConsecutivePairsTrick(playerIndex, cards);
            case THREE_OF_A_KIND -> new ThreeOfAKindTrick(playerIndex, cards);
            case FULL_HOUSE -> new FullHouseTrick(playerIndex, cards);
            case STRAIGHT -> new StraightTrick(playerIndex, cards);
            case DOG -> new DogTrick(playerIndex, cards);
            case FOUR_OF_A_KIND -> new FourOfAKindTrick(playerIndex, cards);
            case STRAIGHT_FLUSH -> new StraightFlushTrick(playerIndex, cards);
        };
    }

    private @Nullable TrickType getType() {
        if (trickType != null) {
            return trickType;
        }

        if (cards.size() == 1) {
            var card = cards.getFirst();
            if (card instanceof DogCard) {
                trickType = TrickType.DOG;
            } else if (prevTrick == null || prevTrick.getType() == TrickType.SINGLE) {
                trickType = TrickType.SINGLE;
            }
            return trickType;
        } else if (cards.size() == 2) {
            if (PairTrick.isPairTrick(cards)) {
                trickType = TrickType.PAIR;
            }
            return trickType;
        } else if (cards.size() == 3) {
            if (ThreeOfAKindTrick.isThreeOfAKindTrick(cards)) {
                trickType = TrickType.THREE_OF_A_KIND;
            }
            return trickType;
        } else {
            if (cards.size() == 4) {
                if (FourOfAKindTrick.isFourOfAKindTrick(cards)) {
                    trickType = TrickType.FOUR_OF_A_KIND;
                    return trickType;
                }
            }
            if (cards.size() == 5) {
                if (FullHouseTrick.isFullHouseTrick(cards)) {
                    trickType = TrickType.FULL_HOUSE;
                    return trickType;
                }
            }
            if (cards.size() % 2 == 0) {
                if (ConsecutivePairsTrick.isConsecutivePairsTrick(cards)) {
                    trickType = TrickType.CONSECUTIVE_PAIRS;
                    return trickType;
                }
            }
            if (cards.size() >= 5) {
                if (StraightTrick.isStraightTrick(cards)) {
                    trickType = TrickType.STRAIGHT;
                    return trickType;
                }
                if (StraightFlushTrick.isStraightFlushTrick(cards)) {
                    trickType = TrickType.STRAIGHT_FLUSH;
                    return trickType;
                }
            }
        }

        return null;
    }

    public static TrickBuilder of(int playerIndex, List<Card> cards, @Nullable Trick prevTrick) {
        return new TrickBuilder(playerIndex, cards, prevTrick);
    }
}
