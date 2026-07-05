package com.icube.sim.tichu.games.hanabi;

import com.icube.sim.tichu.games.common.domain.AbstractGame;
import com.icube.sim.tichu.games.hanabi.cards.Clue;
import com.icube.sim.tichu.games.hanabi.cards.ColorClue;
import com.icube.sim.tichu.games.hanabi.cards.ValueClue;
import com.icube.sim.tichu.games.hanabi.cards.Firework;
import com.icube.sim.tichu.games.hanabi.cards.HanabiCard;
import com.icube.sim.tichu.games.hanabi.cards.HanabiColor;
import com.icube.sim.tichu.games.hanabi.cards.HanabiDeck;
import com.icube.sim.tichu.games.hanabi.cards.HeldCard;
import com.icube.sim.tichu.games.hanabi.events.*;
import com.icube.sim.tichu.games.hanabi.exceptions.InvalidActionException;
import com.icube.sim.tichu.games.hanabi.exceptions.InvalidHintException;
import com.icube.sim.tichu.games.hanabi.exceptions.MaxClueTokensException;
import com.icube.sim.tichu.games.hanabi.exceptions.NoClueTokensException;
import com.icube.sim.tichu.games.hanabi.exceptions.NotYourTurnException;
import com.icube.sim.tichu.rooms.Member;
import lombok.Getter;
import org.jspecify.annotations.Nullable;

import java.util.*;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

public class Hanabi extends AbstractGame {
    private static final int MAX_CLUE_TOKENS = 8;
    private static final int MAX_FUSE_TOKENS = 3;

    private final Lock lock = new ReentrantLock();
    @Getter
    private final HanabiRule rule;
    private final HanabiPlayer[] players;
    private final Map<Long, Integer> playerIndexById;
    private final Deque<HanabiCard> deck;
    private final Map<HanabiColor, Firework> fireworks;
    private final List<HanabiCard> discardPile;
    private final Deque<BonusEffect> bonusDeck;

    @Getter
    private int clueTokens = MAX_CLUE_TOKENS;
    @Getter
    private int fuseTokens = MAX_FUSE_TOKENS;
    @Getter
    private int currentTurnIndex = 0;
    @Getter
    @Nullable
    private Integer finalTurnsRemaining = null;
    @Getter
    private boolean ended = false;
    @Getter
    private boolean exploded = false;
    @Getter
    @Nullable
    private PendingBonus pendingBonus = null;

    public Hanabi(HanabiRule rule, Map<Long, Member> members) {
        super(new HanabiStartEvent());
        this.rule = rule;
        this.players = initPlayers(members);

        var indexById = new HashMap<Long, Integer>();
        for (var i = 0; i < players.length; i++) {
            indexById.put(players[i].getId(), i);
        }
        this.playerIndexById = Map.copyOf(indexById);

        this.deck = new ArrayDeque<>(HanabiDeck.build(rule));
        this.fireworks = new LinkedHashMap<>();
        for (var color : HanabiDeck.activeColors(rule)) {
            fireworks.put(color, new Firework(color));
        }
        this.discardPile = new ArrayList<>();
        this.bonusDeck = rule.isBonusEnabled()
                ? new ArrayDeque<>(BonusEffect.shuffledDeck())
                : new ArrayDeque<>();

        deal();
    }

    private static HanabiPlayer[] initPlayers(Map<Long, Member> members) {
        var shuffledMembers = new ArrayList<>(members.values());
        Collections.shuffle(shuffledMembers);

        return shuffledMembers.stream()
                .map(HanabiPlayer::new)
                .toArray(HanabiPlayer[]::new);
    }

    private void deal() {
        var handSize = rule.handSize(players.length);
        for (var i = 0; i < handSize; i++) {
            for (var player : players) {
                player.add(new HeldCard(deck.removeFirst()));
            }
        }
    }

    public void lock() {
        lock.lock();
    }

    public void unlock() {
        lock.unlock();
    }

    // ----- Actions -----

    public void giveHint(long fromId, long targetId, Clue clue) {
        requireTurn(fromId);
        if (clueTokens <= 0) {
            throw new NoClueTokensException();
        }
        if (!playerIndexById.containsKey(targetId) || targetId == fromId) {
            throw new InvalidActionException();
        }
        validateClue(clue, rule);

        clueTokens--;
        var matchedIndexes = applyClueToHand(targetId, clue);

        addEvent(new HanabiHintEvent(fromId, targetId, clue, matchedIndexes));
        advanceTurn();
    }

    public void discard(long playerId, int index) {
        requireTurn(playerId);
        if (clueTokens >= MAX_CLUE_TOKENS) {
            throw new MaxClueTokensException();
        }
        var player = currentPlayer();
        validateIndex(player, index);

        var held = player.removeCardAt(index);
        var discarded = held.getCard();
        discardPile.add(discarded);
        clueTokens++;
        var drawn = drawTo(player);

        addEvent(new HanabiDiscardEvent(playerId, index, discarded, drawn));
        advanceTurn();
    }

    public void play(long playerId, int index) {
        requireTurn(playerId);
        var player = currentPlayer();
        validateIndex(player, index);

        var held = player.removeCardAt(index);
        var card = held.getCard();
        var firework = fireworks.get(card.color());

        boolean success;
        boolean fireworkCompleted;
        BonusEffect bonusEffect = null;
        HanabiCard drawnCard = null;
        if (firework != null && firework.canPlay(card)) {
            success = true;
            firework.play(card);
            fireworkCompleted = firework.isComplete();
            if (fireworkCompleted) {
                bonusEffect = onFireworkComplete(playerId);
            }
        } else {
            success = false;
            fireworkCompleted = false;
            discardPile.add(card);
            fuseTokens--;
        }

        // Draw only if bonus is not pending.
        if (pendingBonus == null) {
            drawnCard = drawTo(player);
        }

        addEvent(new HanabiPlayEvent(playerId, index, card, success, fireworkCompleted, bonusEffect, drawnCard));

        if (fuseTokens <= 0) {
            explode();
            return;
        }
        concludeTurn();
    }

    public void resolveBonus(
            long playerId,
            @Nullable Long targetId,
            @Nullable HanabiColor color,
            @Nullable Integer value,
            @Nullable Integer discardIndex
    ) {
        if (ended || pendingBonus == null) {
            throw new InvalidActionException();
        }
        if (pendingBonus.playerId() != playerId) {
            throw new NotYourTurnException();
        }

        switch (pendingBonus.effect()) {
            case FREE_COLOR_HINT -> {
                if (targetId == null || color == null) {
                    throw new InvalidActionException();
                }
                applyFreeHint(playerId, targetId, Clue.color(color));
            }
            case FREE_VALUE_HINT -> {
                if (targetId == null || value == null) {
                    throw new InvalidActionException();
                }
                applyFreeHint(playerId, targetId, Clue.value(value));
            }
            case RECOVER_TO_DECK -> {
                if (discardIndex == null) {
                    throw new InvalidActionException();
                }
                if (!deck.isEmpty()) {
                    recoverToDeck(playerId, discardIndex);
                } else {
                    recoverToPlay(playerId, discardIndex);
                }
            }
            case RECOVER_TO_PLAY -> {
                if (discardIndex == null) {
                    throw new InvalidActionException();
                }
                recoverToPlay(playerId, discardIndex);
            }
            default -> throw new InvalidActionException();
        }
    }

    // ----- Bonus handling -----

    @Nullable
    private BonusEffect onFireworkComplete(long completerId) {
        if (rule.isBonusEnabled() && !bonusDeck.isEmpty()) {
            var effect = bonusDeck.removeFirst();
            applyBonus(effect, completerId);
            return effect;
        } else {
            gainClue();
            return null;
        }
    }

    private void applyBonus(BonusEffect effect, long completerId) {
        switch (effect) {
            // For bonuses below, apply a bonus immediately.
            case GAIN_CLUE -> gainClue();
            case REPAIR_AND_CLUE -> {
                if (fuseTokens < MAX_FUSE_TOKENS) {
                    fuseTokens++;
                }
                gainClue();
            }
            // For bonuses below, pend a bonus and wait a user to resolve.
            case FREE_COLOR_HINT, FREE_VALUE_HINT -> pendingBonus = new PendingBonus(effect, completerId);
            case RECOVER_TO_DECK -> {
                // Skip the bonus if no discard exists.
                if (discardPile.isEmpty()) {
                    return;
                }
                // Recover-to-play has to be done if the deck is empty.
                // Skip it if no discard is playable.
                if (deck.isEmpty() && noDiscardIsPlayable()) {
                    return;
                }
                pendingBonus = new PendingBonus(effect, completerId);
            }
            case RECOVER_TO_PLAY -> {
                // Skip the bonus if no discard is playable.
                if (discardPile.isEmpty() || noDiscardIsPlayable()) {
                    return;
                }
                pendingBonus = new PendingBonus(effect, completerId);
            }
        }
    }

    private void applyFreeHint(long fromId, long targetId, Clue clue) {
        assert pendingBonus != null;
        assert pendingBonus.effect() == BonusEffect.FREE_COLOR_HINT
                || pendingBonus.effect() == BonusEffect.FREE_VALUE_HINT;

        if (!playerIndexById.containsKey(targetId) || targetId == fromId) {
            throw new InvalidActionException();
        }
        validateClue(clue, rule);

        var matchedIndexes = applyClueToHand(targetId, clue);
        pendingBonus = null;
        var drawnCard = drawTo(playerById(fromId));

        addEvent(new HanabiResolveFreeHintEvent(fromId, targetId, clue, matchedIndexes, drawnCard));

        advanceTurn();
    }

    private void recoverToDeck(long playerId, int index) {
        assert pendingBonus != null && pendingBonus.effect() == BonusEffect.RECOVER_TO_DECK;

        if (index < 0 || index >= discardPile.size()) {
            throw new InvalidActionException();
        }

        var card = discardPile.remove(index);
        var recoveredDeck = new ArrayList<>(deck);
        recoveredDeck.add(card);
        Collections.shuffle(recoveredDeck);
        deck.clear();
        deck.addAll(recoveredDeck);

        pendingBonus = null;
        var drawnCard = drawTo(playerById(playerId));

        addEvent(new HanabiResolveRecoverToDeckEvent(playerId, card, drawnCard));

        advanceTurn();
    }

    private void recoverToPlay(long playerId, int index) {
        assert pendingBonus != null;
        assert pendingBonus.effect() == BonusEffect.RECOVER_TO_PLAY
                || (pendingBonus.effect() == BonusEffect.RECOVER_TO_DECK && deck.isEmpty());

        if (index < 0 || index >= discardPile.size()) {
            throw new InvalidActionException();
        }
        var card = discardPile.get(index);
        var firework = fireworks.get(card.color());
        if (firework == null || !firework.canPlay(card)) {
            throw new InvalidActionException();
        }

        discardPile.remove(index);
        firework.play(card);
        pendingBonus = null;

        BonusEffect bonusEffect = null;
        HanabiCard drawnCard = null;
        boolean fireworkCompleted = firework.isComplete();
        if (fireworkCompleted) {
            bonusEffect = onFireworkComplete(playerId);
        }

        // Draw only if bonus is not pending.
        if (pendingBonus == null) {
            drawnCard = drawTo(playerById(playerId));
        }

        addEvent(new HanabiResolveRecoverToPlayEvent(playerId, index, card, fireworkCompleted, bonusEffect, drawnCard));

        concludeTurn();
    }

    private boolean noDiscardIsPlayable() {
        for (var card : discardPile) {
            var firework = fireworks.get(card.color());
            if (firework != null && firework.canPlay(card)) {
                return false;
            }
        }
        return true;
    }

    // ----- Helpers -----

    private void gainClue() {
        if (clueTokens < MAX_CLUE_TOKENS) {
            clueTokens++;
        }
    }

    @Nullable
    private HanabiCard drawTo(HanabiPlayer player) {
        if (deck.isEmpty()) {
            return null;
        }
        var card = deck.removeFirst();
        player.add(new HeldCard(card));
        return card;
    }

    private List<Integer> applyClueToHand(long targetId, Clue clue) {
        var matchedIndexes = new ArrayList<Integer>();

        var hand = playerById(targetId).getHand();
        for (var i = 0; i < hand.size(); i++) {
            var heldCard = hand.get(i);
            var matched = heldCard.applyClue(clue, rule);
            if (matched) {
                matchedIndexes.add(i);
            }
        }

        return matchedIndexes;
    }

    private static void validateClue(Clue clue, HanabiRule rule) {
        switch (clue) {
            case ColorClue colorClue -> {
                var color = colorClue.color();
                // A color must be in play to be hinted.
                if (color == null || !HanabiDeck.activeColors(rule).contains(color)) {
                    throw new InvalidHintException();
                }
                // In wildcard mode rainbow is "all colors", not a nameable color of its own.
                if (color == HanabiColor.RAINBOW && rule.rainbowMode() == RainbowMode.WILDCARD) {
                    throw new InvalidHintException();
                }
                // Black is never hintable by color.
                if (color == HanabiColor.BLACK) {
                    throw new InvalidHintException();
                }
            }
            case ValueClue valueClue -> {
                if (valueClue.value() < 1 || valueClue.value() > 5) {
                    throw new InvalidHintException();
                }
            }
        }
    }

    private void requireTurn(long playerId) {
        if (ended || pendingBonus != null) {
            throw new InvalidActionException();
        }
        if (players[currentTurnIndex].getId() != playerId) {
            throw new NotYourTurnException();
        }
    }

    private HanabiPlayer currentPlayer() {
        return players[currentTurnIndex];
    }

    private HanabiPlayer playerById(long id) {
        return players[playerIndexById.get(id)];
    }

    private void validateIndex(HanabiPlayer player, int index) {
        if (index < 0 || index >= player.getHandSize()) {
            throw new InvalidActionException();
        }
    }

    private void advanceTurn() {
        if (ended) {
            return;
        }
        if (finalTurnsRemaining != null) {
            finalTurnsRemaining--;
            if (finalTurnsRemaining <= 0) {
                endGame();
                return;
            }
        } else if (deck.isEmpty()) {
            finalTurnsRemaining = players.length;
        }
        currentTurnIndex = (currentTurnIndex + 1) % players.length;
    }

    /**
     * Shared end-of-action tail: finish the game if all fireworks are complete, wait if a bonus is
     * pending resolution, otherwise pass to the next player.
     */
    private void concludeTurn() {
        if (allComplete()) {
            endGame();
            return;
        }
        if (pendingBonus != null) {
            return;
        }
        advanceTurn();
    }

    private boolean allComplete() {
        return fireworks.values().stream().allMatch(Firework::isComplete);
    }

    private void explode() {
        exploded = true;
        endGame();
    }

    private void endGame() {
        if (ended) {
            return;
        }
        ended = true;
        addEvent(new HanabiEndEvent());
    }

    // ----- Read-only accessors for mapping -----

    public HanabiPlayer[] getPlayers() {
        return players.clone();
    }

    public int getPlayerIndexById(long id) {
        return playerIndexById.get(id);
    }

    public long getCurrentPlayerId() {
        return players[currentTurnIndex].getId();
    }

    public int getDeckSize() {
        return deck.size();
    }

    public List<HanabiCard> getDiscardPile() {
        return List.copyOf(discardPile);
    }

    public Map<HanabiColor, Firework> getFireworks() {
        return new LinkedHashMap<>(fireworks);
    }

    public static int maxClueTokens() {
        return MAX_CLUE_TOKENS;
    }

    public static int maxFuseTokens() {
        return MAX_FUSE_TOKENS;
    }
}
