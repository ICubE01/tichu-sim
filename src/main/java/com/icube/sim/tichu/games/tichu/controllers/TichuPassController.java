package com.icube.sim.tichu.games.tichu.controllers;

import com.icube.sim.tichu.common.websocket.ErrorMessage;
import com.icube.sim.tichu.games.tichu.TichuService;
import com.icube.sim.tichu.games.tichu.exceptions.InvalidPassException;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@RequiredArgsConstructor
@Controller
public class TichuPassController {
    private final TichuService tichuService;

    @MessageMapping("/rooms/{roomId}/game/tichu/pass")
    public void pass(@DestinationVariable("roomId") String roomId, Principal principal) {
        tichuService.pass(roomId, principal);
    }

    @MessageExceptionHandler(InvalidPassException.class)
    @SendToUser("/queue/errors")
    public ErrorMessage handleInvalidPass() {
        return new ErrorMessage("Invalid pass.");
    }
}
