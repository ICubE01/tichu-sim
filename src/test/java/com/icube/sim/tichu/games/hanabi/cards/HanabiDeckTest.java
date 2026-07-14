package com.icube.sim.tichu.games.hanabi.cards;

import com.icube.sim.tichu.games.hanabi.HanabiRule;
import com.icube.sim.tichu.games.hanabi.RainbowMode;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class HanabiDeckTest {
    private long countColor(List<HanabiCard> deck, HanabiColor color) {
        return deck.stream().filter(c -> c.color() == color).count();
    }

    private long countCard(List<HanabiCard> deck, HanabiColor color, int value) {
        return deck.stream().filter(c -> c.color() == color && c.value() == value).count();
    }

    @Test
    void baseDeck_has50StandardCards() {
        var deck = HanabiDeck.build(HanabiRule.createDefault());

        assertEquals(50, deck.size());
        for (var color : List.of(HanabiColor.WHITE, HanabiColor.RED, HanabiColor.BLUE, HanabiColor.YELLOW, HanabiColor.GREEN)) {
            assertEquals(10, countColor(deck, color));
            assertEquals(3, countCard(deck, color, 1));
            assertEquals(2, countCard(deck, color, 2));
            assertEquals(2, countCard(deck, color, 3));
            assertEquals(2, countCard(deck, color, 4));
            assertEquals(1, countCard(deck, color, 5));
        }
    }

    @Test
    void rainbowLong_adds10Cards() {
        var rule = new HanabiRule(true, RainbowMode.SIXTH_LONG, false, false);

        var deck = HanabiDeck.build(rule);

        assertEquals(60, deck.size());
        assertEquals(10, countColor(deck, HanabiColor.RAINBOW));
        assertTrue(HanabiDeck.activeColors(rule).contains(HanabiColor.RAINBOW));
    }

    @Test
    void rainbowShort_addsOnlyFiveCards() {
        var rule = new HanabiRule(true, RainbowMode.SIXTH_SHORT, false, false);

        var deck = HanabiDeck.build(rule);

        assertEquals(55, deck.size());
        assertEquals(5, countColor(deck, HanabiColor.RAINBOW));
        for (var value = 1; value <= 5; value++) {
            assertEquals(1, countCard(deck, HanabiColor.RAINBOW, value));
        }
    }

    @Test
    void blackPowder_addsMirroredDistribution() {
        var rule = new HanabiRule(false, RainbowMode.WILDCARD, true, false);

        var deck = HanabiDeck.build(rule);

        assertEquals(60, deck.size());
        assertEquals(10, countColor(deck, HanabiColor.BLACK));
        // Black builds 5 -> 1, so it has three 5s and a single 1.
        assertEquals(3, countCard(deck, HanabiColor.BLACK, 5));
        assertEquals(2, countCard(deck, HanabiColor.BLACK, 4));
        assertEquals(2, countCard(deck, HanabiColor.BLACK, 3));
        assertEquals(2, countCard(deck, HanabiColor.BLACK, 2));
        assertEquals(1, countCard(deck, HanabiColor.BLACK, 1));
    }
}
