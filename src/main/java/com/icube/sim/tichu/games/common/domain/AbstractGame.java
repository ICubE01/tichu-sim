package com.icube.sim.tichu.games.common.domain;

import com.icube.sim.tichu.games.common.events.GameEvent;
import com.icube.sim.tichu.games.common.events.GameStartEvent;
import lombok.Synchronized;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;

public abstract class AbstractGame implements Game {
    private final Queue<GameEvent> gameEvents = new LinkedList<>();

    protected AbstractGame(GameStartEvent gameStartEvent) {
        addEvent(gameStartEvent);
    }

    @Override
    @Synchronized("gameEvents")
    public void addEvent(GameEvent gameEvent) {
        gameEvents.add(gameEvent);
    }

    @Override
    @Synchronized("gameEvents")
    public List<GameEvent> drainAllEvents() {
        var drainedEvents = new ArrayList<GameEvent>();
        while (gameEvents.peek() != null) {
            drainedEvents.add(gameEvents.poll());
        }
        return drainedEvents;
    }
}
