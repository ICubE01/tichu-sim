package com.icube.sim.tichu.games.hanabi.cards;

import org.jspecify.annotations.Nullable;

public record ColorClue(@Nullable HanabiColor color) implements Clue {
    @Override
    public ClueType type() {
        return ClueType.COLOR;
    }
}
