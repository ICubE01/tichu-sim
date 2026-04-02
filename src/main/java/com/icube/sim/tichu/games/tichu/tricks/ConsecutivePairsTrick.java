package com.icube.sim.tichu.games.tichu.tricks;

import com.icube.sim.tichu.games.tichu.cards.Card;
import com.icube.sim.tichu.games.tichu.cards.Cards;
import lombok.Getter;
import org.jspecify.annotations.Nullable;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Getter
public class ConsecutivePairsTrick extends Trick {
    private final int minRank;
    private final int maxRank;
    private final @Nullable Integer phoenixRank;

    public ConsecutivePairsTrick(int playerIndex, List<Card> cards) {
        super(playerIndex, cards);
        assert isConsecutivePairsTrick(cards);

        var ranks = Cards.extractStandardCardRanks(cards);
        minRank = Collections.min(ranks);
        maxRank = Collections.max(ranks);

        if (Cards.containsPhoenix(cards)) {
            var rankCounts = ranks.stream().collect(Collectors.groupingBy(r -> r, Collectors.counting()));
            phoenixRank = rankCounts.entrySet().stream()
                    .filter(e -> e.getValue() != 2)
                    .map(Map.Entry::getKey)
                    .findAny().orElseThrow();
        } else {
            phoenixRank = null;
        }
    }

    public static boolean isConsecutivePairsTrick(List<Card> cards) {
        if (cards.size() <= 2 || cards.size() % 2 != 0 || !Cards.areDistinct(cards)) {
            return false;
        }

        var ranks = Cards.extractStandardCardRanks(cards);
        var minRank = Collections.min(ranks);
        var maxRank = Collections.max(ranks);
        var rankCounts = ranks.stream().collect(Collectors.groupingBy(r -> r, Collectors.counting()));
        if (Cards.containsPhoenix(cards)) {
            // e.g. 22P344
            if (ranks.size() != cards.size() - 1) {
                return false;
            }

            var consumedPhoenix = false;
            for (int r = minRank; r <= maxRank; r++) {
                if (rankCounts.getOrDefault(r, 0L) < 2) {
                    if (consumedPhoenix) {
                        return false;
                    }
                    consumedPhoenix = true;
                }
            }
        } else {
            // e.g. 223344
            if (ranks.size() != cards.size()) {
                return false;
            }

            for (int r = minRank; r <= maxRank; r++) {
                if (rankCounts.getOrDefault(r, 0L) < 2) {
                    return false;
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
        var rankCounts = Cards.extractStandardCardRanks(hand).stream()
                .collect(Collectors.groupingBy(r -> r, Collectors.counting()));
        if (rankCounts.getOrDefault(wish, 0L) == 0L) {
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
                long count = rankCounts.getOrDefault(r, 0L);
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
