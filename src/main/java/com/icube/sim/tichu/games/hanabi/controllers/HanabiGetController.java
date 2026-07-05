package com.icube.sim.tichu.games.hanabi.controllers;

import com.icube.sim.tichu.games.hanabi.HanabiService;
import com.icube.sim.tichu.games.hanabi.dtos.HanabiMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@RequiredArgsConstructor
@Controller
public class HanabiGetController {
    private final HanabiService hanabiService;

    @MessageMapping("/rooms/{roomId}/game/hanabi/get")
    @SendToUser("/queue/game/hanabi")
    public HanabiMessage get(
            @DestinationVariable("roomId") String roomId,
            Principal principal
    ) {
        var dto = hanabiService.get(roomId, principal);
        return HanabiMessage.state(dto);
    }
}
