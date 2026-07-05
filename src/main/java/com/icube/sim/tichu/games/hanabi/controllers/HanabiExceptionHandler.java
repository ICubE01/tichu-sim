package com.icube.sim.tichu.games.hanabi.controllers;

import com.icube.sim.tichu.common.websocket.ErrorMessage;
import com.icube.sim.tichu.games.hanabi.exceptions.InvalidActionException;
import com.icube.sim.tichu.games.hanabi.exceptions.InvalidHintException;
import com.icube.sim.tichu.games.hanabi.exceptions.MaxClueTokensException;
import com.icube.sim.tichu.games.hanabi.exceptions.NoClueTokensException;
import com.icube.sim.tichu.games.hanabi.exceptions.NotYourTurnException;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.web.bind.annotation.ControllerAdvice;

@ControllerAdvice(basePackages = "com.icube.sim.tichu.games.hanabi.controllers")
public class HanabiExceptionHandler {
    @MessageExceptionHandler(NotYourTurnException.class)
    @SendToUser("/queue/errors")
    public ErrorMessage handleNotYourTurn() {
        return new ErrorMessage("It is not your turn.");
    }

    @MessageExceptionHandler(NoClueTokensException.class)
    @SendToUser("/queue/errors")
    public ErrorMessage handleNoClueTokens() {
        return new ErrorMessage("No clue tokens available.");
    }

    @MessageExceptionHandler(MaxClueTokensException.class)
    @SendToUser("/queue/errors")
    public ErrorMessage handleMaxClueTokens() {
        return new ErrorMessage("Clue tokens are already full; cannot discard.");
    }

    @MessageExceptionHandler(InvalidHintException.class)
    @SendToUser("/queue/errors")
    public ErrorMessage handleInvalidHint() {
        return new ErrorMessage("Invalid hint.");
    }

    @MessageExceptionHandler(InvalidActionException.class)
    @SendToUser("/queue/errors")
    public ErrorMessage handleInvalidAction() {
        return new ErrorMessage("Invalid action.");
    }
}
