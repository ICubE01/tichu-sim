package com.icube.sim.tichu.games.tichu.tricks;

import com.icube.sim.tichu.games.tichu.cards.Card;
import com.icube.sim.tichu.games.tichu.cards.Cards;
import com.icube.sim.tichu.games.tichu.cards.StandardCard;
import lombok.Getter;
import org.jspecify.annotations.Nullable;

import java.util.List;
import java.util.stream.Collectors;

@Getter
public class ConsecutivePairsTrick extends Trick {
    private final int minRank;
    private final int maxRank;
    private final boolean isPhoenixUsed;

    public ConsecutivePairsTrick(int playerIndex, List<Card> cards) {
        super(playerIndex, cards);

        assert cards.size() > 2 && cards.size() % 2 == 0;
        assert Cards.areDistinct(cards);

        isPhoenixUsed = Cards.containsPhoenix(cards);
        var standardCards = Cards.sortedCards(Cards.extractStandardCards(cards));
        if (isPhoenixUsed) {
            // e.g. 22P344
            assert standardCards.size() == cards.size() - 1;
            var expectedRank = standardCards.getFirst().rank();
            var count = 0;
            var usedPhoenix = false;
            for (var card : standardCards) {
                if (count == 0) {
                    assert card.rank() == expectedRank;
                    count = 1;
                } else {
                    if (card.rank() == expectedRank) {
                        expectedRank++;
                        count = 0;
                    } else {
                        assert !usedPhoenix;
                        assert card.rank() == expectedRank + 1;
                        expectedRank++;
                        usedPhoenix = true;
                    }
                }
            }
        } else {
            // e.g. 223344
            assert standardCards.size() == cards.size();
            var expectedRank = standardCards.getFirst().rank();
            var count = 0;
            for (var card : standardCards) {
                assert card.rank() == expectedRank;
                if (count == 0) {
                    count = 1;
                } else {
                    expectedRank++;
                    count = 0;
                }
            }

        }

        minRank = standardCards.getFirst().rank();
        maxRank = standardCards.getLast().rank();
    }

    public static boolean isConsecutivePairsTrick(List<Card> cards) {
        if (cards.size() <= 2 || cards.size() % 2 != 0 || !Cards.areDistinct(cards)) {
            return false;
        }

        var standardCards = Cards.sortedCards(Cards.extractStandardCards(cards));
        if (Cards.containsPhoenix(cards)) {
            // e.g. 22P344
            if (standardCards.size() != cards.size() - 1) {
                return false;
            }

            var expectedRank = standardCards.getFirst().rank();
            var count = 0;
            var usedPhoenix = false;
            for (var card : standardCards) {
                if (count == 0) {
                    if (card.rank() != expectedRank) {
                        return false;
                    }
                    count = 1;
                } else {
                    if (card.rank() == expectedRank) {
                        expectedRank++;
                        count = 0;
                    } else {
                        if (usedPhoenix || card.rank() != expectedRank + 1) {
                            return false;
                        }
                        expectedRank++;
                        usedPhoenix = true;
                    }
                }
            }
        } else {
            // e.g. 223344
            if (standardCards.size() != cards.size()) {
                return false;
            }

            var expectedRank = standardCards.getFirst().rank();
            var count = 0;
            for (var card : standardCards) {
                if (card.rank() != expectedRank) {
                    return false;
                }

                if (count == 0) {
                    count = 1;
                } else {
                    expectedRank++;
                    count = 0;
                }
            }
        }

        return true;
    }

    @Override
    public TrickType getType() {
        return TrickType.CONSECUTIVE_PAIRS;
    }

    public int length() {
        return maxRank - minRank + 1;
    }

    public boolean canCoverUp(ConsecutivePairsTrick other) {
        return length() == other.length() && maxRank > other.maxRank;
    }

    @Override
    public boolean canCoverUp(@Nullable Trick other) {
        return other == null || (other instanceof ConsecutivePairsTrick other1 && canCoverUp(other1));
    }

    @Override
    public boolean canPlayWishCardAfter(int wish, List<Card> hand) {
        return canPlayWishCard(wish, hand, this)
                || FourOfAKindTrick.canPlayWishCard(wish, hand, null)
                || StraightFlushTrick.canPlayWishCard(wish, hand, null);
    }

    private static boolean canPlayWishCard(int wish, List<Card> hand, ConsecutivePairsTrick prevTrick) {
        var cardCounts = Cards.extractStandardCards(hand).stream()
                .collect(Collectors.groupingBy(StandardCard::rank, Collectors.counting()));
        if (cardCounts.getOrDefault(wish, 0L) == 0L) {
            return false;
        }

        var hasPhoenix = Cards.containsPhoenix(hand);
        var length = prevTrick.length();

        for (var segStart = prevTrick.getMinRank() + 1; segStart <= 15 - length; segStart++) {
            var segEnd = segStart + length - 1;
            if (wish < segStart || segEnd < wish) {
                continue;
            }

            var missing = 0L;
            for (var r = segStart; r <= segEnd; r++) {
                long count = cardCounts.getOrDefault(r, 0L);
                if (count < 2) {
                    missing += 2 - count;
                }
            }
            if (missing == 0 || (hasPhoenix && missing == 1)) {
                return true;
            }
        }

        return false;
    }
}
