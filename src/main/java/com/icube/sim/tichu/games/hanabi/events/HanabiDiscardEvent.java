package com.icube.sim.tichu.games.hanabi.events;

import com.icube.sim.tichu.games.hanabi.cards.HanabiCard;
import lombok.Getter;
import org.jspecify.annotations.Nullable;

/**
 * A card was discarded. The drawn replacement is null when the deck was empty; the handler masks it
 * from the discarder when building each viewer's message.
 */
@Getter
public class HanabiDiscardEvent extends HanabiEvent {
    private final long playerId;
    private final int index;
    private final HanabiCard discardedCard;
    @Nullable
    private final HanabiCard drawnCard;

    public HanabiDiscardEvent(long playerId, int index, HanabiCard discardedCard, @Nullable HanabiCard drawnCard) {
        this.playerId = playerId;
        this.index = index;
        this.discardedCard = discardedCard;
        this.drawnCard = drawnCard;
    }
}
