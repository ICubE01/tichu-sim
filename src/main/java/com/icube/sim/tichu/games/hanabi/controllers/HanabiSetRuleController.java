package com.icube.sim.tichu.games.hanabi.controllers;

import com.icube.sim.tichu.games.hanabi.HanabiRule;
import com.icube.sim.tichu.games.hanabi.HanabiService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@RequiredArgsConstructor
@Controller
public class HanabiSetRuleController {
    private final HanabiService hanabiService;

    @MessageMapping("/rooms/{roomId}/game/hanabi/set-rule")
    public void setRule(
            @DestinationVariable("roomId") String roomId,
            @Payload HanabiRule rule,
            Principal principal
    ) {
        hanabiService.setRule(roomId, rule, principal);
    }
}
