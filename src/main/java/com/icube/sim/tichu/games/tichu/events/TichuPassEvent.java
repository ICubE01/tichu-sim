package com.icube.sim.tichu.games.tichu.events;

import lombok.Getter;

@Getter
public class TichuPassEvent extends TichuEvent {
    private final long playerId;

    public TichuPassEvent(long playerId) {
        this.playerId = playerId;
    }
}
