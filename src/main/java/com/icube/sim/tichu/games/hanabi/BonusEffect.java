package com.icube.sim.tichu.games.hanabi;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * The six bonus cards of the Flamboyant Fireworks expansion. One of each is shuffled into the bonus deck;
 * completing a firework draws one and applies it instead of recovering a clue token.
 */
public enum BonusEffect {
    GAIN_CLUE,
    REPAIR_AND_CLUE,
    FREE_COLOR_HINT,
    FREE_VALUE_HINT,
    RECOVER_TO_DECK,
    RECOVER_TO_PLAY,
    ;

    public static List<BonusEffect> shuffledDeck() {
        var deck = new ArrayList<>(Arrays.asList(values()));
        Collections.shuffle(deck);
        return deck;
    }
}
