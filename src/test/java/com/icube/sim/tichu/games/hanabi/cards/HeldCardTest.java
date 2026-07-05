package com.icube.sim.tichu.games.hanabi.cards;

import com.icube.sim.tichu.games.hanabi.HanabiRule;
import com.icube.sim.tichu.games.hanabi.RainbowMode;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class HeldCardTest {
    private HeldCard held(HanabiColor color, int value) {
        return new HeldCard(new HanabiCard(color, value));
    }

    private HanabiRule ruleWith(RainbowMode rainbowMode) {
        return new HanabiRule(true, rainbowMode, false, false);
    }

    @Test
    void matches_wildcard_rainbowMatchesEveryColor() {
        var rule = ruleWith(RainbowMode.WILDCARD);

        // Rainbow is a wildcard: every color hint touches it.
        assertTrue(held(HanabiColor.RAINBOW, 3).matches(Clue.color(HanabiColor.RED), rule));
        assertTrue(held(HanabiColor.RAINBOW, 3).matches(Clue.color(HanabiColor.BLUE), rule));
        // A standard card is touched only by its own color.
        assertTrue(held(HanabiColor.RED, 4).matches(Clue.color(HanabiColor.RED), rule));
        assertFalse(held(HanabiColor.RED, 4).matches(Clue.color(HanabiColor.BLUE), rule));
        // Black is never touched by a color hint but is touched by value hints.
        assertFalse(held(HanabiColor.BLACK, 3).matches(Clue.color(HanabiColor.RED), rule));
        assertTrue(held(HanabiColor.BLACK, 3).matches(Clue.value(3), rule));
    }

    @Test
    void matches_sixthColor_rainbowMatchesOnlyRainbowHint() {
        var rule = ruleWith(RainbowMode.SIXTH_LONG);

        assertTrue(held(HanabiColor.RAINBOW, 3).matches(Clue.color(HanabiColor.RAINBOW), rule));
        assertFalse(held(HanabiColor.RAINBOW, 3).matches(Clue.color(HanabiColor.RED), rule));
        assertFalse(held(HanabiColor.RED, 4).matches(Clue.color(HanabiColor.RAINBOW), rule));
        assertTrue(held(HanabiColor.RAINBOW, 3).matches(Clue.value(3), rule));
    }
}
