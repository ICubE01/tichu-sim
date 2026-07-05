package com.icube.sim.tichu.games.hanabi.events;

import com.icube.sim.tichu.games.hanabi.cards.HanabiCard;
import lombok.Getter;
import org.jspecify.annotations.Nullable;

@Getter
public class HanabiResolveRecoverToDeckEvent extends HanabiEvent {
    private final long playerId;
    private final HanabiCard card;
    @Nullable
    private final HanabiCard drawnCard;

    public HanabiResolveRecoverToDeckEvent(long playerId, HanabiCard card, @Nullable HanabiCard drawnCard) {
        this.playerId = playerId;
        this.card = card;
        this.drawnCard = drawnCard;
    }
}
