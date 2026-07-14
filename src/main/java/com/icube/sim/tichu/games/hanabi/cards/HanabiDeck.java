package com.icube.sim.tichu.games.hanabi.cards;

import com.icube.sim.tichu.games.hanabi.HanabiRule;
import com.icube.sim.tichu.games.hanabi.RainbowMode;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public final class HanabiDeck {
    private static final List<HanabiColor> STANDARD_COLORS = List.of(
            HanabiColor.WHITE, HanabiColor.RED, HanabiColor.BLUE, HanabiColor.YELLOW, HanabiColor.GREEN);
    private static final List<Integer> STANDARD_VALUES = List.of(1, 1, 1, 2, 2, 3, 3, 4, 4, 5);
    // Black Gunpowder is played 5 -> 1, so its distribution is mirrored: three 5s, one 1.
    private static final List<Integer> BLACK_VALUES = List.of(5, 5, 5, 4, 4, 3, 3, 2, 2, 1);

    private HanabiDeck() {
    }

    public static List<HanabiCard> build(HanabiRule rule) {
        var cards = new ArrayList<HanabiCard>();
        for (var color : STANDARD_COLORS) {
            for (var value : STANDARD_VALUES) {
                cards.add(new HanabiCard(color, value));
            }
        }
        if (rule.isRainbowEnabled()) {
            if (rule.rainbowMode() == RainbowMode.SIXTH_SHORT) {
                for (var value = 1; value <= 5; value++) {
                    cards.add(new HanabiCard(HanabiColor.RAINBOW, value));
                }
            } else {
                for (var value : STANDARD_VALUES) {
                    cards.add(new HanabiCard(HanabiColor.RAINBOW, value));
                }
            }
        }
        if (rule.isBlackEnabled()) {
            for (var value : BLACK_VALUES) {
                cards.add(new HanabiCard(HanabiColor.BLACK, value));
            }
        }
        Collections.shuffle(cards);
        return cards;
    }

    public static List<HanabiColor> activeColors(HanabiRule rule) {
        var colors = new ArrayList<>(STANDARD_COLORS);
        if (rule.isRainbowEnabled()) {
            colors.add(HanabiColor.RAINBOW);
        }
        if (rule.isBlackEnabled()) {
            colors.add(HanabiColor.BLACK);
        }
        return colors;
    }
}
