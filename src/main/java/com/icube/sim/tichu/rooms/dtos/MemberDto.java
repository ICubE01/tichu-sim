package com.icube.sim.tichu.rooms.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;

@AllArgsConstructor
@Data
public class MemberDto {
    private Long id;
    private String name;
    private Boolean isHost;
    private Boolean isReady;
}
