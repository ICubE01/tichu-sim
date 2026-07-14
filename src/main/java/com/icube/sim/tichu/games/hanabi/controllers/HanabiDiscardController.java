package com.icube.sim.tichu.games.hanabi.controllers;

import com.icube.sim.tichu.games.hanabi.HanabiService;
import com.icube.sim.tichu.games.hanabi.dtos.DiscardSend;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@RequiredArgsConstructor
@Controller
public class HanabiDiscardController {
    private final HanabiService hanabiService;

    @MessageMapping("/rooms/{roomId}/game/hanabi/discard")
    public void discard(
            @DestinationVariable("roomId") String roomId,
            @Payload DiscardSend discardSend,
            Principal principal
    ) {
        hanabiService.discard(roomId, discardSend, principal);
    }
}
