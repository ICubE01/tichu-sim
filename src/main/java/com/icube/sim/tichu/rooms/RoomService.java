package com.icube.sim.tichu.rooms;

import com.icube.sim.tichu.auth.AuthService;
import lombok.Locked;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@RequiredArgsConstructor
@Service
public class RoomService {
    @Value("${spring.rooms.id-length}")
    private int ROOM_ID_LENGTH;
    private final AuthService authService;
    private final RoomRepository roomRepository;
    private final MemberRepository memberRepository;
    private final RoomMapper roomMapper;
    private final SimpMessagingTemplate messagingTemplate;

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
            id = generateRandomAlphabetString(ROOM_ID_LENGTH);
        } while (roomRepository.existsById(id));

        var room = new Room(id, request.getName(), request.getGameName());
        var member = new Member(user.getId(), user.getName());
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

        notifyEnter(id, user.getId(), user.getName());
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

        notifyLeave(id, user.getId(), user.getName());

        if (room.getMembers().isEmpty()) {
            roomRepository.deleteById(id);
        }
    }

    private void notifyEnter(String roomId, Long userId, String userName) {
        var chatMessage = MemberMessage.enter(userId, userName);
        messagingTemplate.convertAndSend("/topic/rooms/" + roomId + "/members", chatMessage);
    }

    private void notifyLeave(String roomId, Long userId, String userName) {
        var chatMessage = MemberMessage.leave(userId, userName);
        messagingTemplate.convertAndSend("/topic/rooms/" + roomId + "/members", chatMessage);
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
