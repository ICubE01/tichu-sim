package com.icube.sim.tichu.rooms.dtos;

import com.icube.sim.tichu.games.common.domain.GameName;
import com.icube.sim.tichu.games.common.domain.GameRule;
import lombok.Data;

import java.util.List;

@Data
public class RoomDto {
    private String id;
    private String name;
    private List<MemberDto> members;
    private GameName gameName;
    private boolean hasGameStarted;
    private GameRule gameRule;
}
