package com.icube.sim.tichu.games.tichu.tricks;

import com.icube.sim.tichu.games.tichu.cards.Card;
import com.icube.sim.tichu.games.tichu.cards.Cards;
import lombok.Getter;
import org.jspecify.annotations.Nullable;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Getter
public class FullHouseTrick extends Trick {
    private final int rank;
    private final @Nullable Integer phoenixRank;

    public FullHouseTrick(int playerIndex, List<Card> cards) {
        super(playerIndex, cards);
        assert isFullHouseTrick(cards);

        var ranks = Cards.extractStandardCardRanks(cards).stream().sorted().toList();
        rank = ranks.get(2);
        if (Cards.containsPhoenix(cards)) {
            if (ranks.get(1).equals(ranks.get(3))) {
                // e.g. P2333
                phoenixRank = ranks.getFirst();
            } else {
                // e.g. 2223P, 2233P
                phoenixRank = ranks.getLast();
            }
        } else {
            phoenixRank = null;
        }
    }

    public static boolean isFullHouseTrick(List<Card> cards) {
        if (cards.size() != 5 || !Cards.areDistinct(cards)) {
            return false;
        }

        var ranks = Cards.extractStandardCardRanks(cards).stream().sorted().toList();
        if (Cards.containsPhoenix(cards)) {
            // Reject 2222P
            if (ranks.size() != 4 || ranks.get(0).equals(ranks.get(3))) {
                return false;
            }

            // e.g. 2223P
            return ranks.get(0).equals(ranks.get(1)) && ranks.get(1).equals(ranks.get(2))
                    // e.g. 2233P
                    || ranks.get(0).equals(ranks.get(1)) && ranks.get(2).equals(ranks.get(3))
                    // e.g. P2333
                    || ranks.get(1).equals(ranks.get(2)) && ranks.get(2).equals(ranks.get(3));
        } else {
            // e.g. 22233, 22333
            return ranks.size() == 5
                    && ranks.get(0).equals(ranks.get(1))
                    && ranks.get(3).equals(ranks.get(4))
                    && (ranks.get(1).equals(ranks.get(2)) || ranks.get(2).equals(ranks.get(3)));
        }
    }

    @Override
    public TrickType getType() {
        return TrickType.FULL_HOUSE;
    }

    public boolean canCoverUp(FullHouseTrick other) {
        return rank > other.getRank();
    }

    @Override
    public boolean canCoverUp(@Nullable Trick other) {
        return other == null || (other instanceof FullHouseTrick other1 && canCoverUp(other1));
    }

    @Override
    public boolean canPlayWishCardAfter(int wish, List<Card> hand) {
        return canPlayWishCard(wish, hand, this)
                || FourOfAKindTrick.canPlayWishCard(wish, hand, null)
                || StraightFlushTrick.canPlayWishCard(wish, hand, null);
    }

    private static boolean canPlayWishCard(int wish, List<Card> hand, FullHouseTrick prevTrick) {
        var rankCounts = Cards.extractStandardCardRanks(hand).stream()
                .collect(Collectors.groupingBy(r -> r, Collectors.counting()));
        var hasPhoenix = Cards.containsPhoenix(hand);
        long wishCount = rankCounts.getOrDefault(wish, 0L);

        var remainingRankCounts = rankCounts.entrySet().stream()
                .filter(e -> e.getKey() != wish)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        // Wish cards can be used as a triple
        if (wish > prevTrick.getRank()) {
            if (wishCount >= 3) {
                var hasPair = remainingRankCounts.entrySet().stream()
                        .anyMatch(e -> e.getValue() >= 2);
                var hasSingle = remainingRankCounts.entrySet().stream()
                        .anyMatch(e -> e.getValue() >= 1);
                if (hasPair || hasPhoenix && hasSingle) {
                    return true;
                }
            } else if (hasPhoenix && wishCount >= 2) {
                var hasPair = remainingRankCounts.entrySet().stream()
                        .anyMatch(e -> e.getValue() >= 2);
                if (hasPair) {
                    return true;
                }
            }
        }

        // Other cards must be used as a triple
        if (wishCount >= 2) {
            var hasTriple = remainingRankCounts.entrySet().stream()
                    .anyMatch(e -> e.getKey() > prevTrick.getRank() && e.getValue() >= 3);
            var hasPair = remainingRankCounts.entrySet().stream()
                    .anyMatch(e -> e.getKey() > prevTrick.getRank() && e.getValue() >= 2);
            return hasTriple || hasPhoenix && hasPair;
        } else if (hasPhoenix && wishCount >= 1) {
            return remainingRankCounts.entrySet().stream()
                    .anyMatch(e -> e.getKey() > prevTrick.getRank() && e.getValue() >= 3);
        } else {
            return false;
        }
    }
}
