package com.icube.sim.tichu.games.tichu.events;

import com.icube.sim.tichu.games.common.events.GameStartEvent;
import com.icube.sim.tichu.games.tichu.Player;
import lombok.Getter;

@Getter
public class TichuStartEvent extends TichuEvent implements GameStartEvent {
    private final Player[] players;

    public TichuStartEvent(Player[] players) {
        this.players = players;
    }
}
