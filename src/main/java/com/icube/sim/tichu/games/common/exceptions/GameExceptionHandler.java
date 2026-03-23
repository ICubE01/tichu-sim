package com.icube.sim.tichu.games.common.exceptions;

import com.icube.sim.tichu.common.websocket.ErrorMessage;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.web.bind.annotation.ControllerAdvice;

@ControllerAdvice(basePackages = "com.icube.sim.tichu.games")
public class GameExceptionHandler {
    @MessageExceptionHandler(GameHasAlreadyStartedException.class)
    @SendToUser("/queue/errors")
    public ErrorMessage handleGamePlaying() {
        return new ErrorMessage("Game has already been playing.");
    }

    @MessageExceptionHandler(InvalidMemberCountException.class)
    @SendToUser("/queue/errors")
    public ErrorMessage handleInvalidMemberCount() {
        return new ErrorMessage("Invalid member count.");
    }

    @MessageExceptionHandler(ImmutableGameRuleException.class)
    @SendToUser("/queue/errors")
    public ErrorMessage handleImmutableGameRule() {
        return new ErrorMessage("Game rule is now immutable.");
    }

    @MessageExceptionHandler(InvalidGameRuleException.class)
    @SendToUser("/queue/errors")
    public ErrorMessage handleInvalidGameRule() {
        return new ErrorMessage("Game rule is invalid.");
    }

    @MessageExceptionHandler(GameNotFoundException.class)
    @SendToUser("/queue/errors")
    public ErrorMessage handleGameNotFound() {
        return new ErrorMessage("Game not found.");
    }

    @MessageExceptionHandler(InvalidTimeOfActionException.class)
    @SendToUser("/queue/errors")
    public ErrorMessage handleInvalidTimeOfAction() {
        return new ErrorMessage("The action cannot be performed at this time.");
    }
}
