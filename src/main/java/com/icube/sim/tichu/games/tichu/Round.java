package com.icube.sim.tichu.games.tichu;

import com.icube.sim.tichu.games.tichu.cards.Card;
import com.icube.sim.tichu.games.tichu.cards.Cards;
import com.icube.sim.tichu.games.tichu.cards.SparrowCard;
import com.icube.sim.tichu.games.tichu.events.*;
import com.icube.sim.tichu.games.tichu.exceptions.InvalidTichuDeclarationException;
import com.icube.sim.tichu.games.common.exceptions.InvalidTimeOfActionException;
import lombok.Getter;
import lombok.Setter;
import org.jspecify.annotations.Nullable;

import java.util.*;

public class Round {
    @Getter
    private RoundStatus status;
    private final Tichu game;
    private final List<Card> deck;
    private final TichuDeclaration[] tichuDeclarations;
    private final ExchangePhase exchangePhase;
    private final List<Phase> phases;
    @Getter
    @Setter
    private Integer wish;
    private final int[] exitOrder;
    // Score order: { RED, BLUE }
    private int @Nullable [] scores;

    public Round(Tichu game) {
        this.game = game;
        this.tichuDeclarations = new TichuDeclaration[]{null, null, null, null};
        this.exchangePhase = new ExchangePhase(game, this);
        this.phases = new ArrayList<>();
        this.exitOrder = new int[]{0, 0, 0, 0};
        this.scores = null;

        this.deck = Cards.getDeck();
        Collections.shuffle(deck);
        assert deck.size() == 56;

        doFirstDraw();

        this.status = RoundStatus.WAITING_LARGE_TICHU;
    }

    private void doFirstDraw() {
        var firstDraws = new HashMap<Long, List<Card>>();

        for (var i = 0; i < 4; i++) {
            var player = game.getPlayer(i);
            player.initFirstDraws(deck.subList(i * 8, (i + 1) * 8));
            assert player.getHandSize() == 8;
            firstDraws.put(player.getId(), player.getHand());
        }

        game.addEvent(new TichuFirstDrawEvent(firstDraws));
    }

    public void largeTichu(Long playerId, boolean isLargeTichuDeclared) {
        if (status != RoundStatus.WAITING_LARGE_TICHU) {
            throw new InvalidTimeOfActionException();
        }

        var playerIndex = game.getPlayerIndexById(playerId);
        if (tichuDeclarations[playerIndex] != null) {
            throw new InvalidTichuDeclarationException();
        }
        tichuDeclarations[playerIndex] = isLargeTichuDeclared ? TichuDeclaration.LARGE : TichuDeclaration.NONE;

        game.addEvent(new TichuLargeTichuEvent(tichuDeclarations));

        if (Arrays.stream(tichuDeclarations).allMatch(Objects::nonNull)) {
            doSecondDraw();
        }
    }

    private void doSecondDraw() {
        var hands = new HashMap<Long, List<Card>>();

        for (var i = 0; i < 4; i++) {
            var player = game.getPlayer(i);
            player.addSecondDraws(deck.subList(32 + i * 6, 32 + (i + 1) * 6));
            assert player.getHandSize() == 14;
            hands.put(player.getId(), player.getHand());
        }

        game.addEvent(new TichuSecondDrawEvent(hands));

        status = RoundStatus.EXCHANGING;
    }

    public void smallTichu(Long playerId) {
        if (status == RoundStatus.WAITING_LARGE_TICHU || status == RoundStatus.FINISHED) {
            throw new InvalidTimeOfActionException();
        }

        var playerIndex = game.getPlayerIndexById(playerId);
        var player = game.getPlayer(playerIndex);
        if (player.getHandSize() != 14 || tichuDeclarations[playerIndex] != TichuDeclaration.NONE) {
            throw new InvalidTichuDeclarationException();
        }

        tichuDeclarations[playerIndex] = TichuDeclaration.SMALL;
        game.addEvent(new TichuSmallTichuEvent(player.getId()));
    }

    public ExchangePhase getExchangePhase() {
        if (status != RoundStatus.EXCHANGING) {
            throw new InvalidTimeOfActionException();
        }

        return exchangePhase;
    }

    public void finishExchangePhase() {
        assert status == RoundStatus.EXCHANGING;
        status = RoundStatus.PLAYING;

        int sparrowPlayerIndex;
        for (sparrowPlayerIndex = 0; sparrowPlayerIndex < 4; sparrowPlayerIndex++) {
            if (game.getPlayer(sparrowPlayerIndex).hasCard(new SparrowCard())) {
                break;
            }
        }
        assert sparrowPlayerIndex < 4;

        nextPhase(sparrowPlayerIndex);
    }

    public void nextPhase(int firstPlayerIndex) {
        assert status == RoundStatus.PLAYING;

        var playerIndex = firstPlayerIndex;
        while (isPlayerExited(playerIndex)) {
            playerIndex = (playerIndex + 1) % 4;
        }

        phases.add(new Phase(game, this, playerIndex));
    }

    public Phase getCurrentPhase() {
        if (status != RoundStatus.PLAYING) {
            throw new InvalidTimeOfActionException();
        }

        return phases.getLast();
    }

    public boolean isPlayerExited(int playerIndex) {
        return exitOrder[playerIndex] != 0;
    }

    public void markPlayerAsExited(int playerIndex) {
        assert exitOrder[playerIndex] == 0;
        assert game.getPlayer(playerIndex).getHandSize() == 0;

        var playerExitOrder = Arrays.stream(exitOrder).max().orElseThrow() + 1;
        exitOrder[playerIndex] = playerExitOrder;
    }

    public boolean isOneTwo() {
        return (exitOrder[0] == 1 && exitOrder[2] == 2)
                || (exitOrder[1] == 1 && exitOrder[3] == 2)
                || (exitOrder[2] == 1 && exitOrder[0] == 2)
                || (exitOrder[3] == 1 && exitOrder[1] == 2);
    }

    public void finishOneTwo() {
        assert status == RoundStatus.PLAYING;
        assert isOneTwo();
        assert Arrays.stream(exitOrder).sorted().boxed().toList().equals(List.of(0, 0, 1, 2));
        assert scores == null;

        status = RoundStatus.FINISHED;
        scores = new int[]{0, 0};

        calcTichuDeclarationScores();
        for (var i = 0; i < 4; i++) {
            var teamIndex = i % 2;
            if (exitOrder[i] != 0) {
                scores[teamIndex] += 100;
                assert game.getPlayer(i).getHandSize() == 0;
            }
            var player = game.getPlayer(i);
            player.clearCards();
        }

        game.nextRound();
    }

    public boolean isOnePlayerLeft() {
        return Arrays.stream(exitOrder).filter(exitOrder -> exitOrder == 0).count() == 1;
    }

    public void finish() {
        assert status == RoundStatus.PLAYING;
        assert Arrays.stream(exitOrder).sorted().boxed().toList().equals(List.of(0, 1, 2, 3));
        assert scores == null;

        status = RoundStatus.FINISHED;
        scores = new int[]{0, 0};

        calcTichuDeclarationScores();
        for (var i = 0; i < 4; i++) {
            var teamIndex = i % 2;
            var player = game.getPlayer(i);
            if (exitOrder[i] != 0) {
                scores[teamIndex] += player.sumScore();
                assert player.getHandSize() == 0;
            } else {
                var firstPlayerTeamIndex = Arrays.stream(exitOrder).boxed().toList().indexOf(1) % 2;
                scores[firstPlayerTeamIndex] += player.sumScore();
                scores[(teamIndex + 1) % 2] += player.sumScoreInHand();
            }
            player.clearCards();
        }

        game.nextRound();
    }

    private void calcTichuDeclarationScores() {
        assert scores != null;
        for (var i = 0; i < 4; i++) {
            var teamIndex = i % 2;
            switch (tichuDeclarations[i]) {
                case NONE -> {
                }
                case SMALL -> {
                    if (exitOrder[i] == 1) {
                        scores[teamIndex] += 100;
                    } else {
                        scores[teamIndex] -= 100;
                    }
                }
                case LARGE -> {
                    if (exitOrder[i] == 1) {
                        scores[teamIndex] += 200;
                    } else {
                        scores[teamIndex] -= 200;
                    }
                }
            }
        }
    }

    public TichuDeclaration[] getTichuDeclarations() {
        return tichuDeclarations.clone();
    }

    public int[] getExitOrder() {
        return exitOrder.clone();
    }

    public int[] getScores() {
        return scores == null ? null : scores.clone();
    }
}
