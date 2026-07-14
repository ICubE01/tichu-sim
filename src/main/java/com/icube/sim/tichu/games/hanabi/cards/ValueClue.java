package com.icube.sim.tichu.games.hanabi.cards;

public record ValueClue(int value) implements Clue {
    @Override
    public ClueType type() {
        return ClueType.VALUE;
    }
}
