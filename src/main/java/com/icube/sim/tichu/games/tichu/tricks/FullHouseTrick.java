package com.icube.sim.tichu.games.tichu.tricks;

import com.icube.sim.tichu.games.tichu.cards.Card;
import com.icube.sim.tichu.games.tichu.cards.Cards;
import com.icube.sim.tichu.games.tichu.cards.StandardCard;
import lombok.Getter;
import org.jspecify.annotations.Nullable;

import java.util.List;
import java.util.stream.Collectors;

@Getter
public class FullHouseTrick extends Trick {
    private final int rank;
    private final boolean isPhoenixUsed;

    public FullHouseTrick(int playerIndex, List<Card> cards) {
        super(playerIndex, cards);

        assert cards.size() == 5;
        assert Cards.areDistinct(cards);

        isPhoenixUsed = Cards.containsPhoenix(cards);
        var standardCards = Cards.sortedCards(Cards.extractStandardCards(cards));
        if (isPhoenixUsed) {
            assert standardCards.size() == 4;
            // Reject 2222P
            assert standardCards.get(0).rank() != standardCards.get(3).rank();
            if (standardCards.get(0).rank() == standardCards.get(2).rank()) {
                // e.g. 2223P
                assert standardCards.get(0).rank() == standardCards.get(1).rank();
                rank = standardCards.get(0).rank();
            } else {
                // e.g. 2233P or P2333
                assert standardCards.get(2).rank() == standardCards.get(3).rank();
                assert standardCards.get(0).rank() == standardCards.get(1).rank() ||
                        standardCards.get(1).rank() == standardCards.get(2).rank();
                rank = standardCards.get(3).rank();
            }
        } else {
            assert standardCards.size() == 5;
            assert standardCards.get(0).rank() == standardCards.get(1).rank();
            assert standardCards.get(3).rank() == standardCards.get(4).rank();
            if (standardCards.get(1).rank() == standardCards.get(2).rank()) {
                // e.g. 22233
                rank = standardCards.get(0).rank();
            } else {
                // e.g. 22333
                assert standardCards.get(2).rank() == standardCards.get(3).rank();
                rank = standardCards.get(4).rank();
            }
        }
    }

    public static boolean isFullHouseTrick(List<Card> cards) {
        if (cards.size() != 5 || !Cards.areDistinct(cards)) {
            return false;
        }

        var standardCards = Cards.sortedCards(Cards.extractStandardCards(cards));
        if (Cards.containsPhoenix(cards)) {
            // Reject 2222P
            if (standardCards.size() != 4 || standardCards.get(0).rank() == standardCards.get(3).rank()) {
                return false;
            }

            // e.g. 2223P
            return standardCards.get(0).rank() == standardCards.get(1).rank()
                    && standardCards.get(1).rank() == standardCards.get(2).rank()
                    // e.g. 2233P
                    || standardCards.get(0).rank() == standardCards.get(1).rank()
                    && standardCards.get(2).rank() == standardCards.get(3).rank()
                    // e.g. P2333
                    || standardCards.get(1).rank() == standardCards.get(2).rank()
                    && standardCards.get(2).rank() == standardCards.get(3).rank();

        } else {
            return standardCards.size() == 5
                    && standardCards.get(0).rank() == standardCards.get(1).rank()
                    && standardCards.get(3).rank() == standardCards.get(4).rank()
                    // e.g. 22233
                    && (standardCards.get(1).rank() == standardCards.get(2).rank()
                    // e.g. 22333
                    || standardCards.get(2).rank() == standardCards.get(3).rank());
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
        var cardCounts = Cards.extractStandardCards(hand).stream()
                .collect(Collectors.groupingBy(StandardCard::rank, Collectors.counting()));
        var hasPhoenix = Cards.containsPhoenix(hand);
        long wishCount = cardCounts.getOrDefault(wish, 0L);

        // Case A: 위시 카드가 트리플에 속하는 경우 (트리플 랭크 = wish)
        //   → wish > prevTrick.rank 이어야 함
        if (wish > prevTrick.getRank()) {
            if (wishCount >= 3) {
                // 피닉스를 페어에 사용 가능
                var hasPair = cardCounts.entrySet().stream()
                        .filter(e -> e.getKey() != wish)
                        .anyMatch(e -> e.getValue() >= 2);
                var hasPairWithPhoenix = hasPhoenix
                        && cardCounts.entrySet().stream()
                                .filter(e -> e.getKey() != wish)
                                .anyMatch(e -> e.getValue() >= 1);
                if (hasPair || hasPairWithPhoenix) {
                    return true;
                }
            }
            if (hasPhoenix && wishCount >= 2) {
                // 피닉스는 트리플에 사용 → 페어에 사용 불가
                var hasPair = cardCounts.entrySet().stream()
                        .filter(e -> e.getKey() != wish)
                        .anyMatch(e -> e.getValue() >= 2);
                if (hasPair) {
                    return true;
                }
            }
        }

        // Case B: 위시 카드가 페어에 속하는 경우 (트리플은 다른 랭크)
        //   → 트리플 랭크 > prevTrick.rank 이어야 함
        for (var entry : cardCounts.entrySet()) {
            int tripleRank = entry.getKey();
            long tripleCount = entry.getValue();
            if (tripleRank == wish || tripleRank <= prevTrick.getRank()) {
                continue;
            }

            if (tripleCount >= 3) {
                // 피닉스를 페어에 사용 가능
                if (wishCount >= 2 || hasPhoenix && wishCount >= 1) {
                    return true;
                }
            }
            if (hasPhoenix && tripleCount >= 2) {
                // 피닉스는 트리플에 사용 → 페어에 피닉스 사용 불가
                if (wishCount >= 2) {
                    return true;
                }
            }
        }

        return false;
    }
}
