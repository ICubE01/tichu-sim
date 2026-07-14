package com.icube.sim.tichu.games.hanabi.controllers;

import com.icube.sim.tichu.games.hanabi.HanabiService;
import com.icube.sim.tichu.games.hanabi.dtos.ResolveBonusSend;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@RequiredArgsConstructor
@Controller
public class HanabiResolveBonusController {
    private final HanabiService hanabiService;

    @MessageMapping("/rooms/{roomId}/game/hanabi/resolve-bonus")
    public void resolveBonus(
            @DestinationVariable("roomId") String roomId,
            @Payload ResolveBonusSend resolveBonusSend,
            Principal principal
    ) {
        hanabiService.resolveBonus(roomId, resolveBonusSend, principal);
    }
}
