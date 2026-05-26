package com.icube.sim.tichu.games.tichu.events;

import com.icube.sim.tichu.games.common.events.GameEvent;
import lombok.Getter;
import lombok.Setter;

public abstract class TichuEvent implements GameEvent {
    @Getter @Setter
    protected String roomId = null;
}
