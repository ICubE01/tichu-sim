package com.icube.sim.tichu.rooms;

import lombok.Getter;
import lombok.Setter;

@Getter
public class Member {
    private final Long id;
    private final String name;

    @Setter
    private boolean isHost;
    @Setter
    private boolean isReady;

    @Setter
    private Room room;
    @Setter
    private int seq;

    public Member(Long id, String name) {
        this.id = id;
        this.name = name;
        this.isHost = false;
        this.isReady = false;
        this.room = null;
        this.seq = 0;
    }
}
