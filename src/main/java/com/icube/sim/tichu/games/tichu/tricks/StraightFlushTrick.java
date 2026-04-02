package com.icube.sim.tichu.games.tichu.tricks;

import com.icube.sim.tichu.games.tichu.cards.Card;
import com.icube.sim.tichu.games.tichu.cards.Cards;
import com.icube.sim.tichu.games.tichu.cards.StandardCard;
import lombok.Getter;
import org.jspecify.annotations.Nullable;

import java.util.List;
import java.util.stream.Collectors;

@Getter
public class StraightFlushTrick extends Trick {
    private final int minRank;
    private final int maxRank;

    protected StraightFlushTrick(int playerIndex, List<Card> cards) {
        super(playerIndex, cards);

        assert cards.size() >= 5 && cards.size() <= 13;
        assert Cards.areDistinct(cards);

        var standardCards = Cards.sortedCards(Cards.extractStandardCards(cards));
        assert standardCards.size() == cards.size();

        var expectedSuit = standardCards.getFirst().suit();
        var expectedRank = standardCards.getFirst().rank();
        for (var card : standardCards) {
            assert card.suit() == expectedSuit;
            assert card.rank() == expectedRank;
            expectedRank++;
        }

        minRank = standardCards.getFirst().rank();
        maxRank = standardCards.getLast().rank();
    }

    public static boolean isStraightFlushTrick(List<Card> cards) {
        if (cards.size() < 5 || cards.size() > 13 || !Cards.areDistinct(cards)) {
            return false;
        }

        var standardCards = Cards.sortedCards(Cards.extractStandardCards(cards));
        if (standardCards.size() != cards.size()) {
            return false;
        }

        var expectedSuit = standardCards.getFirst().suit();
        var expectedRank = standardCards.getFirst().rank();
        for (var card : standardCards) {
            if (card.suit() != expectedSuit || card.rank() != expectedRank) {
                return false;
            }
            expectedRank++;
        }

        return true;
    }

    @Override
    public TrickType getType() {
        return TrickType.STRAIGHT_FLUSH;
    }

    public int length() {
        return maxRank - minRank + 1;
    }

    public boolean canCoverUp(StraightFlushTrick other) {
        return length() > other.length() || (length() == other.length() && maxRank > other.maxRank);
    }

    @Override
    public boolean canCoverUp(Trick other) {
        if (other instanceof DogTrick) {
            return false;
        } else if (other instanceof StraightFlushTrick other1) {
            return canCoverUp(other1);
        } else {
            return true;
        }
    }

    @Override
    public boolean canPlayWishCardAfter(int wish, List<Card> hand) {
        return canPlayWishCard(wish, hand, this);
    }

    public static boolean canPlayWishCard(int wish, List<Card> hand, @Nullable StraightFlushTrick prevTrick) {
        var standardCards = Cards.extractStandardCards(hand);
        var wishCards = standardCards.stream().filter(card -> card.rank() == wish).toList();
        for (var wishCard : wishCards) {
            var cardsInSameSuit = standardCards.stream().filter(card -> card.suit() == wishCard.suit());
            var ranks = cardsInSameSuit.map(StandardCard::rank).collect(Collectors.toSet());

            var r = 2;
            while (r <= 14) {
                while (r <= 14 && !ranks.contains(r)) {
                    r++;
                }
                if (r > 14) {
                    break;
                }

                var segStart = r;
                if (wish < segStart) {
                    break;
                }
                while (r <= 14 && ranks.contains(r)) {
                    r++;
                }
                int segEnd = r - 1;
                int segLen = segEnd - segStart + 1;
                if (segLen < 5 || segEnd < wish) {
                    continue;
                }

                if (prevTrick == null) {
                    return true;
                } else if (segLen > prevTrick.length()) {
                    return true;
                } else if (segLen == prevTrick.length() && segEnd > prevTrick.getMaxRank()) {
                    return true;
                }
            }
        }

        return false;
    }
}
