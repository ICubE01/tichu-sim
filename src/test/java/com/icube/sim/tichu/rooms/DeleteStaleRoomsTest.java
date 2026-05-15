package com.icube.sim.tichu.rooms;

import com.icube.sim.tichu.auth.AuthService;
import com.icube.sim.tichu.common.TimeService;
import com.icube.sim.tichu.games.common.domain.GameName;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.*;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class DeleteStaleRoomsTest {

    @Mock AuthService authService;
    @Mock RoomMapper roomMapper;
    @Mock SimpMessagingTemplate messagingTemplate;

    RoomRepository roomRepository;
    MemberRepository memberRepository;
    RoomConfig roomConfig;

    @BeforeEach
    void setUp() {
        roomRepository = new RoomRepository();
        memberRepository = new MemberRepository();
        roomConfig = new RoomConfig();
        roomConfig.setIdLength(5);
        roomConfig.setOutGameExpiration(Duration.ofHours(1).toSeconds());
        roomConfig.setInGameExpiration(Duration.ofHours(6).toSeconds());
    }

    private RoomService serviceWithClock(Clock clock) {
        return new RoomService(roomConfig, authService, roomRepository, memberRepository, roomMapper, messagingTemplate, new TimeService(clock));
    }

    @Test
    void idleRoomIsDeletedAfterOutGameExpiration() {
        var room = new Room("AAAAA", "Stale room", GameName.TICHU);
        var member = new Member(1L, "Member 1");
        room.addMember(member);
        roomRepository.save(room);
        memberRepository.save(member);

        var futureClock = Clock.fixed(Instant.now().plus(2, ChronoUnit.HOURS), ZoneOffset.UTC);
        serviceWithClock(futureClock).deleteStaleRooms();

        assertThat(roomRepository.findById("AAAAA")).isEmpty();
        assertThat(memberRepository.findById(1L)).isEmpty();
    }

    @Test
    void recentIdleRoomIsKept() {
        var room = new Room("AAAAB", "Fresh room", GameName.TICHU);
        roomRepository.save(room);

        var futureClock = Clock.fixed(Instant.now().plus(30, ChronoUnit.MINUTES), ZoneOffset.UTC);
        serviceWithClock(futureClock).deleteStaleRooms();

        assertThat(roomRepository.findById("AAAAB")).isPresent();
    }

    @Test
    void inGameRoomSurvivesOutGameExpiration() {
        var room = new Room("AAAAC", "Playing room", GameName.TICHU);
        var member1 = new Member(1L, "Member 1");
        var member2 = new Member(2L, "Member 2");
        var member3 = new Member(3L, "Member 3");
        var member4 = new Member(4L, "Member 4");
        room.addMember(member1);
        room.addMember(member2);
        room.addMember(member3);
        room.addMember(member4);
        roomRepository.save(room);
        memberRepository.save(member1);
        memberRepository.save(member2);
        memberRepository.save(member3);
        memberRepository.save(member4);
        room.startGame();

        var futureClock = Clock.fixed(Instant.now().plus(2, ChronoUnit.HOURS), ZoneOffset.UTC);
        serviceWithClock(futureClock).deleteStaleRooms();

        assertThat(roomRepository.findById("AAAAC")).isPresent();
    }

    @Test
    void inGameRoomIsDeletedAfterInGameExpiration() {
        var room = new Room("AAAAD", "Too old playing room", GameName.TICHU);
        var member1 = new Member(1L, "Member 1");
        var member2 = new Member(2L, "Member 2");
        var member3 = new Member(3L, "Member 3");
        var member4 = new Member(4L, "Member 4");
        room.addMember(member1);
        room.addMember(member2);
        room.addMember(member3);
        room.addMember(member4);
        roomRepository.save(room);
        memberRepository.save(member1);
        memberRepository.save(member2);
        memberRepository.save(member3);
        memberRepository.save(member4);
        room.startGame();

        var futureClock = Clock.fixed(Instant.now().plus(7, ChronoUnit.HOURS), ZoneOffset.UTC);
        serviceWithClock(futureClock).deleteStaleRooms();

        assertThat(roomRepository.findById("AAAAD")).isEmpty();
        assertThat(memberRepository.findById(1L)).isEmpty();
        assertThat(memberRepository.findById(2L)).isEmpty();
        assertThat(memberRepository.findById(3L)).isEmpty();
        assertThat(memberRepository.findById(4L)).isEmpty();
    }
}
