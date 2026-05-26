package com.icube.sim.tichu.games.tichu.events;

import com.icube.sim.tichu.games.tichu.tricks.Trick;
import lombok.Getter;

@Getter
public class TichuPlayBombEvent extends TichuEvent {
    private final long playerId;
    private final Trick bomb;

    public TichuPlayBombEvent(long playerId, Trick bomb) {
        this.playerId = playerId;
        this.bomb = bomb;
    }
}
