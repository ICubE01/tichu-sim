package com.icube.sim.tichu.games.hanabi.controllers;

import com.icube.sim.tichu.games.hanabi.HanabiService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@RequiredArgsConstructor
@Controller
public class HanabiStartController {
    private final HanabiService hanabiService;

    @MessageMapping("/rooms/{roomId}/game/hanabi/start")
    public void start(@DestinationVariable("roomId") String roomId, Principal principal) {
        hanabiService.start(roomId, principal);
    }
}
