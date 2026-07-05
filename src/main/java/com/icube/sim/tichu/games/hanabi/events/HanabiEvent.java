package com.icube.sim.tichu.games.hanabi.events;

import com.icube.sim.tichu.games.common.events.GameEvent;
import lombok.Getter;
import lombok.Setter;
import org.jspecify.annotations.Nullable;

public abstract class HanabiEvent implements GameEvent {
    @Getter
    @Setter
    @Nullable
    private String roomId;
}
