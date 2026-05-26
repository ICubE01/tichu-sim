package com.icube.sim.tichu.chat;

import org.springframework.messaging.handler.annotation.*;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
public class ChatController {
    @MessageMapping("/rooms/{roomId}/chat")
    @SendTo("/topic/rooms/{roomId}/chat")
    public ChatMessage chat(
            @DestinationVariable("roomId") String roomId,
            @Payload ChatSend chatSend,
            Principal principal
    ) {
        var userId = Long.parseLong(principal.getName());
        return new ChatMessage(userId, chatSend.getMessage());
    }
}
