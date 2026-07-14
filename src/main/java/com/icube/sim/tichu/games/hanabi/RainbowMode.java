package com.icube.sim.tichu.games.hanabi;

public enum RainbowMode {
    /**
     * Official Colour Avalanche: rainbow is a wildcard — it counts as every color, so any color hint
     * touches a rainbow card, and "rainbow" cannot be named as a hint. Full 10-card suit.
     */
    WILDCARD,
    /** Rainbow is its own sixth color, touched only by a "rainbow" hint. Full 10-card suit. */
    SIXTH_LONG,
    /**
     * Rainbow is its own sixth color, touched only by a "rainbow" hint. Short 5-card suit
     * (1 2 3 4 5, no duplicates), so every rainbow card is critical.
     */
    SIXTH_SHORT,
}
