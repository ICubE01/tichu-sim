package com.icube.sim.tichu.games.tichu;

import com.icube.sim.tichu.games.tichu.cards.Card;
import com.icube.sim.tichu.games.tichu.events.TichuExchangeEvent;
import com.icube.sim.tichu.games.tichu.exceptions.InvalidExchangeException;
import org.jspecify.annotations.Nullable;

import java.util.Arrays;
import java.util.List;
import java.util.Objects;

public class ExchangePhase {
    private final Tichu game;
    private final Round round;
    // exchangingCards[i][j] = card to be exchanged from player i to player ((i + j + 1) % 4)
    private final Card[][] exchangingCards;

    public ExchangePhase(Tichu game, Round round) {
        this.game = game;
        this.round = round;
        this.exchangingCards = new Card[4][3];
    }

    public void queueExchange(
            Long playerId,
            @Nullable Card leftCard,
            @Nullable Card midCard,
            @Nullable Card rightCard
    ) {
        var playerIndex = game.getPlayerIndexById(playerId);

        checkExchange(leftCard, midCard, rightCard, game.getPlayer(playerIndex));

        exchangingCards[playerIndex][0] = rightCard;
        exchangingCards[playerIndex][1] = midCard;
        exchangingCards[playerIndex][2] = leftCard;

        if (isExchangeFullyQueued()) {
            doExchange();
        }
    }

    public void checkExchange(Card leftCard, Card midCard, Card rightCard, Player player) {
        if (leftCard == null && midCard == null && rightCard == null) {
            throw new InvalidExchangeException();
        }
        if (leftCard != null && (leftCard.equals(midCard) || leftCard.equals(rightCard) || !player.hasCard(leftCard))) {
            throw new InvalidExchangeException();
        }
        if (midCard != null && (midCard.equals(rightCard) || !player.hasCard(midCard))) {
            throw new InvalidExchangeException();
        }
        if (rightCard != null && !player.hasCard(rightCard)) {
            throw new InvalidExchangeException();
        }
    }

    public boolean isExchangeFullyQueued() {
        return Arrays.stream(exchangingCards).allMatch(playerExchangeCards ->
                Arrays.stream(playerExchangeCards).allMatch(Objects::nonNull));
    }

    public void doExchange() {
        assert isExchangeFullyQueued();

        var exchangeEvent = TichuExchangeEvent.of(game, exchangingCards);
        for (var i = 0; i < 4; i++) {
            var player = game.getPlayer(i);
            var cardsGave = List.of(exchangeEvent.getCardsGaveFrom(player.getId()));
            var cardsReceived = exchangeEvent.getCardsReceived(player.getId());
            player.exchange(cardsGave, cardsReceived);
        }

        game.addEvent(exchangeEvent);

        round.finishExchangePhase();
    }

    public Card[] getExchange(Long playerId) {
        return exchangingCards[game.getPlayerIndexById(playerId)];
    }
}
