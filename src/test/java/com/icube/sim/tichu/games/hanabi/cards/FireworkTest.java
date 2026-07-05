package com.icube.sim.tichu.games.hanabi.cards;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class FireworkTest {
    @Test
    void ascending_buildsOneToFive() {
        var firework = new Firework(HanabiColor.RED);

        assertEquals(0, firework.topValue());
        assertTrue(firework.canPlay(new HanabiCard(HanabiColor.RED, 1)));
        assertFalse(firework.canPlay(new HanabiCard(HanabiColor.RED, 2)));
        assertFalse(firework.canPlay(new HanabiCard(HanabiColor.BLUE, 1)));

        for (var value = 1; value <= 5; value++) {
            assertTrue(firework.canPlay(new HanabiCard(HanabiColor.RED, value)));
            firework.play(new HanabiCard(HanabiColor.RED, value));
            assertEquals(value, firework.topValue());
            assertEquals(value, firework.playCount());
        }
        assertTrue(firework.isComplete());
    }

    @Test
    void descendingBlack_buildsFiveToOne() {
        var firework = new Firework(HanabiColor.BLACK);

        assertEquals(0, firework.topValue());
        assertTrue(firework.canPlay(new HanabiCard(HanabiColor.BLACK, 5)));
        assertFalse(firework.canPlay(new HanabiCard(HanabiColor.BLACK, 4)));

        for (var value = 5; value >= 1; value--) {
            assertTrue(firework.canPlay(new HanabiCard(HanabiColor.BLACK, value)));
            firework.play(new HanabiCard(HanabiColor.BLACK, value));
            assertEquals(value, firework.topValue());
            assertEquals(6 - value, firework.playCount());
        }
        assertTrue(firework.isComplete());
    }
}
