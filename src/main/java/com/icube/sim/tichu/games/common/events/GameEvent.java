package com.icube.sim.tichu.games.common.events;

import org.jspecify.annotations.Nullable;

public interface GameEvent {
    @Nullable String getRoomId();
    void setRoomId(String roomId);
}
