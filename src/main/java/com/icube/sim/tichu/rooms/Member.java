package com.icube.sim.tichu.rooms;

import lombok.Getter;
import lombok.Setter;

@Getter
public class Member {
    private final Long id;
    private final String name;

    @Setter
    private Room room;
    @Setter
    private int seq;

    public Member(Long id, String name) {
        this.id = id;
        this.name = name;
        this.room = null;
        this.seq = 0;
    }
}
