package com.icube.sim.tichu.games.hanabi.controllers;

import com.icube.sim.tichu.games.hanabi.HanabiService;
import com.icube.sim.tichu.games.hanabi.dtos.PlaySend;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@RequiredArgsConstructor
@Controller
public class HanabiPlayController {
    private final HanabiService hanabiService;

    @MessageMapping("/rooms/{roomId}/game/hanabi/play")
    public void play(
            @DestinationVariable("roomId") String roomId,
            @Payload PlaySend playSend,
            Principal principal
    ) {
        hanabiService.play(roomId, playSend, principal);
    }
}
