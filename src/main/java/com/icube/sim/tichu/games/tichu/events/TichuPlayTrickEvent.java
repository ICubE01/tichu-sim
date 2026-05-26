package com.icube.sim.tichu.games.tichu.events;

import com.icube.sim.tichu.games.tichu.tricks.Trick;
import lombok.Getter;

@Getter
public class TichuPlayTrickEvent extends TichuEvent {
    private final long playerId;
    private final Trick trick;
    private final Integer wish;

    public TichuPlayTrickEvent(long playerId, Trick trick, Integer wish) {
        this.playerId = playerId;
        this.trick = trick;
        this.wish = wish;
    }
}
