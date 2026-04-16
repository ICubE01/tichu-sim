package com.icube.sim.tichu.games.tichu.tricks;

import com.icube.sim.tichu.games.tichu.cards.Card;
import com.icube.sim.tichu.games.tichu.cards.Cards;
import lombok.Getter;
import org.jspecify.annotations.Nullable;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.stream.IntStream;

@Getter
public class StraightTrick extends Trick {
    private final int minRank;
    private final int maxRank;
    private final @Nullable Integer phoenixRank;

    public StraightTrick(int playerIndex, List<Card> cards) {
        super(playerIndex, cards);
        assert isStraightTrick(cards);

        var ranks = new HashSet<>(Cards.extractStandardCardRanks(cards));
        var isSparrowUsed = Cards.containsSparrow(cards);
        if (Cards.containsPhoenix(cards)) {
            var start = isSparrowUsed ? 1 : Collections.min(ranks);
            var missing = IntStream.rangeClosed(isSparrowUsed ? 2 : start, Collections.max(ranks))
                    .filter(r -> !ranks.contains(r))
                    .findAny();
            if (missing.isPresent()) {
                minRank = start;
                maxRank = Collections.max(ranks);
                phoenixRank = missing.getAsInt();
            } else {
                if (Collections.max(ranks) == 14) {
                    minRank = start - 1;
                    maxRank = 14;
                    phoenixRank = minRank;
                } else {
                    minRank = start;
                    maxRank = Collections.max(ranks) + 1;
                    phoenixRank = maxRank;
                }
            }
        } else {
            minRank = isSparrowUsed ? 1 : Collections.min(ranks);
            maxRank = Collections.max(ranks);
            phoenixRank = null;
        }
    }

    public static boolean isStraightTrick(List<Card> cards) {
        if (cards.size() < 5 || cards.size() > 14 || !Cards.areDistinct(cards)) {
            return false;
        }

        var rankList = Cards.extractStandardCardRanks(cards);
        var rankSet = new HashSet<>(rankList);
        var minRank = Collections.min(rankSet);
        var maxRank = Collections.max(rankSet);

        if (Cards.containsPhoenix(cards)) {
            int start;
            if (Cards.containsSparrow(cards)) {
                // e.g. 12P45, 1234P
                if (rankList.size() != cards.size() - 2) {
                    return false;
                }
                start = 2;
            } else {
                // e.g. 23P56, 2345P, PJQKA
                if (rankList.size() != cards.size() - 1) {
                    return false;
                }
                start = minRank;
            }

            var consumedPhoenix = false;
            for (var r = start; r <= maxRank; r++) {
                if (!rankSet.contains(r)) {
                    if (consumedPhoenix) {
                        return false;
                    }
                    consumedPhoenix = true;
                }
            }
        } else {
            int start;
            if (Cards.containsSparrow(cards)) {
                // e.g. 12345
                if (rankList.size() != cards.size() - 1) {
                    return false;
                }
                start = 2;
            } else {
                // e.g. 23456
                if (rankList.size() != cards.size()) {
                    return false;
                }
                // Reject straight flush
                if (Cards.haveSameSuit(Cards.extractStandardCards(cards))) {
                    return false;
                }
                start = minRank;
            }

            for (var r = start; r <= maxRank; r++) {
                if (!rankSet.contains(r)) {
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
        var ranks = new HashSet<>(Cards.extractStandardCardRanks(hand));
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
