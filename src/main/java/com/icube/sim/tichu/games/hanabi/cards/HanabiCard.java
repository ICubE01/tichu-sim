package com.icube.sim.tichu.games.hanabi.cards;

public record HanabiCard(HanabiColor color, int value) {
    public HanabiCard {
        assert value >= 1 && value <= 5;
    }
}
