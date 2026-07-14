package com.icube.sim.tichu.games.hanabi.controllers;

import com.icube.sim.tichu.games.hanabi.HanabiService;
import com.icube.sim.tichu.games.hanabi.dtos.HintSend;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@RequiredArgsConstructor
@Controller
public class HanabiHintController {
    private final HanabiService hanabiService;

    @MessageMapping("/rooms/{roomId}/game/hanabi/hint")
    public void hint(
            @DestinationVariable("roomId") String roomId,
            @Payload HintSend hintSend,
            Principal principal
    ) {
        hanabiService.giveHint(roomId, hintSend, principal);
    }
}
