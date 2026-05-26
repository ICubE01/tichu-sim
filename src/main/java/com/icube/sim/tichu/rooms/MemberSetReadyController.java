package com.icube.sim.tichu.rooms;

import com.icube.sim.tichu.common.websocket.ErrorMessage;
import com.icube.sim.tichu.rooms.dtos.SetReadyRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@RequiredArgsConstructor
@Controller
public class MemberSetReadyController {
    private final RoomService roomService;

    @MessageMapping("/rooms/{roomId}/set-ready")
    public void setReady(@DestinationVariable("roomId") String roomId,
                         @Payload SetReadyRequest request,
                         Principal principal) {
        var userId = Long.valueOf(principal.getName());
        roomService.setReady(roomId, userId, request.ready());
    }

    @MessageExceptionHandler(RoomNotFoundException.class)
    @SendToUser("/queue/errors")
    public ErrorMessage handleRoomNotFound() {
        return new ErrorMessage("Room not found.");
    }
}
