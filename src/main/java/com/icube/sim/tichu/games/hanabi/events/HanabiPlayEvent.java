package com.icube.sim.tichu.games.hanabi.events;

import com.icube.sim.tichu.games.hanabi.BonusEffect;
import com.icube.sim.tichu.games.hanabi.cards.HanabiCard;
import lombok.Getter;
import org.jspecify.annotations.Nullable;

/**
 * A card was played. {@code success} distinguishes a legal play from a misplay; the drawn
 * replacement is null when the deck was empty and is masked from the actor by the handler.
 */
@Getter
public class HanabiPlayEvent extends HanabiEvent {
    private final long playerId;
    private final int index;
    private final HanabiCard playedCard;
    private final boolean success;
    private final boolean fireworkCompleted;
    @Nullable
    private final BonusEffect bonusEffect;
    @Nullable
    private final HanabiCard drawnCard;

    public HanabiPlayEvent(long playerId,
                           int index,
                           HanabiCard playedCard,
                           boolean success,
                           boolean fireworkCompleted,
                           @Nullable BonusEffect bonusEffect,
                           @Nullable HanabiCard drawnCard) {
        this.playerId = playerId;
        this.index = index;
        this.playedCard = playedCard;
        this.success = success;
        this.fireworkCompleted = fireworkCompleted;
        this.bonusEffect = bonusEffect;
        this.drawnCard = drawnCard;
    }
}
