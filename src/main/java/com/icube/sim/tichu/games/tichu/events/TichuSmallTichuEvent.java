package com.icube.sim.tichu.games.tichu.events;

import lombok.Getter;

@Getter
public class TichuSmallTichuEvent extends TichuEvent {
    private final long playerId;

    public TichuSmallTichuEvent(long playerId) {
        this.playerId = playerId;
    }
}
