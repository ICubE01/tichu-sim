package com.icube.sim.tichu.games.tichu.tricks;

import com.icube.sim.tichu.games.tichu.cards.*;
import org.junit.jupiter.api.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.*;

class SingleTrickTest {
    static Map<CardSuit, Map<Integer, SingleTrick>> standardSts =
            Arrays.stream(CardSuit.values()).collect(Collectors.toUnmodifiableMap(
                    suit -> suit,
                    suit -> IntStream.rangeClosed(2, 14).boxed().collect(Collectors.toUnmodifiableMap(
                            rank -> rank,
                            rank -> new SingleTrick(0, List.of(new StandardCard(suit, rank)), null)
                    ))
            ));

    static SingleTrick sparrowSt = new SingleTrick(0, List.of(new SparrowCard()), null);

    static SingleTrick phoenixStAfterNull = new SingleTrick(0, List.of(new PhoenixCard()), null);

    static SingleTrick phoenixStAfterSparrow = new SingleTrick(0, List.of(new PhoenixCard()), sparrowSt);

    static Map<Integer, SingleTrick> phoenixSts =
            IntStream.rangeClosed(2, 14).boxed().collect(Collectors.toUnmodifiableMap(
                    rank -> rank,
                    rank -> new SingleTrick(0, List.of(new PhoenixCard()), standardSts.get(CardSuit.SPADE).get(rank))
            ));

    static SingleTrick dragonSt = new SingleTrick(0, List.of(new DragonCard()), null);

    @Test
    void isSingleTrick_singleTrick_returnTrue() {
        for (var suit : CardSuit.values()) {
            for (var rank = 2; rank <= 14; rank++) {
                assertTrue(SingleTrick.isSingleTrick(List.of(new StandardCard(suit, rank))));
            }
        }
        assertTrue(SingleTrick.isSingleTrick(List.of(new SparrowCard())));
        assertTrue(SingleTrick.isSingleTrick(List.of(new PhoenixCard())));
        assertTrue(SingleTrick.isSingleTrick(List.of(new DragonCard())));
    }

    @Test
    void isSingleTrick_dogTrick_returnFalse() {
        assertFalse(SingleTrick.isSingleTrick(List.of(new DogCard())));
    }

    @Test
    void getRank_standardCard_returnCorrectRank() {
        for (var suit : CardSuit.values()) {
            for (var rank = 2; rank <= 14; rank++) {
                assertEquals(rank, standardSts.get(suit).get(rank).getRank());
            }
        }
    }

    @Test
    void getRank_sparrowCard_returnOne() {
        assertEquals(1, sparrowSt.getRank());
    }

    @Test
    void getRank_phoenixCard_returnCorrectRank() {
        assertEquals(1.5f, phoenixStAfterNull.getRank());
        assertEquals(1.5f, phoenixStAfterSparrow.getRank());

        for (var rank = 2; rank <= 14; rank++) {
            assertEquals(rank + 0.5f, phoenixSts.get(rank).getRank());
        }
    }

    @Test
    void getRank_dragonCard_returnTwenty() {
        assertEquals(20, dragonSt.getRank());
    }

    @Test
    void canCoverUp_null_returnTrue() {
        assertTrue(((Trick) standardSts.get(CardSuit.SPADE).get(2)).canCoverUp(null));
        assertTrue(((Trick) sparrowSt).canCoverUp(null));
        assertTrue(((Trick) phoenixStAfterNull).canCoverUp(null));
        assertTrue(((Trick) dragonSt).canCoverUp(null));
    }

    @Test
    void canCoverUp_lowerRank_returnTrue() {
        assertTrue(standardSts.get(CardSuit.SPADE).get(10).canCoverUp(standardSts.get(CardSuit.SPADE).get(9)));
    }

    @Test
    void canCoverUp_sameRank_returnFalse() {
        assertFalse(standardSts.get(CardSuit.SPADE).get(10).canCoverUp(standardSts.get(CardSuit.SPADE).get(10)));
    }

    @Test
    void canCoverUp_higherRank_returnFalse() {
        assertFalse(standardSts.get(CardSuit.SPADE).get(10).canCoverUp(standardSts.get(CardSuit.SPADE).get(11)));
    }

    @Test
    void canCoverUp_sparrowCard_returnTrue() {
        for (var rank = 2; rank <= 14; rank++) {
            assertTrue(standardSts.get(CardSuit.SPADE).get(rank).canCoverUp(sparrowSt));
        }
        assertTrue(phoenixStAfterSparrow.canCoverUp(sparrowSt));
        assertTrue(dragonSt.canCoverUp(sparrowSt));
    }

    @Test
    void canCoverUp_lowerPhoenixCard_returnTrue() {
        assertTrue(standardSts.get(CardSuit.SPADE).get(2).canCoverUp(phoenixStAfterNull));
        assertTrue(standardSts.get(CardSuit.SPADE).get(2).canCoverUp(phoenixStAfterSparrow));
        for (var rank = 3; rank <= 14; rank++) {
            assertTrue(standardSts.get(CardSuit.SPADE).get(rank).canCoverUp(phoenixSts.get(rank - 1)));
        }
    }

    @Test
    void canCoverUp_higherPhoenixCard_returnFalse() {
        assertFalse(sparrowSt.canCoverUp(phoenixStAfterNull));
        assertFalse(sparrowSt.canCoverUp(phoenixStAfterSparrow));
        for (var rank = 2; rank <= 14; rank++) {
            assertFalse(standardSts.get(CardSuit.SPADE).get(rank).canCoverUp(phoenixSts.get(rank)));
        }
    }

    @Test
    void canCoverUp_dragonCard_returnFalse() {
        for (var rank = 2; rank <= 14; rank++) {
            assertFalse(standardSts.get(CardSuit.SPADE).get(rank).canCoverUp(dragonSt));
        }
        assertFalse(sparrowSt.canCoverUp(dragonSt));
        assertFalse(phoenixStAfterNull.canCoverUp(dragonSt));
        assertFalse(phoenixStAfterSparrow.canCoverUp(dragonSt));
        for (var rank = 2; rank <= 14; rank++) {
            assertFalse(phoenixSts.get(rank).canCoverUp(dragonSt));
        }

        // Even Phoenix cannot cover up Dragon
        assertFalse(new SingleTrick(0, List.of(new PhoenixCard()), dragonSt).canCoverUp(dragonSt));
    }

    @Test
    void canCoverUp_byDragonCard_returnTrue() {
        for (var rank = 2; rank <= 14; rank++) {
            assertTrue(dragonSt.canCoverUp(standardSts.get(CardSuit.SPADE).get(rank)));
        }
        assertTrue(dragonSt.canCoverUp(sparrowSt));
        assertTrue(dragonSt.canCoverUp(phoenixStAfterNull));
        assertTrue(dragonSt.canCoverUp(phoenixStAfterSparrow));
        for (var rank = 2; rank <= 14; rank++) {
            assertTrue(dragonSt.canCoverUp(phoenixSts.get(rank)));
        }
    }

    @Test
    void canPlayWishCardAfter_possible_returnTrue() {
        assertTrue(sparrowSt.canPlayWishCardAfter(2, List.of(new StandardCard(CardSuit.SPADE, 2))));
    }

    @Test
    void canPlayWishCardAfter_notPossible_returnFalse() {
        assertFalse(phoenixSts.get(2).canPlayWishCardAfter(2, List.of(new StandardCard(CardSuit.SPADE, 2))));
    }
}
