package com.icube.sim.tichu.games.tichu;

import com.icube.sim.tichu.games.common.exceptions.InvalidTimeOfActionException;
import com.icube.sim.tichu.games.tichu.cards.*;
import com.icube.sim.tichu.games.tichu.events.*;
import com.icube.sim.tichu.games.tichu.exceptions.InvalidBombException;
import com.icube.sim.tichu.games.tichu.exceptions.InvalidPassException;
import com.icube.sim.tichu.games.tichu.exceptions.InvalidTrickException;
import com.icube.sim.tichu.games.tichu.tricks.*;
import org.jspecify.annotations.Nullable;

import java.util.ArrayList;
import java.util.List;

public class Phase {
    private PhaseStatus status;
    private final Tichu game;
    private final Round round;
    private int turn;
    private final List<Trick> tricks;

    public Phase(Tichu game, Round round, int firstPlayerIndex) {
        this.status = PhaseStatus.PLAYING;
        this.game = game;
        this.round = round;
        this.turn = firstPlayerIndex;
        this.tricks = new ArrayList<>();

        game.addEvent(new TichuPhaseStartEvent(firstPlayerIndex));
    }

    public void playTrick(Long playerId, List<Card> cards, @Nullable Integer wish) {
        if (status != PhaseStatus.PLAYING) {
            throw new InvalidTimeOfActionException();
        }

        var playerIndex = game.getPlayerIndexById(playerId);
        if (playerIndex != turn) {
            throw new InvalidTimeOfActionException();
        }

        if (cards.isEmpty() || !Cards.areDistinct(cards)) {
            throw new InvalidTrickException();
        }
        if (wish != null && (wish < 2 || wish > 14 || !cards.contains(new SparrowCard()))) {
            throw new InvalidTrickException();
        }

        var player = game.getPlayer(playerIndex);
        if (player.doNotHaveSomeCards(cards)) {
            throw new InvalidTrickException();
        }

        // Must fulfill the wish if it's possible.
        var prevTrick = tricks.isEmpty() ? null : tricks.getLast();
        if (round.getWish() != null
                && player.canPlayWishCard(round.getWish(), prevTrick)
                && !Cards.containsWishCard(cards, round.getWish())
        ) {
            throw new InvalidTrickException();
        }

        var trick = TrickBuilder.of(playerIndex, cards, prevTrick).build();
        if (trick == null || trick.getType().isBomb()) {
            throw new InvalidTrickException();
        }
        if (prevTrick != null) {
            assert prevTrick.getType() != TrickType.DOG;
            if (prevTrick.getType() != trick.getType()) {
                throw new InvalidTrickException();
            }
            if (!trick.canCoverUp(prevTrick)) {
                throw new InvalidTrickException();
            }
        }

        player.playCards(cards);
        tricks.add(trick);
        game.addEvent(new TichuPlayTrickEvent(playerId, trick, wish));
        do {
            turn = (turn + 1) % 4;
        } while (round.isPlayerExited(turn));
        if (round.getWish() != null && Cards.containsWishCard(cards, round.getWish())) {
            round.setWish(null);
        }
        if (wish != null) {
            assert round.getWish() == null;
            round.setWish(wish);
        }

        if (player.getHandSize() == 0) {
            round.markPlayerAsExited(playerIndex);
            if (round.isOneTwo()) {
                status = PhaseStatus.FINISHED;
                round.finishOneTwo();
            } else if (round.isOnePlayerLeft()) {
                status = PhaseStatus.FINISHED;
                round.finish();
            }
        }

        if (trick.getType() == TrickType.DOG) {
            status = PhaseStatus.FINISHED;
            int teammateIndex = (playerIndex + 2) % 4;
            round.nextPhase(teammateIndex);
        }
    }

    public void playBomb(Long playerId, List<Card> cards) {
        if (status != PhaseStatus.PLAYING) {
            throw new InvalidTimeOfActionException();
        }

        var playerIndex = game.getPlayerIndexById(playerId);
        if (playerIndex != turn && tricks.isEmpty()) {
            throw new InvalidTimeOfActionException();
        }

        if (cards.isEmpty() || !Cards.areDistinct(cards)) {
            throw new InvalidBombException();
        }

        var player = game.getPlayer(playerIndex);
        if (player.doNotHaveSomeCards(cards)) {
            throw new InvalidBombException();
        }

        var prevTrick = tricks.isEmpty() ? null : tricks.getLast();
        var trick = TrickBuilder.of(playerIndex, cards, prevTrick).build();
        if (trick == null || !trick.getType().isBomb()) {
            throw new InvalidBombException();
        }

        if (prevTrick != null) {
            assert prevTrick.getType() != TrickType.DOG;
            if (!trick.canCoverUp(prevTrick)) {
                throw new InvalidTrickException();
            }
        }

        player.playCards(cards);
        tricks.add(trick);
        game.addEvent(new TichuPlayBombEvent(playerId, trick));
        turn = playerIndex + 1;
        while (round.isPlayerExited(turn)) {
            turn = (turn + 1) % 4;
        }
        if (round.getWish() != null && Cards.containsWishCard(cards, round.getWish())) {
            round.setWish(null);
        }

        if (player.getHandSize() == 0) {
            round.markPlayerAsExited(playerIndex);
            if (round.isOneTwo()) {
                status = PhaseStatus.FINISHED;
                round.finishOneTwo();
            } else if (round.isOnePlayerLeft()) {
                status = PhaseStatus.FINISHED;
                round.finish();
            }
        }
    }

    public void pass(Long playerId) {
        if (status != PhaseStatus.PLAYING) {
            throw new InvalidTimeOfActionException();
        }

        var playerIndex = game.getPlayerIndexById(playerId);
        if (playerIndex != turn) {
            throw new InvalidTimeOfActionException();
        }
        if (tricks.isEmpty()) {
            throw new InvalidTimeOfActionException();
        }

        // Must fulfill the wish if it's possible.
        var player = game.getPlayer(playerIndex);
        var prevTrick = tricks.getLast();
        if (round.getWish() != null && player.canPlayWishCard(round.getWish(), prevTrick)
        ) {
            throw new InvalidPassException();
        }

        game.addEvent(new TichuPassEvent(playerId));
        do {
            turn = (turn + 1) % 4;

            if (turn == prevTrick.getPlayerIndex()) {
                if (prevTrick instanceof SingleTrick singleTrick && singleTrick.getCard() instanceof DragonCard) {
                    status = PhaseStatus.WAITING_DRAGON_SELECTION;
                    game.addEvent(new TichuPhaseEndWithDragonEvent(prevTrick.getPlayerIndex()));
                    break;
                }

                var lastTrickedPlayer = game.getPlayer(prevTrick.getPlayerIndex());
                var allPlayedCards = tricks.stream().flatMap(trick -> trick.getCards().stream()).toList();
                lastTrickedPlayer.addScoreCards(allPlayedCards);

                status = PhaseStatus.FINISHED;
                round.nextPhase(prevTrick.getPlayerIndex());

                break;
            }
        } while (round.isPlayerExited(turn));
    }

    public void selectDragonReceiver(Long playerId, boolean giveRight) {
        if (status != PhaseStatus.WAITING_DRAGON_SELECTION) {
            throw new InvalidTimeOfActionException();
        }

        var playerIndex = game.getPlayerIndexById(playerId);
        if (playerIndex != turn) {
            throw new InvalidTimeOfActionException();
        }
        var lastTrick = tricks.getLast();
        if (!(lastTrick instanceof SingleTrick singleTrick && singleTrick.getCard() instanceof DragonCard)) {
            throw new InvalidTimeOfActionException();
        }
        if (playerIndex != lastTrick.getPlayerIndex()) {
            throw new InvalidTimeOfActionException();
        }

        var receiverIndex = (playerIndex + (giveRight ? 1 : 3)) % 4;
        var receiver = game.getPlayer(receiverIndex);
        var allPlayedCards = tricks.stream().flatMap(trick -> trick.getCards().stream()).toList();
        receiver.addScoreCards(allPlayedCards);
        game.addEvent(new TichuSelectDragonReceiverEvent(receiver.getId()));

        status = PhaseStatus.FINISHED;
        round.nextPhase(playerIndex);
    }
}
