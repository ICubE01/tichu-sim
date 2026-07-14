package com.icube.sim.tichu.games.hanabi.cards;

public sealed interface Clue permits ColorClue, ValueClue {
    ClueType type();

    static Clue color(HanabiColor color) {
        return new ColorClue(color);
    }

    static Clue value(int value) {
        return new ValueClue(value);
    }
}
