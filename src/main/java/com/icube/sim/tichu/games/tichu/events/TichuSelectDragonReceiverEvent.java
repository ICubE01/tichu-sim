package com.icube.sim.tichu.games.tichu.events;

import lombok.Getter;

@Getter
public class TichuSelectDragonReceiverEvent extends TichuEvent {
    private final long receiverId;

    public TichuSelectDragonReceiverEvent(long receiverId) {
        this.receiverId = receiverId;
    }
}
