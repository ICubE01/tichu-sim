package com.icube.sim.tichu.rooms;

import com.icube.sim.tichu.games.common.domain.GameName;
import lombok.Data;

@Data
public class RoomOpaqueDto {
    private String id;
    private String name;
    private int memberCount;
    private GameName gameName;
    private boolean hasGameStarted;
}
