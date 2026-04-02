package com.icube.sim.tichu.games.tichu.tricks;

import com.icube.sim.tichu.games.tichu.cards.Card;
import com.icube.sim.tichu.games.tichu.cards.Cards;
import com.icube.sim.tichu.games.tichu.cards.StandardCard;
import lombok.Getter;
import org.jspecify.annotations.Nullable;

import java.util.List;
import java.util.stream.Collectors;

@Getter
public class StraightTrick extends Trick {
    private final int minRank;
    private final int maxRank;
    private final boolean isPhoenixUsed;

    public StraightTrick(int playerIndex, List<Card> cards) {
        super(playerIndex, cards);

        assert cards.size() >= 5 && cards.size() <= 14;
        assert Cards.areDistinct(cards);

        isPhoenixUsed = Cards.containsPhoenix(cards);
        var isSparrowUsed = Cards.containsSparrow(cards);
        var standardCards = Cards.sortedCards(Cards.extractStandardCards(cards));
        if (isPhoenixUsed) {
            if (isSparrowUsed) {
                // e.g. 12P45 or 1234P
                assert standardCards.size() == cards.size() - 2;
                var expectedRank = 2;
                var usedPhoenix = false;
                for (var card : standardCards) {
                    if (card.rank() == expectedRank) {
                        expectedRank++;
                    } else {
                        assert !usedPhoenix;
                        assert card.rank() == expectedRank + 1;
                        expectedRank += 2;
                        usedPhoenix = true;
                    }
                }

                minRank = 1;
                if (usedPhoenix) {
                    maxRank = standardCards.getLast().rank();
                } else {
                    maxRank = standardCards.getLast().rank() + 1;
                }
            } else {
                // e.g. 23P56 or 2345P or PJQKA
                assert standardCards.size() == cards.size() - 1;
                var expectedRank = standardCards.getFirst().rank();
                var usedPhoenix = false;
                for (var card : standardCards) {
                    if (card.rank() == expectedRank) {
                        expectedRank++;
                    } else {
                        assert !usedPhoenix;
                        assert card.rank() == expectedRank + 1;
                        expectedRank += 2;
                        usedPhoenix = true;
                    }
                }

                if (usedPhoenix) {
                    minRank = standardCards.getFirst().rank();
                    maxRank = standardCards.getLast().rank();
                } else {
                    if (standardCards.getLast().rank() == 14) {
                        minRank = standardCards.getFirst().rank() - 1;
                        maxRank = 14;
                    } else {
                        minRank = standardCards.getLast().rank();
                        maxRank = standardCards.getLast().rank() + 1;
                    }
                }
            }
        } else {
            if (isSparrowUsed) {
                // e.g. 12345
                assert standardCards.size() == cards.size() - 1;
                var expectedRank = 2;
                for (var card : standardCards) {
                    assert card.rank() == expectedRank;
                    expectedRank++;
                }

                minRank = 1;
            } else {
                // e.g. 23456
                assert standardCards.size() == cards.size();
                var expectedRank = standardCards.getFirst().rank();
                for (var card : standardCards) {
                    assert card.rank() == expectedRank;
                    expectedRank++;
                }

                // Reject straight flush
                assert !Cards.haveSameSuit(standardCards);

                minRank = standardCards.getFirst().rank();
            }

            maxRank = standardCards.getLast().rank();
        }
    }

    public static boolean isStraightTrick(List<Card> cards) {
        if (cards.size() < 5 || cards.size() > 14 || !Cards.areDistinct(cards)) {
            return false;
        }

        var standardCards = Cards.sortedCards(Cards.extractStandardCards(cards));
        if (Cards.containsPhoenix(cards)) {
            if (Cards.containsSparrow(cards)) {
                // e.g. 12P45 or 1234P
                if (standardCards.size() != cards.size() - 2) {
                    return false;
                }

                var expectedRank = 2;
                var usedPhoenix = false;
                for (var card : standardCards) {
                    if (card.rank() == expectedRank) {
                        expectedRank++;
                    } else {
                        if (usedPhoenix || card.rank() != expectedRank + 1) {
                            return false;
                        }
                        expectedRank += 2;
                        usedPhoenix = true;
                    }
                }
            } else {
                // e.g. 23P56 or 2345P or PJQKA
                if (standardCards.size() != cards.size() - 1) {
                    return false;
                }

                var expectedRank = standardCards.getFirst().rank();
                var usedPhoenix = false;
                for (var card : standardCards) {
                    if (card.rank() == expectedRank) {
                        expectedRank++;
                    } else {
                        if (usedPhoenix || card.rank() != expectedRank + 1) {
                            return false;
                        }
                        expectedRank += 2;
                        usedPhoenix = true;
                    }
                }
            }
        } else {
            if (Cards.containsSparrow(cards)) {
                // e.g. 12345
                if (standardCards.size() != cards.size() - 1) {
                    return false;
                }

                var expectedRank = 2;
                for (var card : standardCards) {
                    if (expectedRank != card.rank()) {
                        return false;
                    }
                    expectedRank++;
                }
            } else {
                // e.g. 23456
                if (standardCards.size() != cards.size()) {
                    return false;
                }

                var expectedRank = standardCards.getFirst().rank();
                for (var card : standardCards) {
                    if (card.rank() != expectedRank) {
                        return false;
                    }
                    expectedRank++;
                }

                // Reject straight flush
                if (Cards.haveSameSuit(standardCards)) {
                    return false;
                }
            }
        }

        return true;
    }

    @Override
    public TrickType getType() {
        return TrickType.STRAIGHT;
    }

    public int length() {
        return maxRank - minRank + 1;
    }

    public boolean canCoverUp(StraightTrick other) {
        return length() == other.length() && maxRank > other.maxRank;
    }

    @Override
    public boolean canCoverUp(@Nullable Trick other) {
        return other == null || (other instanceof StraightTrick other1 && canCoverUp(other1));
    }

    @Override
    public boolean canPlayWishCardAfter(int wish, List<Card> hand) {
        return canPlayWishCard(wish, hand, this)
                || FourOfAKindTrick.canPlayWishCard(wish, hand, null)
                || StraightFlushTrick.canPlayWishCard(wish, hand, null);
    }

    private static boolean canPlayWishCard(int wish, List<Card> hand, StraightTrick prevTrick) {
        var ranks = Cards.extractStandardCards(hand).stream()
                .map(StandardCard::rank)
                .collect(Collectors.toSet());
        if (!ranks.contains(wish)) {
            return false;
        }

        var hasPhoenix = Cards.containsPhoenix(hand);
        var length = prevTrick.length();

        for (var segStart = prevTrick.getMinRank() + 1; segStart <= 15 - length; segStart++) {
            var segEnd = segStart + length - 1;
            if (wish < segStart || segEnd < wish) {
                continue;
            }

            var missing = 0;
            for (var r = segStart; r <= segEnd; r++) {
                if (!ranks.contains(r)) {
                    missing++;
                }
            }
            if (missing == 0 || (hasPhoenix && missing == 1)) {
                return true;
            }
        }

        return false;
    }
}
