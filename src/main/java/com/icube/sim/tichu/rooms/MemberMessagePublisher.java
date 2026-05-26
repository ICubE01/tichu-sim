package com.icube.sim.tichu.rooms;

import com.icube.sim.tichu.rooms.dtos.MemberMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@RequiredArgsConstructor
@Component
public class MemberMessagePublisher {
    private final SimpMessagingTemplate messagingTemplate;
    private final RoomMapper roomMapper;

    public void publish(Room room) {
        var memberMessage = new MemberMessage(roomMapper.membersMapToDtoList(room.getMembers()));
        messagingTemplate.convertAndSend("/topic/rooms/" + room.getId() + "/members", memberMessage);
    }
}
