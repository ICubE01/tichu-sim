package com.icube.sim.tichu.games.hanabi.events;

import com.icube.sim.tichu.games.hanabi.BonusEffect;
import com.icube.sim.tichu.games.hanabi.cards.HanabiCard;
import lombok.Getter;

@Getter
public class HanabiResolveRecoverToPlayEvent extends HanabiEvent {
    private final long playerId;
    private final int index;
    private final HanabiCard card;
    private final boolean fireworkCompleted;
    private final BonusEffect bonusEffect;
    private final HanabiCard drawnCard;

    public HanabiResolveRecoverToPlayEvent(long playerId, int index, HanabiCard card, boolean fireworkCompleted, BonusEffect bonusEffect, HanabiCard drawnCard) {
        this.playerId = playerId;
        this.index = index;
        this.card = card;
        this.fireworkCompleted = fireworkCompleted;
        this.bonusEffect = bonusEffect;
        this.drawnCard = drawnCard;
    }
}
