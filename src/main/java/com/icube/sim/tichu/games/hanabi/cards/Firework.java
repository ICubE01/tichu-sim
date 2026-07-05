package com.icube.sim.tichu.games.hanabi.cards;

import lombok.Getter;

/**
 * A single colored firework stack. Standard colors build ascending (1..5); the black
 * (Black Gunpowder) stack builds descending (5..1).
 */
public class Firework {
    private static final int COMPLETE_COUNT = 5;

    @Getter
    private final HanabiColor color;
    // How many cards have been successfully played onto this stack (0..5).
    private int playCount = 0;

    public Firework(HanabiColor color) {
        this.color = color;
    }

    public boolean canPlay(HanabiCard card) {
        if (card.color() != color) {
            return false;
        }
        return card.value() == nextValue();
    }

    public void play(HanabiCard card) {
        assert canPlay(card);
        playCount++;
    }

    public int playCount() {
        return playCount;
    }

    public boolean isComplete() {
        return playCount == COMPLETE_COUNT;
    }

    /** The value currently on top of the stack, or 0 if empty. */
    public int topValue() {
        if (playCount == 0) {
            return 0;
        }
        return color.isDescending() ? COMPLETE_COUNT + 1 - playCount : playCount;
    }

    /** The value of the next card must have to be playable, or -1 once complete. */
    private int nextValue() {
        if (isComplete()) {
            return -1;
        }
        return color.isDescending() ? COMPLETE_COUNT - playCount : playCount + 1;
    }
}
