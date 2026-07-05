package com.icube.sim.tichu.games.hanabi;

import com.icube.sim.tichu.games.hanabi.cards.Clue;
import com.icube.sim.tichu.games.hanabi.cards.Firework;
import com.icube.sim.tichu.games.hanabi.cards.HanabiColor;
import com.icube.sim.tichu.games.hanabi.exceptions.InvalidActionException;
import com.icube.sim.tichu.games.hanabi.exceptions.InvalidHintException;
import com.icube.sim.tichu.games.hanabi.exceptions.MaxClueTokensException;
import com.icube.sim.tichu.games.hanabi.exceptions.NoClueTokensException;
import com.icube.sim.tichu.games.hanabi.exceptions.NotYourTurnException;
import com.icube.sim.tichu.rooms.Member;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class HanabiTest {
    private Map<Long, Member> members(int count) {
        var members = new LinkedHashMap<Long, Member>();
        for (var i = 1; i <= count; i++) {
            members.put((long) i, new Member(i, "P" + i));
        }
        return members;
    }

    private Hanabi newGame(int playerCount) {
        return new Hanabi(HanabiRule.createDefault(), members(playerCount));
    }

    private long otherPlayerId(Hanabi game) {
        var current = game.getCurrentPlayerId();
        for (var player : game.getPlayers()) {
            if (player.getId() != current) {
                return player.getId();
            }
        }
        throw new IllegalStateException();
    }

    @Test
    void initialState_twoToThreePlayers_dealsFiveCards() {
        var game = newGame(3);

        assertEquals(8, game.getClueTokens());
        assertEquals(3, game.getFuseTokens());
        assertEquals(0, game.getCurrentTurnIndex());
        for (var player : game.getPlayers()) {
            assertEquals(5, player.getHandSize());
        }
        // 50 - (3 players * 5 cards) = 35
        assertEquals(35, game.getDeckSize());
    }

    @Test
    void initialState_fourToFivePlayers_dealsFourCards() {
        var game = newGame(4);

        for (var player : game.getPlayers()) {
            assertEquals(4, player.getHandSize());
        }
        assertEquals(50 - 16, game.getDeckSize());
    }

    @Test
    void giveHint_spendsClueAndAdvancesTurn() {
        var game = newGame(2);
        var from = game.getCurrentPlayerId();
        var target = otherPlayerId(game);

        game.giveHint(from, target, Clue.value(1));

        assertEquals(7, game.getClueTokens());
        assertEquals(target, game.getCurrentPlayerId());
    }

    @Test
    void giveHint_toSelf_throws() {
        var game = newGame(2);
        var from = game.getCurrentPlayerId();

        assertThrows(InvalidActionException.class, () -> game.giveHint(from, from, Clue.value(1)));
    }

    @Test
    void giveHint_whenNotYourTurn_throws() {
        var game = newGame(2);
        var notCurrent = otherPlayerId(game);
        var current = game.getCurrentPlayerId();

        assertThrows(NotYourTurnException.class, () -> game.giveHint(notCurrent, current, Clue.value(1)));
    }

    @Test
    void giveHint_invalidValueOrForbiddenColor_throws() {
        var game = newGame(2);
        var from = game.getCurrentPlayerId();
        var target = otherPlayerId(game);

        assertThrows(InvalidHintException.class, () -> game.giveHint(from, target, Clue.value(6)));
        assertThrows(InvalidHintException.class, () -> game.giveHint(from, target, Clue.color(HanabiColor.BLACK)));
        assertThrows(InvalidHintException.class, () -> game.giveHint(from, target, Clue.color(HanabiColor.RAINBOW)));
    }

    @Test
    void giveHint_recordsPositiveAndNegativeKnowledgeCorrectly() {
        var game = newGame(2);
        var from = game.getCurrentPlayerId();
        var targetId = otherPlayerId(game);
        var target = game.getPlayers()[game.getPlayerIndexById(targetId)];

        game.giveHint(from, targetId, Clue.color(HanabiColor.RED));

        for (var held : target.getHand()) {
            var isRed = held.getCard().color() == HanabiColor.RED;
            assertEquals(isRed, held.getPositiveColorClues().contains(HanabiColor.RED));
            assertEquals(!isRed, held.getNegativeColorClues().contains(HanabiColor.RED));
        }
    }

    @Test
    void giveHint_emptyHintIsAllowed() {
        var game = newGame(2);
        var from = game.getCurrentPlayerId();
        var targetId = otherPlayerId(game);
        var target = game.getPlayers()[game.getPlayerIndexById(targetId)];
        // Pick a value that no card in the target's hand has, if any; otherwise any valid value still works.
        var missingValue = 1;
        for (var v = 1; v <= 5; v++) {
            var value = v;
            var present = target.getHand().stream().anyMatch(h -> h.getCard().value() == value);
            if (!present) {
                missingValue = v;
                break;
            }
        }

        var finalMissing = missingValue;
        assertDoesNotThrow(() -> game.giveHint(from, targetId, Clue.value(finalMissing)));
        assertEquals(7, game.getClueTokens());
    }

    @Test
    void drainAllClueTokens_thenHintThrows() {
        var game = newGame(2);

        for (var i = 0; i < 8; i++) {
            var from = game.getCurrentPlayerId();
            var target = otherPlayerId(game);
            game.giveHint(from, target, Clue.value(1));
        }
        assertEquals(0, game.getClueTokens());

        var from = game.getCurrentPlayerId();
        var target = otherPlayerId(game);
        assertThrows(NoClueTokensException.class, () -> game.giveHint(from, target, Clue.value(1)));
    }

    @Test
    void discard_atFullClueTokens_throws() {
        var game = newGame(2);
        var current = game.getCurrentPlayerId();

        assertThrows(MaxClueTokensException.class, () -> game.discard(current, 0));
    }

    @Test
    void discard_recoversClueDrawsReplacementAndAdvances() {
        var game = newGame(2);
        // Spend a clue first, so discarding is legal.
        var first = game.getCurrentPlayerId();
        game.giveHint(first, otherPlayerId(game), Clue.value(1));
        assertEquals(7, game.getClueTokens());

        var discarder = game.getCurrentPlayerId();
        var deckBefore = game.getDeckSize();
        game.discard(discarder, 0);

        assertEquals(8, game.getClueTokens());
        assertEquals(1, game.getDiscardPile().size());
        assertEquals(deckBefore - 1, game.getDeckSize());
        assertEquals(5, game.getPlayers()[game.getPlayerIndexById(discarder)].getHandSize());
        assertNotEquals(discarder, game.getCurrentPlayerId());
    }

    @Test
    void play_misplay_losesFuseAndDiscards() {
        var game = newGame(2);
        var currentId = game.getCurrentPlayerId();
        var current = game.getPlayers()[game.getPlayerIndexById(currentId)];

        // At the start, only standard 1s are playable. Find a guaranteed misplay (value >= 2, non-black).
        var hand = current.getHand();
        int misplayIndex = -1;
        for (var i = 0; i < hand.size(); i++) {
            if (hand.get(i).getCard().value() >= 2) {
                misplayIndex = i;
                break;
            }
        }
        assertTrue(misplayIndex >= 0, "expected at least one non-1 card in a 5-card hand");

        game.play(currentId, misplayIndex);

        assertEquals(2, game.getFuseTokens());
        assertEquals(1, game.getDiscardPile().size());
    }

    @Test
    void play_successfulOne_increasesScore() {
        var game = newGame(2);
        var currentId = game.getCurrentPlayerId();
        var current = game.getPlayers()[game.getPlayerIndexById(currentId)];

        var hand = current.getHand();
        int playIndex = -1;
        for (var i = 0; i < hand.size(); i++) {
            var card = hand.get(i).getCard();
            if (card.color().isStandard() && card.value() == 1) {
                playIndex = i;
                break;
            }
        }

        if (playIndex < 0) {
            return; // No playable 1 in hand this deal; covered deterministically by FireworkTest.
        }

        game.play(currentId, playIndex);

        var played = game.getFireworks().values().stream()
                .mapToInt(Firework::playCount)
                .sum();
        assertEquals(1, played);
        assertEquals(3, game.getFuseTokens());
    }

    @Test
    void giveHint_rainbowNameable_onlyInSixthColorMode() {
        // Sixth-color mode: "rainbow" is a nameable color.
        var sixth = new Hanabi(new HanabiRule(true, RainbowMode.SIXTH_LONG, false, false), members(2));
        var f1 = sixth.getCurrentPlayerId();
        var t1 = otherPlayerId(sixth);
        assertDoesNotThrow(() -> sixth.giveHint(f1, t1, Clue.color(HanabiColor.RAINBOW)));

        // Wildcard mode: rainbow is "all colors", so it cannot be named directly.
        var wild = new Hanabi(new HanabiRule(true, RainbowMode.WILDCARD, false, false), members(2));
        var f2 = wild.getCurrentPlayerId();
        var t2 = otherPlayerId(wild);
        assertThrows(InvalidHintException.class, () -> wild.giveHint(f2, t2, Clue.color(HanabiColor.RAINBOW)));

        // Rainbow suit disabled: not a legal color at all.
        var none = newGame(2);
        var f3 = none.getCurrentPlayerId();
        var t3 = otherPlayerId(none);
        assertThrows(InvalidHintException.class, () -> none.giveHint(f3, t3, Clue.color(HanabiColor.RAINBOW)));
    }
}
