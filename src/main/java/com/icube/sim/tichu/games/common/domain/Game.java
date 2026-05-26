package com.icube.sim.tichu.games.common.domain;

import com.icube.sim.tichu.games.common.events.GameEvent;

import java.util.List;

public interface Game {
    void addEvent(GameEvent gameEvent);
    List<GameEvent> drainAllEvents();
}
