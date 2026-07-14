package com.icube.sim.tichu.games.hanabi.cards;

public enum HanabiColor {
    RED,
    YELLOW,
    GREEN,
    BLUE,
    WHITE,
    RAINBOW,
    BLACK,
    ;

    public boolean isStandard() {
        return this != RAINBOW && this != BLACK;
    }

    public boolean isDescending() {
        return this == BLACK;
    }
}
