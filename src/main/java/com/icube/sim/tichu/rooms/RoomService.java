package com.icube.sim.tichu.rooms;

import com.icube.sim.tichu.auth.AuthService;
import com.icube.sim.tichu.common.TimeService;
import lombok.Locked;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@RequiredArgsConstructor
@Service
public class RoomService {
    private final RoomConfig roomConfig;
    private final AuthService authService;
    private final TimeService timeService;
    private final RoomRepository roomRepository;
    private final MemberRepository memberRepository;
    private final RoomMapper roomMapper;
    private final MemberMessagePublisher memberMessagePublisher;

    @Locked.Read
    public List<RoomOpaqueDto> getRooms() {
        return roomRepository.findAll().stream().map(roomMapper::toOpaqueDto).toList();
    }

    @Locked.Write
    public CreateRoomResponse createRoom(CreateRoomRequest request) {
        var user = authService.getCurrentUser();
        if (memberRepository.existsById(user.getId())) {
            throw new MemberAlreadyInOneRoomException();
        }

        String id;
        do {
            id = generateRandomAlphabetString(roomConfig.getIdLength());
        } while (roomRepository.existsById(id));

        var room = new Room(id, request.getName(), request.getGameName());
        var member = new Member(user.getId(), user.getName());
        member.setHost(true);
        room.addMember(member);
        roomRepository.save(room);
        memberRepository.save(member);

        return new CreateRoomResponse(id);
    }

    @Locked.Read
    public Optional<RoomDto> getMyRoom() {
        var user = authService.getCurrentUser();
        var myRoom = memberRepository.findById(user.getId()).map(Member::getRoom);
        return myRoom.map(roomMapper::toDto);
    }

    @Locked.Read
    public RoomDto getRoom(String id) {
        var user = authService.getCurrentUser();
        var room = roomRepository.findById(id).orElseThrow(RoomNotFoundException::new);
        if (!room.containsMember(user.getId())) {
            throw new AccessDeniedException("Not a member of this room.");
        }

        return roomMapper.toDto(room);
    }

    @Locked.Write
    public void enterRoom(String id) {
        var user = authService.getCurrentUser();
        if (memberRepository.existsById(user.getId())) {
            throw new MemberAlreadyInOneRoomException();
        }

        var room = roomRepository.findById(id).orElseThrow(RoomNotFoundException::new);
        var member = new Member(user.getId(), user.getName());
        room.addMember(member);
        memberRepository.save(member);

        memberMessagePublisher.publish(room);
    }

    @Locked.Write
    public void leaveRoom(String id) {
        var user = authService.getCurrentUser();
        var member = memberRepository.findById(user.getId()).orElse(null);
        if (member == null || member.getRoom() == null || !member.getRoom().getId().equals(id)) {
            return;
        }

        var room = roomRepository.findById(id).orElseThrow(RoomNotFoundException::new);
        room.removeMember(user.getId());
        memberRepository.deleteById(user.getId());

        memberMessagePublisher.publish(room);

        if (room.getMembers().isEmpty()) {
            roomRepository.deleteById(id);
        }
    }

    @Locked.Write
    @Scheduled(fixedDelay = 1000 * 60 * 10)
    public void deleteStaleRooms() {
        var now = timeService.now();
        var staleRooms = roomRepository.findAll().stream()
                .filter(r -> {
                    if (r.hasGameStarted()) {
                        return r.sinceLastUpdate(now).toSeconds() > roomConfig.getInGameExpiration();
                    } else {
                        return r.sinceLastUpdate(now).toSeconds() > roomConfig.getOutGameExpiration();
                    }
                })
                .toList();
        for (var room : staleRooms) {
            room.getMembers().keySet().forEach(memberRepository::deleteById);
            roomRepository.deleteById(room.getId());
        }
    }

    private static String generateRandomAlphabetString(int length) {
        final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        var random = new Random();
        return IntStream.range(0, length)
                .map(i -> random.nextInt(CHARACTERS.length()))
                .mapToObj(CHARACTERS::charAt)
                .map(String::valueOf)
                .collect(Collectors.joining());
    }
}
